#!/bin/bash
echo "📊 Iniciando Monitor OracleWA SaaS v3.0..."
echo "Aguarde..."
echo ""
export NODE_ENV=production
node scripts/chip-maturation/monitor-maturation.js "$@"
