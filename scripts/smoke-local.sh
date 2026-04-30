#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://127.0.0.1:4000}"

echo "# health"
curl -sS "${BASE%/}/api/health"

echo ""
echo "# metrics"
curl -sS "${BASE%/}/api/metrics" | head -c 200
echo "..."

echo ""
echo "# admin service-addons (requires x-admin-role)"
curl -sS -H 'x-admin-role: admin' "${BASE%/}/api/admin/service-addons?includeInactive=1" | head -c 200
echo "..."
