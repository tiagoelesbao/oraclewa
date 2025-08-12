#\!/bin/bash

# ==============================================================================
# 🛑 OracleWA SaaS v3.1 - Stop Script
# ==============================================================================
# Safely stops all OracleWA processes and cleans up resources
# ==============================================================================

echo "🛑 Stopping OracleWA SaaS v3.1..."
echo "=================================="

# Kill processes by PID files first
if [ -f "/tmp/oraclewa-api.pid" ]; then
    API_PID=$(cat "/tmp/oraclewa-api.pid")
    if kill -0 "$API_PID" 2>/dev/null; then
        echo "🔧 Stopping API server (PID: $API_PID)..."
        kill "$API_PID" 2>/dev/null || true
    fi
    rm -f "/tmp/oraclewa-api.pid"
fi

if [ -f "/tmp/oraclewa-dashboard.pid" ]; then
    DASHBOARD_PID=$(cat "/tmp/oraclewa-dashboard.pid")
    if kill -0 "$DASHBOARD_PID" 2>/dev/null; then
        echo "🎨 Stopping Dashboard server (PID: $DASHBOARD_PID)..."
        kill "$DASHBOARD_PID" 2>/dev/null || true
    fi
    rm -f "/tmp/oraclewa-dashboard.pid"
fi

# Kill any remaining processes
echo "🧹 Cleaning up remaining processes..."

# Kill backend processes
pkill -f "node.*apps/api" 2>/dev/null && echo "   ✅ Backend processes stopped"

# Kill frontend processes  
pkill -f "next.*dev" 2>/dev/null && echo "   ✅ Frontend dev processes stopped"
pkill -f "next.*start" 2>/dev/null && echo "   ✅ Frontend production processes stopped"

# Kill any Node.js processes running OracleWA
pkill -f "OracleWA" 2>/dev/null

# Wait for processes to terminate
sleep 2

echo ""
echo "✅ OracleWA SaaS stopped successfully\!"
echo ""
echo "💡 To start again:"
echo "   ./start.sh           - Auto-detect mode"
echo "   ./start.sh production - Production mode"  
echo "   ./quick-start.sh     - Development mode"
EOF < /dev/null
