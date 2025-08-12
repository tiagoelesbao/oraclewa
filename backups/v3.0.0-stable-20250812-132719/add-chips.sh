#!/bin/bash
echo "📱 Gerenciador de Chips - OracleWA SaaS v3.0"
export NODE_ENV=production
node scripts/chip-maturation/add-chips-to-pool.js "$@"
