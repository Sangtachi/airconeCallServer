"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const supabase_js_1 = require("@supabase/supabase-js");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const node_process_1 = require("node:process");
const database_tokens_1 = require("./database.tokens");
let localEnvLoaded = false;
function loadLocalEnvIfPresent() {
    if (localEnvLoaded)
        return;
    localEnvLoaded = true;
    const env = process.env.NODE_ENV?.trim() || 'development';
    const candidates = [
        `.env.${env}.local`,
        '.env.local',
        `.env.${env}`,
        '.env',
    ];
    for (const name of candidates) {
        const envPath = (0, node_path_1.join)(process.cwd(), name);
        if ((0, node_fs_1.existsSync)(envPath)) {
            (0, node_process_1.loadEnvFile)(envPath);
        }
    }
}
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            {
                provide: database_tokens_1.SUPABASE_ADMIN,
                useFactory: () => {
                    loadLocalEnvIfPresent();
                    const url = process.env.SUPABASE_URL?.trim();
                    const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
                    if (!url || !key)
                        return null;
                    return (0, supabase_js_1.createClient)(url, key, {
                        auth: { persistSession: false, autoRefreshToken: false },
                    });
                },
            },
        ],
        exports: [database_tokens_1.SUPABASE_ADMIN],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map