import { BadRequestException, Inject, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import type { SupabaseClient } from '@supabase/supabase-js';
import * as firebaseAdmin from 'firebase-admin';
import * as webpush from 'web-push';
import { createHash } from 'node:crypto';
import { SUPABASE_ADMIN } from '../../database/database.tokens';
import type { RegisterNotificationDeviceDto } from './notification.dto';

export type NotificationOwnerType = 'member' | 'technician' | 'admin';
export type NotificationChannel = 'fcm' | 'web_push';
export type NotificationStatus = 'queued' | 'sent' | 'failed' | 'skipped';

export type NotificationEvent = {
  id: string;
  ownerType: NotificationOwnerType;
  ownerId: string;
  channel: NotificationChannel | null;
  eventType: string;
  title: string;
  body: string;
  status: NotificationStatus;
  errorMessage: string | null;
  targetTable: string | null;
  targetId: string | null;
  createdAt: string;
  sentAt: string | null;
  payload: unknown;
};

type DeviceRow = {
  id: string;
  owner_type: NotificationOwnerType;
  owner_id: string;
  channel: NotificationChannel;
  token: string | null;
  endpoint: string;
  subscription: Record<string, unknown> | null;
  enabled: boolean;
};

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private webPushConfigured = false;

  constructor(@Inject(SUPABASE_ADMIN) private readonly sb: SupabaseClient | null) {}

  private db(): SupabaseClient {
    if (!this.sb) {
      throw new ServiceUnavailableException('Notification APIs require SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    return this.sb;
  }

  async registerDevice(
    ownerType: NotificationOwnerType,
    ownerId: string,
    dto: RegisterNotificationDeviceDto,
    userAgent?: string,
  ) {
    const endpoint = notificationEndpoint(dto);
    const row = {
      owner_type: ownerType,
      owner_id: ownerId,
      channel: dto.channel,
      token: dto.channel === 'fcm' ? dto.token?.trim() ?? endpoint : null,
      endpoint,
      subscription: dto.channel === 'web_push' ? dto.subscription ?? null : null,
      platform: dto.platform?.trim() || (dto.channel === 'web_push' ? 'web' : 'unknown'),
      device_label: dto.deviceLabel?.trim() || null,
      user_agent: userAgent?.slice(0, 500) ?? null,
      enabled: true,
      last_seen_at: new Date().toISOString(),
      endpoint_hash: endpointHash(endpoint),
    };
    const { data, error } = await this.db()
      .from('notification_devices')
      .upsert(row, { onConflict: 'owner_type,owner_id,channel,endpoint_hash' })
      .select('*')
      .single();
    if (error) throw new BadRequestException(error.message);
    return mapDevice(data as Record<string, unknown>);
  }

  async notifyOwners(args: {
    ownerType: NotificationOwnerType;
    ownerIds: string[];
    eventType: string;
    title: string;
    body: string;
    payload?: Record<string, unknown>;
    targetTable?: string;
    targetId?: string;
  }): Promise<NotificationEvent[]> {
    const ownerIds = [...new Set(args.ownerIds.map((x) => String(x ?? '').trim()).filter(Boolean))];
    if (ownerIds.length === 0) return [];

    const { data, error } = await this.db()
      .from('notification_devices')
      .select('*')
      .eq('owner_type', args.ownerType)
      .in('owner_id', ownerIds)
      .eq('enabled', true);
    if (error) {
      if (missingRelation(error.message)) {
        return Promise.all(
          ownerIds.map((ownerId) =>
            this.logEvent({
              ownerType: args.ownerType,
              ownerId,
              channel: null,
              eventType: args.eventType,
              title: args.title,
              body: args.body,
              status: 'skipped',
              errorMessage: 'notification_devices table not installed',
              payload: args.payload,
              targetTable: args.targetTable,
              targetId: args.targetId,
            }),
          ),
        );
      }
      throw new BadRequestException(error.message);
    }

    const devices = ((data ?? []) as DeviceRow[]).filter((d) => d.enabled);
    if (devices.length === 0) {
      return Promise.all(
        ownerIds.map((ownerId) =>
          this.logEvent({
            ownerType: args.ownerType,
            ownerId,
            channel: null,
            eventType: args.eventType,
            title: args.title,
            body: args.body,
            status: 'skipped',
            errorMessage: 'no enabled notification device',
            payload: args.payload,
            targetTable: args.targetTable,
            targetId: args.targetId,
          }),
        ),
      );
    }

    const out: NotificationEvent[] = [];
    for (const device of devices) {
      const result = await this.sendToDevice(device, args.title, args.body, args.payload ?? {});
      out.push(
        await this.logEvent({
          ownerType: device.owner_type,
          ownerId: device.owner_id,
          channel: device.channel,
          eventType: args.eventType,
          title: args.title,
          body: args.body,
          status: result.status,
          errorMessage: result.errorMessage,
          payload: args.payload,
          targetTable: args.targetTable,
          targetId: args.targetId,
          deviceId: device.id,
        }),
      );
    }
    return out;
  }

  async listEvents(limit = 500): Promise<NotificationEvent[]> {
    const { data, error } = await this.db()
      .from('notification_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Math.max(1, Math.min(1000, limit)));
    if (error) throw new BadRequestException(error.message);
    return ((data ?? []) as Record<string, unknown>[]).map(mapEvent);
  }

  private async sendToDevice(
    device: DeviceRow,
    title: string,
    body: string,
    payload: Record<string, unknown>,
  ): Promise<{ status: NotificationStatus; errorMessage: string | null }> {
    try {
      if (device.channel === 'fcm') return await this.sendFcm(device, title, body, payload);
      if (device.channel === 'web_push') return await this.sendWebPush(device, title, body, payload);
      return { status: 'skipped', errorMessage: 'unsupported channel' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`push send failed: ${message}`);
      return { status: 'failed', errorMessage: message };
    }
  }

  private async sendFcm(
    device: DeviceRow,
    title: string,
    body: string,
    payload: Record<string, unknown>,
  ): Promise<{ status: NotificationStatus; errorMessage: string | null }> {
    const app = this.firebaseApp();
    const token = device.token?.trim() || device.endpoint;
    if (!app || !token) return { status: 'skipped', errorMessage: 'Firebase Admin env not configured' };
    await firebaseAdmin.messaging(app).send({
      token,
      notification: { title, body },
      data: stringifyPayload(payload),
    });
    return { status: 'sent', errorMessage: null };
  }

  private async sendWebPush(
    device: DeviceRow,
    title: string,
    body: string,
    payload: Record<string, unknown>,
  ): Promise<{ status: NotificationStatus; errorMessage: string | null }> {
    if (!this.configureWebPush()) return { status: 'skipped', errorMessage: 'VAPID env not configured' };
    if (!device.subscription) return { status: 'skipped', errorMessage: 'missing web push subscription' };
    await webpush.sendNotification(
      device.subscription as unknown as webpush.PushSubscription,
      JSON.stringify({ title, body, payload }),
    );
    return { status: 'sent', errorMessage: null };
  }

  private firebaseApp(): firebaseAdmin.app.App | null {
    if (firebaseAdmin.apps.length > 0) return firebaseAdmin.apps[0] ?? null;
    const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
    try {
      if (json) {
        const parsed = JSON.parse(json) as firebaseAdmin.ServiceAccount;
        return firebaseAdmin.initializeApp({ credential: firebaseAdmin.credential.cert(parsed) });
      }
      const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
      if (!projectId || !clientEmail || !privateKey) return null;
      return firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert({ projectId, clientEmail, privateKey }),
      });
    } catch (error) {
      this.logger.warn(`firebase init failed: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }

  private configureWebPush(): boolean {
    if (this.webPushConfigured) return true;
    const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY?.trim();
    const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim();
    const subject = process.env.WEB_PUSH_VAPID_SUBJECT?.trim() || 'mailto:chldngur89@gmail.com';
    if (!publicKey || !privateKey) return false;
    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.webPushConfigured = true;
    return true;
  }

  private async logEvent(args: {
    ownerType: NotificationOwnerType;
    ownerId: string;
    channel: NotificationChannel | null;
    eventType: string;
    title: string;
    body: string;
    status: NotificationStatus;
    errorMessage?: string | null;
    payload?: unknown;
    targetTable?: string;
    targetId?: string;
    deviceId?: string | null;
  }): Promise<NotificationEvent> {
    const now = new Date().toISOString();
    const row = {
      owner_type: args.ownerType,
      owner_id: args.ownerId,
      channel: args.channel,
      event_type: args.eventType,
      title: args.title,
      body: args.body,
      status: args.status,
      error_message: args.errorMessage ?? null,
      payload: args.payload ?? {},
      target_table: args.targetTable ?? null,
      target_id: args.targetId ?? null,
      device_id: args.deviceId ?? null,
      sent_at: args.status === 'sent' ? now : null,
    };
    const { data, error } = await this.db().from('notification_events').insert(row).select('*').single();
    if (error) {
      if (missingRelation(error.message)) {
        return {
          id: `local-${Date.now()}`,
          ownerType: args.ownerType,
          ownerId: args.ownerId,
          channel: args.channel,
          eventType: args.eventType,
          title: args.title,
          body: args.body,
          status: args.status,
          errorMessage: args.errorMessage ?? 'notification_events table not installed',
          targetTable: args.targetTable ?? null,
          targetId: args.targetId ?? null,
          createdAt: now,
          sentAt: row.sent_at,
          payload: args.payload ?? {},
        };
      }
      throw new BadRequestException(error.message);
    }
    return mapEvent(data as Record<string, unknown>);
  }
}

function notificationEndpoint(dto: RegisterNotificationDeviceDto): string {
  if (dto.channel === 'fcm') {
    const token = dto.token?.trim();
    if (!token) throw new BadRequestException('FCM token required');
    return token;
  }
  const endpoint =
    dto.token?.trim() ||
    (typeof dto.subscription?.endpoint === 'string' ? dto.subscription.endpoint.trim() : '');
  if (!endpoint) throw new BadRequestException('Web Push endpoint required');
  return endpoint;
}

function endpointHash(endpoint: string): string {
  return createHash('sha256').update(endpoint).digest('hex');
}

function stringifyPayload(payload: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(payload)) {
    out[key] = typeof value === 'string' ? value : JSON.stringify(value);
  }
  return out;
}

function missingRelation(message: string): boolean {
  return /schema cache|could not find the table|relation .* does not exist/i.test(message);
}

function mapDevice(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    ownerType: String(row.owner_type),
    ownerId: String(row.owner_id),
    channel: String(row.channel),
    platform: row.platform == null ? null : String(row.platform),
    endpoint: String(row.endpoint ?? ''),
    enabled: row.enabled !== false,
    lastSeenAt: String(row.last_seen_at ?? new Date().toISOString()),
  };
}

function mapEvent(row: Record<string, unknown>): NotificationEvent {
  return {
    id: String(row.id),
    ownerType: String(row.owner_type) as NotificationOwnerType,
    ownerId: String(row.owner_id),
    channel: row.channel == null ? null : (String(row.channel) as NotificationChannel),
    eventType: String(row.event_type ?? ''),
    title: String(row.title ?? ''),
    body: String(row.body ?? ''),
    status: String(row.status ?? 'queued') as NotificationStatus,
    errorMessage: row.error_message == null ? null : String(row.error_message),
    targetTable: row.target_table == null ? null : String(row.target_table),
    targetId: row.target_id == null ? null : String(row.target_id),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    sentAt: row.sent_at == null ? null : String(row.sent_at),
    payload: row.payload ?? {},
  };
}
