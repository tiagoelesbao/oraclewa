#!/bin/bash
echo "🛑 Parando OracleWA SaaS..."
pkill -f "node apps/api/src/index.js" || true
echo "✅ Processo finalizado"
