"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extFromMime = extFromMime;
exports.assertOrderPhotoStoragePath = assertOrderPhotoStoragePath;
exports.orderPhotosBucketName = orderPhotosBucketName;
const common_1 = require("@nestjs/common");
const MIME_EXT = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
};
function extFromMime(mime, fallbackExt = 'jpg') {
    if (!mime)
        return fallbackExt;
    const normalized = mime.toLowerCase().split(';')[0].trim();
    return MIME_EXT[normalized] ?? fallbackExt;
}
function assertOrderPhotoStoragePath(storagePath, orderId) {
    const trimmed = storagePath.trim();
    if (!trimmed || trimmed.includes('..'))
        throw new common_1.BadRequestException('invalid storage path');
    const prefix = `orders/${orderId}/`;
    if (!trimmed.startsWith(prefix))
        throw new common_1.BadRequestException('photo path must belong to this order');
}
function orderPhotosBucketName() {
    return (process.env.SUPABASE_STORAGE_ORDER_PHOTOS_BUCKET ?? 'order-photos').trim() || 'order-photos';
}
//# sourceMappingURL=order-photo-storage.paths.js.map