"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isMockPaymentsAllowed = isMockPaymentsAllowed;
function isMockPaymentsAllowed() {
    if (process.env.DISABLE_MOCK_PAYMENTS === 'true')
        return false;
    if (process.env.ENABLE_MOCK_PAYMENTS === 'true')
        return true;
    return process.env.NODE_ENV !== 'production';
}
//# sourceMappingURL=mock-payments.flag.js.map