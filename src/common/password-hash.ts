import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const PREFIX = 'scrypt';
const KEY_LENGTH = 64;

export function hashPassword(password: string): string {
  const plain = String(password ?? '');
  if (plain.length < 5) {
    throw new Error('password must be at least 5 characters');
  }
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(plain, salt, KEY_LENGTH).toString('hex');
  return `${PREFIX}$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash) return false;
  const [prefix, salt, expectedHex] = String(storedHash).split('$');
  if (prefix !== PREFIX || !salt || !expectedHex) return false;
  const expected = Buffer.from(expectedHex, 'hex');
  if (expected.length !== KEY_LENGTH) return false;
  const actual = scryptSync(String(password ?? ''), salt, KEY_LENGTH);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
