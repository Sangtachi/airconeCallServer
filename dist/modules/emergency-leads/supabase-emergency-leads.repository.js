"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseEmergencyLeadsRepository = void 0;
const common_1 = require("@nestjs/common");
function num(v, fallback = 0) {
    if (typeof v === 'number' && Number.isFinite(v))
        return v;
    if (typeof v === 'string' && v !== '')
        return Number(v) || fallback;
    return fallback;
}
function str(v) {
    if (v == null)
        return null;
    const s = String(v).trim();
    return s === '' ? null : s;
}
const STATUSES = [
    'pending',
    'timed_out',
    'contact_saved',
    'converted_to_order',
];
function fromDb(rec) {
    const stRaw = String(rec.matching_status ?? 'pending');
    const matchingStatus = STATUSES.includes(stRaw)
        ? stRaw
        : 'pending';
    return {
        id: String(rec.id),
        clientSessionId: String(rec.client_session_id),
        locationText: String(rec.location_text),
        airconType: String(rec.aircon_type ?? ''),
        issueText: String(rec.issue_text ?? ''),
        urgency: String(rec.urgency) === 'scheduled' ? 'scheduled' : 'now',
        quotedFeeKrw: num(rec.quoted_fee_krw, 30000),
        matchingTimeoutSeconds: num(rec.matching_timeout_seconds, 40),
        matchingStartedAt: String(rec.matching_started_at ?? rec.created_at),
        matchingDeadlineAt: String(rec.matching_deadline_at),
        matchingStatus,
        customerPhone: str(rec.customer_phone),
        customerName: str(rec.customer_name),
        userId: str(rec.user_id),
        convertedOrderId: str(rec.converted_order_id),
        createdAt: String(rec.created_at ?? new Date().toISOString()),
        updatedAt: String(rec.updated_at ?? new Date().toISOString()),
    };
}
function toInsert(row) {
    return {
        id: row.id,
        client_session_id: row.clientSessionId,
        location_text: row.locationText,
        aircon_type: row.airconType,
        issue_text: row.issueText,
        urgency: row.urgency,
        quoted_fee_krw: row.quotedFeeKrw,
        matching_timeout_seconds: row.matchingTimeoutSeconds,
        matching_started_at: row.matchingStartedAt,
        matching_deadline_at: row.matchingDeadlineAt,
        matching_status: row.matchingStatus,
        customer_phone: row.customerPhone ?? null,
        customer_name: row.customerName ?? null,
        user_id: row.userId ?? null,
        converted_order_id: row.convertedOrderId ?? null,
        created_at: row.createdAt,
        updated_at: row.updatedAt,
    };
}
function patchToSnake(patch) {
    const o = {};
    if (patch.clientSessionId !== undefined)
        o.client_session_id = patch.clientSessionId;
    if (patch.locationText !== undefined)
        o.location_text = patch.locationText;
    if (patch.airconType !== undefined)
        o.aircon_type = patch.airconType;
    if (patch.issueText !== undefined)
        o.issue_text = patch.issueText;
    if (patch.urgency !== undefined)
        o.urgency = patch.urgency;
    if (patch.quotedFeeKrw !== undefined)
        o.quoted_fee_krw = patch.quotedFeeKrw;
    if (patch.matchingTimeoutSeconds !== undefined)
        o.matching_timeout_seconds = patch.matchingTimeoutSeconds;
    if (patch.matchingStartedAt !== undefined)
        o.matching_started_at = patch.matchingStartedAt;
    if (patch.matchingDeadlineAt !== undefined)
        o.matching_deadline_at = patch.matchingDeadlineAt;
    if (patch.matchingStatus !== undefined)
        o.matching_status = patch.matchingStatus;
    if (patch.customerPhone !== undefined)
        o.customer_phone = patch.customerPhone ?? null;
    if (patch.customerName !== undefined)
        o.customer_name = patch.customerName ?? null;
    if (patch.userId !== undefined)
        o.user_id = patch.userId ?? null;
    if (patch.convertedOrderId !== undefined)
        o.converted_order_id = patch.convertedOrderId ?? null;
    if (patch.updatedAt !== undefined)
        o.updated_at = patch.updatedAt;
    return o;
}
class SupabaseEmergencyLeadsRepository {
    constructor(client) {
        this.client = client;
    }
    async insert(row) {
        const { error } = await this.client.from('emergency_service_leads').insert(toInsert(row));
        if (error)
            throw new common_1.BadRequestException(error.message);
    }
    async findById(id) {
        const { data, error } = await this.client
            .from('emergency_service_leads')
            .select('*')
            .eq('id', id)
            .maybeSingle();
        if (error)
            throw new common_1.BadRequestException(error.message);
        if (!data)
            return null;
        return fromDb(data);
    }
    async list(filters) {
        let q = this.client.from('emergency_service_leads').select('*').order('created_at', {
            ascending: false,
        });
        if (filters.matchingStatus)
            q = q.eq('matching_status', filters.matchingStatus);
        if (filters.fromIso)
            q = q.gte('created_at', filters.fromIso);
        if (filters.toIso)
            q = q.lte('created_at', filters.toIso);
        const { data, error } = await q;
        if (error)
            throw new common_1.BadRequestException(error.message);
        const rows = (data ?? []);
        return rows.map(fromDb);
    }
    async updatePartial(id, patch) {
        const snake = patchToSnake(patch);
        if (Object.keys(snake).length === 0)
            return;
        const { error } = await this.client.from('emergency_service_leads').update(snake).eq('id', id);
        if (error)
            throw new common_1.BadRequestException(error.message);
    }
}
exports.SupabaseEmergencyLeadsRepository = SupabaseEmergencyLeadsRepository;
//# sourceMappingURL=supabase-emergency-leads.repository.js.map