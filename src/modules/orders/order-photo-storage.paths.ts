import { BadRequestException } from '@nestjs/common';

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

export function extFromMime(mime: string | undefined, fallbackExt = 'jpg'): string {
  if (!mime) return fallbackExt;
  const normalized = mime.toLowerCase().split(';')[0].trim();
  return MIME_EXT[normalized] ?? fallbackExt;
}

export function assertOrderPhotoStoragePath(storagePath: string, orderId: string): void {
  const trimmed = storagePath.trim();
  if (!trimmed || trimmed.includes('..')) throw new BadRequestException('invalid storage path');
  const prefix = `orders/${orderId}/`;
  if (!trimmed.startsWith(prefix)) throw new BadRequestException('photo path must belong to this order');
}

export function orderPhotosBucketName(): string {
  return (process.env.SUPABASE_STORAGE_ORDER_PHOTOS_BUCKET ?? 'order-photos').trim() || 'order-photos';
}
