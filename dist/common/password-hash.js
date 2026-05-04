"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const node_crypto_1 = require("node:crypto");
const PREFIX = 'scrypt';
const KEY_LENGTH = 64;
function hashPassword(password) {
    const plain = String(password ?? '');
    if (plain.length < 5) {
        throw new Error('password must be at least 5 characters');
    }
    const salt = (0, node_crypto_1.randomBytes)(16).toString('hex');
    const hash = (0, node_crypto_1.scryptSync)(plain, salt, KEY_LENGTH).toString('hex');
    return `${PREFIX}$${salt}$${hash}`;
}
function verifyPassword(password, storedHash) {
    if (!storedHash)
        return false;
    const [prefix, salt, expectedHex] = String(storedHash).split('$');
    if (prefix !== PREFIX || !salt || !expectedHex)
        return false;
    const expected = Buffer.from(expectedHex, 'hex');
    if (expected.length !== KEY_LENGTH)
        return false;
    const actual = (0, node_crypto_1.scryptSync)(String(password ?? ''), salt, KEY_LENGTH);
    return actual.length === expected.length && (0, node_crypto_1.timingSafeEqual)(actual, expected);
}
//# sourceMappingURL=password-hash.js.map