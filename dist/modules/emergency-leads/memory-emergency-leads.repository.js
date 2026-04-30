"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryEmergencyLeadsRepository = void 0;
const common_1 = require("@nestjs/common");
function parseIso(ms) {
    const t = typeof ms === 'string' ? Date.parse(ms) : NaN;
    return Number.isFinite(t) ? t : NaN;
}
class MemoryEmergencyLeadsRepository {
    constructor() {
        this.rows = new Map();
    }
    async insert(row) {
        this.rows.set(row.id, { ...row });
    }
    async findById(id) {
        return this.rows.has(id) ? { ...this.rows.get(id) } : null;
    }
    async list(filters) {
        const fromMs = filters.fromIso ? parseIso(filters.fromIso) : null;
        const toMs = filters.toIso ? parseIso(filters.toIso) : null;
        const out = [...this.rows.values()]
            .filter((r) => {
            if (filters.matchingStatus && r.matchingStatus !== filters.matchingStatus)
                return false;
            const cms = parseIso(r.createdAt);
            if (fromMs != null && Number.isFinite(cms) && cms < fromMs)
                return false;
            if (toMs != null && Number.isFinite(cms) && cms > toMs)
                return false;
            return true;
        })
            .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
        return out.map((r) => ({ ...r }));
    }
    async updatePartial(id, patch) {
        const cur = this.rows.get(id);
        if (!cur)
            throw new common_1.BadRequestException(`emergency lead ${id} not found`);
        const next = { ...cur, ...patch, id: cur.id };
        this.rows.set(id, next);
    }
}
exports.MemoryEmergencyLeadsRepository = MemoryEmergencyLeadsRepository;
//# sourceMappingURL=memory-emergency-leads.repository.js.map