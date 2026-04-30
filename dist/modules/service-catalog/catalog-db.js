"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rowToCategory = rowToCategory;
exports.rowToProduct = rowToProduct;
exports.rowToAddon = rowToAddon;
exports.categoryToSnake = categoryToSnake;
exports.productToSnakeInsert = productToSnakeInsert;
exports.productToSnakeUpdate = productToSnakeUpdate;
exports.addonToSnakeInsert = addonToSnakeInsert;
exports.addonToSnakeUpdate = addonToSnakeUpdate;
exports.loadCatalogFromSupabase = loadCatalogFromSupabase;
exports.upsertFixtureSeed = upsertFixtureSeed;
exports.insertProductRow = insertProductRow;
exports.replaceProductRow = replaceProductRow;
exports.insertAddonRow = insertAddonRow;
exports.replaceAddonRow = replaceAddonRow;
function num(v, d = 0) {
    if (typeof v === 'number' && Number.isFinite(v))
        return v;
    if (typeof v === 'string' && v !== '')
        return Number(v) || d;
    return d;
}
function numOrNull(v) {
    if (v == null)
        return null;
    if (typeof v === 'number' && Number.isFinite(v))
        return v;
    if (typeof v === 'string' && v !== '') {
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}
function str(v) {
    if (v == null)
        return null;
    const s = String(v).trim();
    return s === '' ? null : s;
}
function rowToCategory(r) {
    return {
        id: String(r.id),
        name: String(r.name),
        code: String(r.code),
        sortOrder: num(r.sort_order),
        isActive: Boolean(r.is_active),
    };
}
function rowToProduct(r) {
    return {
        id: String(r.id),
        categoryId: String(r.category_id),
        name: String(r.name),
        code: String(r.code),
        serviceType: r.service_type,
        airconType: r.aircon_type,
        basePrice: num(r.base_price),
        sameDayExtraPrice: num(r.same_day_extra_price),
        sameDayPrice: num(r.same_day_price),
        includedPipeMeter: num(r.included_pipe_meter),
        includedRefrigerantCount: num(r.included_refrigerant_count),
        includedHoleCount: num(r.included_hole_count),
        description: str(r.description),
        isActive: Boolean(r.is_active),
        sortOrder: num(r.sort_order),
    };
}
function rowToAddon(r) {
    return {
        id: String(r.id),
        name: String(r.name),
        code: String(r.code),
        unit: String(r.unit ?? 'each'),
        customerPrice: numOrNull(r.customer_price),
        technicianCostAllowance: numOrNull(r.technician_cost_allowance),
        platformFeeRate: numOrNull(r.platform_fee_rate),
        description: str(r.description),
        isActive: Boolean(r.is_active),
        sortOrder: num(r.sort_order),
    };
}
function categoryToSnake(c) {
    return {
        id: c.id,
        name: c.name,
        code: c.code,
        sort_order: c.sortOrder,
        is_active: c.isActive,
    };
}
function productToSnakeInsert(p) {
    return {
        id: p.id,
        category_id: p.categoryId,
        name: p.name,
        code: p.code,
        service_type: p.serviceType,
        aircon_type: p.airconType,
        base_price: p.basePrice,
        same_day_extra_price: p.sameDayExtraPrice,
        same_day_price: p.sameDayPrice,
        included_pipe_meter: p.includedPipeMeter,
        included_refrigerant_count: p.includedRefrigerantCount,
        included_hole_count: p.includedHoleCount,
        description: p.description ?? null,
        is_active: p.isActive,
        sort_order: p.sortOrder,
    };
}
function productToSnakeUpdate(p) {
    return {
        category_id: p.categoryId,
        name: p.name,
        code: p.code,
        service_type: p.serviceType,
        aircon_type: p.airconType,
        base_price: p.basePrice,
        same_day_extra_price: p.sameDayExtraPrice,
        same_day_price: p.sameDayPrice,
        included_pipe_meter: p.includedPipeMeter,
        included_refrigerant_count: p.includedRefrigerantCount,
        included_hole_count: p.includedHoleCount,
        description: p.description ?? null,
        is_active: p.isActive,
        sort_order: p.sortOrder,
    };
}
function addonToSnakeInsert(a) {
    return {
        id: a.id,
        name: a.name,
        code: a.code,
        unit: a.unit,
        customer_price: a.customerPrice,
        technician_cost_allowance: a.technicianCostAllowance,
        platform_fee_rate: a.platformFeeRate,
        description: a.description ?? null,
        is_active: a.isActive,
        sort_order: a.sortOrder,
    };
}
function addonToSnakeUpdate(a) {
    return {
        name: a.name,
        code: a.code,
        unit: a.unit,
        customer_price: a.customerPrice,
        technician_cost_allowance: a.technicianCostAllowance,
        platform_fee_rate: a.platformFeeRate,
        description: a.description ?? null,
        is_active: a.isActive,
        sort_order: a.sortOrder,
    };
}
async function loadCatalogFromSupabase(sb) {
    const [catsR, prodR, addonR] = await Promise.all([
        sb.from('service_categories').select('*').order('sort_order', { ascending: true }),
        sb.from('service_products').select('*').order('sort_order', { ascending: true }),
        sb.from('service_addons').select('*').order('sort_order', { ascending: true }),
    ]);
    const err = catsR.error || prodR.error || addonR.error;
    if (err)
        throw new Error(err.message);
    const categories = (catsR.data ?? []).map((r) => rowToCategory(r));
    const products = (prodR.data ?? []).map((r) => rowToProduct(r));
    const addons = (addonR.data ?? []).map((r) => rowToAddon(r));
    return { categories, products, addons };
}
async function upsertFixtureSeed(sb, fixtures) {
    const catSnake = fixtures.categories.map(categoryToSnake);
    const { error: e1 } = await sb.from('service_categories').upsert(catSnake, { onConflict: 'code' });
    if (e1)
        throw new Error(e1.message);
    const prodSnake = fixtures.products.map(productToSnakeInsert);
    const { error: e2 } = await sb.from('service_products').upsert(prodSnake, { onConflict: 'code' });
    if (e2)
        throw new Error(e2.message);
    const addonSnake = fixtures.addons.map(addonToSnakeInsert);
    const { error: e3 } = await sb.from('service_addons').upsert(addonSnake, { onConflict: 'code' });
    if (e3)
        throw new Error(e3.message);
}
async function insertProductRow(sb, p) {
    const { error } = await sb.from('service_products').insert(productToSnakeInsert(p));
    if (error)
        throw new Error(error.message);
}
async function replaceProductRow(sb, p) {
    const { error } = await sb.from('service_products').update(productToSnakeUpdate(p)).eq('id', p.id);
    if (error)
        throw new Error(error.message);
}
async function insertAddonRow(sb, a) {
    const { error } = await sb.from('service_addons').insert(addonToSnakeInsert(a));
    if (error)
        throw new Error(error.message);
}
async function replaceAddonRow(sb, a) {
    const { error } = await sb.from('service_addons').update(addonToSnakeUpdate(a)).eq('id', a.id);
    if (error)
        throw new Error(error.message);
}
//# sourceMappingURL=catalog-db.js.map