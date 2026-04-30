"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryOrdersRepository = void 0;
class MemoryOrdersRepository {
    constructor() {
        this.rows = [];
    }
    async insert(row) {
        this.rows.unshift(row);
    }
    async replace(row) {
        const i = this.rows.findIndex((r) => r.id === row.id);
        if (i === -1)
            this.rows.unshift(row);
        else
            this.rows[i] = row;
    }
    async findById(id) {
        return this.rows.find((r) => r.id === id) ?? null;
    }
    async listNewestFirst() {
        return [...this.rows].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    }
    async appendMockProductPayment(_row) {
    }
}
exports.MemoryOrdersRepository = MemoryOrdersRepository;
//# sourceMappingURL=memory-orders.repository.js.map