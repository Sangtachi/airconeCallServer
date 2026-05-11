"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const firebaseAdmin = __importStar(require("firebase-admin"));
const webpush = __importStar(require("web-push"));
const node_crypto_1 = require("node:crypto");
const database_tokens_1 = require("../../database/database.tokens");
let NotificationService = NotificationService_1 = class NotificationService {
    constructor(sb) {
        this.sb = sb;
        this.logger = new common_1.Logger(NotificationService_1.name);
        this.webPushConfigured = false;
    }
    db() {
        if (!this.sb) {
            throw new common_1.ServiceUnavailableException('Notification APIs require SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
        }
        return this.sb;
    }
    async registerDevice(ownerType, ownerId, dto, userAgent) {
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
        if (error)
            throw new common_1.BadRequestException(error.message);
        return mapDevice(data);
    }
    async notifyOwners(args) {
        const ownerIds = [...new Set(args.ownerIds.map((x) => String(x ?? '').trim()).filter(Boolean))];
        if (ownerIds.length === 0)
            return [];
        const { data, error } = await this.db()
            .from('notification_devices')
            .select('*')
            .eq('owner_type', args.ownerType)
            .in('owner_id', ownerIds)
            .eq('enabled', true);
        if (error) {
            if (missingRelation(error.message)) {
                return Promise.all(ownerIds.map((ownerId) => this.logEvent({
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
                })));
            }
            throw new common_1.BadRequestException(error.message);
        }
        const devices = (data ?? []).filter((d) => d.enabled);
        if (devices.length === 0) {
            return Promise.all(ownerIds.map((ownerId) => this.logEvent({
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
            })));
        }
        const out = [];
        for (const device of devices) {
            const result = await this.sendToDevice(device, args.title, args.body, args.payload ?? {});
            out.push(await this.logEvent({
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
            }));
        }
        return out;
    }
    async listEvents(limit = 500) {
        const { data, error } = await this.db()
            .from('notification_events')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(Math.max(1, Math.min(1000, limit)));
        if (error)
            throw new common_1.BadRequestException(error.message);
        return (data ?? []).map(mapEvent);
    }
    async sendToDevice(device, title, body, payload) {
        try {
            if (device.channel === 'fcm')
                return await this.sendFcm(device, title, body, payload);
            if (device.channel === 'web_push')
                return await this.sendWebPush(device, title, body, payload);
            return { status: 'skipped', errorMessage: 'unsupported channel' };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logger.warn(`push send failed: ${message}`);
            return { status: 'failed', errorMessage: message };
        }
    }
    async sendFcm(device, title, body, payload) {
        const app = this.firebaseApp();
        const token = device.token?.trim() || device.endpoint;
        if (!app || !token)
            return { status: 'skipped', errorMessage: 'Firebase Admin env not configured' };
        await firebaseAdmin.messaging(app).send({
            token,
            notification: { title, body },
            data: stringifyPayload(payload),
        });
        return { status: 'sent', errorMessage: null };
    }
    async sendWebPush(device, title, body, payload) {
        if (!this.configureWebPush())
            return { status: 'skipped', errorMessage: 'VAPID env not configured' };
        if (!device.subscription)
            return { status: 'skipped', errorMessage: 'missing web push subscription' };
        await webpush.sendNotification(device.subscription, JSON.stringify({ title, body, payload }));
        return { status: 'sent', errorMessage: null };
    }
    firebaseApp() {
        if (firebaseAdmin.apps.length > 0)
            return firebaseAdmin.apps[0] ?? null;
        const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
        try {
            if (json) {
                const parsed = JSON.parse(json);
                return firebaseAdmin.initializeApp({ credential: firebaseAdmin.credential.cert(parsed) });
            }
            const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
            const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
            const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n').trim();
            if (!projectId || !clientEmail || !privateKey)
                return null;
            return firebaseAdmin.initializeApp({
                credential: firebaseAdmin.credential.cert({ projectId, clientEmail, privateKey }),
            });
        }
        catch (error) {
            this.logger.warn(`firebase init failed: ${error instanceof Error ? error.message : String(error)}`);
            return null;
        }
    }
    configureWebPush() {
        if (this.webPushConfigured)
            return true;
        const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY?.trim();
        const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim();
        const subject = process.env.WEB_PUSH_VAPID_SUBJECT?.trim() || 'mailto:chldngur89@gmail.com';
        if (!publicKey || !privateKey)
            return false;
        webpush.setVapidDetails(subject, publicKey, privateKey);
        this.webPushConfigured = true;
        return true;
    }
    async logEvent(args) {
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
            throw new common_1.BadRequestException(error.message);
        }
        return mapEvent(data);
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(database_tokens_1.SUPABASE_ADMIN)),
    __metadata("design:paramtypes", [Object])
], NotificationService);
function notificationEndpoint(dto) {
    if (dto.channel === 'fcm') {
        const token = dto.token?.trim();
        if (!token)
            throw new common_1.BadRequestException('FCM token required');
        return token;
    }
    const endpoint = dto.token?.trim() ||
        (typeof dto.subscription?.endpoint === 'string' ? dto.subscription.endpoint.trim() : '');
    if (!endpoint)
        throw new common_1.BadRequestException('Web Push endpoint required');
    return endpoint;
}
function endpointHash(endpoint) {
    return (0, node_crypto_1.createHash)('sha256').update(endpoint).digest('hex');
}
function stringifyPayload(payload) {
    const out = {};
    for (const [key, value] of Object.entries(payload)) {
        out[key] = typeof value === 'string' ? value : JSON.stringify(value);
    }
    return out;
}
function missingRelation(message) {
    return /schema cache|could not find the table|relation .* does not exist/i.test(message);
}
function mapDevice(row) {
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
function mapEvent(row) {
    return {
        id: String(row.id),
        ownerType: String(row.owner_type),
        ownerId: String(row.owner_id),
        channel: row.channel == null ? null : String(row.channel),
        eventType: String(row.event_type ?? ''),
        title: String(row.title ?? ''),
        body: String(row.body ?? ''),
        status: String(row.status ?? 'queued'),
        errorMessage: row.error_message == null ? null : String(row.error_message),
        targetTable: row.target_table == null ? null : String(row.target_table),
        targetId: row.target_id == null ? null : String(row.target_id),
        createdAt: String(row.created_at ?? new Date().toISOString()),
        sentAt: row.sent_at == null ? null : String(row.sent_at),
        payload: row.payload ?? {},
    };
}
//# sourceMappingURL=notification.service.js.map