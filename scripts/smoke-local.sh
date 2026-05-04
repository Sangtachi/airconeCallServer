#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://127.0.0.1:4000}"

echo "# health (global prefix 제외: /health)"
curl -sS "${BASE%/}/health"

echo ""
echo "# metrics"
curl -sS "${BASE%/}/api/metrics" | head -c 200
echo "..."

echo ""
echo "# admin service-addons (requires x-admin-role)"
curl -sS -H 'x-admin-role: ops_admin' "${BASE%/}/api/admin/service-addons?includeInactive=1" | head -c 200
echo "..."
