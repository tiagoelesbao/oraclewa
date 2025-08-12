#!/bin/bash

# ==============================================================================
# 🚀 OracleWA SaaS v3.1 - Unified Startup & Management Script
# ==============================================================================
# Single script to manage all system operations:
# - Development and Production modes
# - Start, Stop, Restart operations
# - System monitoring and health checks
# ==============================================================================

set -e

# Configuration
PROJECT_ROOT="/mnt/c/Users/Pichau/Desktop/Sistemas/OracleWA/OracleWA-SaaS"
API_PID_FILE="/tmp/oraclewa-api.pid"
DASHBOARD_PID_FILE="/tmp/oraclewa-dashboard.pid"
API_PORT=3000
DASHBOARD_PORT=3001

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

show_help() {
    echo "🚀 OracleWA SaaS v3.1 - Unified Management Script"
    echo "=================================================="
    echo ""
    echo "Usage: ./start.sh [COMMAND] [OPTIONS]"
    echo ""
    echo "COMMANDS:"
    echo "  dev, development     Start in development mode with hot reload"
    echo "  prod, production     Start in production mode with optimized build"
    echo "  stop                 Stop all running services"
    echo "  restart             Restart all services (preserves mode)"
    echo "  status              Show status of all services"
    echo "  health              Check system health"
    echo "  logs                Show real-time logs"
    echo "  help                Show this help message"
    echo ""
    echo "OPTIONS:"
    echo "  --build             Force rebuild before starting (production only)"
    echo "  --no-deps           Skip dependency installation"
    echo "  --background        Run in background mode"
    echo ""
    echo "EXAMPLES:"
    echo "  ./start.sh dev                # Start in development mode"
    echo "  ./start.sh production --build # Production mode with rebuild"
    echo "  ./start.sh stop               # Stop all services"
    echo "  ./start.sh status             # Check service status"
    echo ""
}

check_dependencies() {
    if [ "$SKIP_DEPS" != "true" ]; then
        log_info "Checking dependencies..."
        
        # Backend dependencies
        if [ ! -d "apps/api/node_modules" ]; then
            log_info "Installing backend dependencies..."
            cd apps/api && npm install && cd ../..
        fi
        
        # Frontend dependencies
        if [ ! -d "apps/dashboard/node_modules" ]; then
            log_info "Installing frontend dependencies..."
            cd apps/dashboard && npm install && cd ../..
        fi
    fi
}

build_frontend() {
    log_info "Building frontend for production..."
    cd apps/dashboard
    NODE_ENV=production npm run build
    cd ../..
    log_success "Frontend build completed"
}

start_backend() {
    local mode=$1
    log_info "Starting backend API server in $mode mode..."
    
    cd apps/api
    if [ "$mode" = "production" ]; then
        NODE_ENV=production node src/index.js &
    else
        NODE_ENV=development node src/index.js &
    fi
    
    local pid=$!
    echo $pid > "$API_PID_FILE"
    cd ../..
    
    # Wait for backend to be ready
    log_info "Waiting for backend to initialize..."
    for i in {1..30}; do
        if curl -f http://localhost:$API_PORT/health >/dev/null 2>&1; then
            log_success "Backend started successfully (PID: $pid)"
            return 0
        fi
        echo -n "."
        sleep 2
    done
    
    log_error "Backend failed to start within timeout"
    return 1
}

start_frontend() {
    local mode=$1
    log_info "Starting frontend dashboard in $mode mode..."
    
    cd apps/dashboard
    if [ "$mode" = "production" ]; then
        npm start &
    else
        npm run dev &
    fi
    
    local pid=$!
    echo $pid > "$DASHBOARD_PID_FILE"
    cd ../..
    
    log_success "Frontend started successfully (PID: $pid)"
}

stop_services() {
    log_info "Stopping OracleWA SaaS services..."
    
    # Stop processes by PID files
    if [ -f "$API_PID_FILE" ]; then
        local api_pid=$(cat "$API_PID_FILE")
        if kill -0 "$api_pid" 2>/dev/null; then
            log_info "Stopping API server (PID: $api_pid)..."
            kill "$api_pid" 2>/dev/null || true
            sleep 2
        fi
        rm -f "$API_PID_FILE"
    fi
    
    if [ -f "$DASHBOARD_PID_FILE" ]; then
        local dashboard_pid=$(cat "$DASHBOARD_PID_FILE")
        if kill -0 "$dashboard_pid" 2>/dev/null; then
            log_info "Stopping Dashboard server (PID: $dashboard_pid)..."
            kill "$dashboard_pid" 2>/dev/null || true
            sleep 2
        fi
        rm -f "$DASHBOARD_PID_FILE"
    fi
    
    # Cleanup any remaining processes
    pkill -f "node.*apps/api" 2>/dev/null && log_info "Cleaned up backend processes"
    pkill -f "next.*dev" 2>/dev/null && log_info "Cleaned up frontend dev processes"
    pkill -f "next.*start" 2>/dev/null && log_info "Cleaned up frontend production processes"
    
    log_success "All services stopped"
}

check_status() {
    echo "🔍 OracleWA SaaS v3.1 - System Status"
    echo "====================================="
    
    local api_running=false
    local dashboard_running=false
    
    # Check API
    if [ -f "$API_PID_FILE" ]; then
        local api_pid=$(cat "$API_PID_FILE")
        if kill -0 "$api_pid" 2>/dev/null; then
            log_success "API Server: Running (PID: $api_pid, Port: $API_PORT)"
            api_running=true
        else
            log_error "API Server: PID file exists but process not running"
            rm -f "$API_PID_FILE"
        fi
    else
        log_warning "API Server: Not running"
    fi
    
    # Check Dashboard
    if [ -f "$DASHBOARD_PID_FILE" ]; then
        local dashboard_pid=$(cat "$DASHBOARD_PID_FILE")
        if kill -0 "$dashboard_pid" 2>/dev/null; then
            log_success "Dashboard: Running (PID: $dashboard_pid, Port: $DASHBOARD_PORT)"
            dashboard_running=true
        else
            log_error "Dashboard: PID file exists but process not running"
            rm -f "$DASHBOARD_PID_FILE"
        fi
    else
        log_warning "Dashboard: Not running"
    fi
    
    # Show URLs if services are running
    if [ "$api_running" = true ] && [ "$dashboard_running" = true ]; then
        echo ""
        echo "🌐 Access URLs:"
        echo "   Dashboard: http://localhost:$DASHBOARD_PORT"
        echo "   API:       http://localhost:$API_PORT"
        echo "   Health:    http://localhost:$API_PORT/health"
    fi
    
    return 0
}

check_health() {
    log_info "Checking system health..."
    
    if curl -f http://localhost:$API_PORT/health >/dev/null 2>&1; then
        log_success "API Health Check: PASSED"
        curl -s http://localhost:$API_PORT/health | jq . 2>/dev/null || curl -s http://localhost:$API_PORT/health
    else
        log_error "API Health Check: FAILED"
    fi
    
    if curl -f http://localhost:$DASHBOARD_PORT >/dev/null 2>&1; then
        log_success "Dashboard Health Check: PASSED"
    else
        log_error "Dashboard Health Check: FAILED"
    fi
}

show_logs() {
    log_info "Showing real-time logs (Ctrl+C to stop)..."
    
    if [ -f "$API_PID_FILE" ] && [ -f "$DASHBOARD_PID_FILE" ]; then
        # Show logs from both processes
        tail -f /tmp/oraclewa-*.log 2>/dev/null || {
            log_warning "No log files found. Showing process output..."
            ps aux | grep -E "(node.*apps/api|next)" | grep -v grep
        }
    else
        log_error "Services not running. Start them first with: ./start.sh dev"
    fi
}

start_system() {
    local mode=$1
    local force_build=$2
    
    echo "🚀 OracleWA SaaS v3.1 - Starting in ${mode^^} mode"
    echo "================================================"
    
    # Navigate to project root
    cd "$PROJECT_ROOT"
    
    # Stop any existing processes
    stop_services
    
    # Check dependencies
    check_dependencies
    
    # Build frontend if production mode or forced
    if [ "$mode" = "production" ] && ([ "$force_build" = "true" ] || [ ! -d "apps/dashboard/.next" ]); then
        build_frontend
    fi
    
    # Start backend
    if ! start_backend "$mode"; then
        log_error "Failed to start backend. Aborting."
        exit 1
    fi
    
    # Start frontend
    start_frontend "$mode"
    
    echo ""
    log_success "System started successfully!"
    echo "=============================="
    echo "   🎨 Frontend Dashboard: http://localhost:$DASHBOARD_PORT"
    echo "   🔧 Backend API:        http://localhost:$API_PORT"
    echo "   📊 Health Check:       http://localhost:$API_PORT/health"
    echo ""
    echo "📋 Available Commands:"
    echo "   ./start.sh status    - Check service status"
    echo "   ./start.sh health    - Run health checks"
    echo "   ./start.sh stop      - Stop all services"
    echo "   ./start.sh logs      - View real-time logs"
    echo ""
}

monitor_system() {
    log_info "Monitoring system (Press Ctrl+C to stop)..."
    
    # Cleanup function
    cleanup() {
        echo ""
        log_info "Received shutdown signal. Stopping services..."
        stop_services
        exit 0
    }
    
    # Set trap for cleanup
    trap cleanup INT TERM
    
    # Monitor processes
    while true; do
        if [ -f "$API_PID_FILE" ]; then
            local api_pid=$(cat "$API_PID_FILE")
            if ! kill -0 "$api_pid" 2>/dev/null; then
                log_error "Backend process died! Stopping all services."
                cleanup
            fi
        fi
        
        if [ -f "$DASHBOARD_PID_FILE" ]; then
            local dashboard_pid=$(cat "$DASHBOARD_PID_FILE")
            if ! kill -0 "$dashboard_pid" 2>/dev/null; then
                log_error "Frontend process died! Stopping all services."
                cleanup
            fi
        fi
        
        sleep 5
    done
}

# Parse command line arguments
COMMAND=""
FORCE_BUILD=false
SKIP_DEPS=false
BACKGROUND=false

while [[ $# -gt 0 ]]; do
    case $1 in
        dev|development)
            COMMAND="development"
            shift
            ;;
        prod|production)
            COMMAND="production"
            shift
            ;;
        stop)
            COMMAND="stop"
            shift
            ;;
        restart)
            COMMAND="restart"
            shift
            ;;
        status)
            COMMAND="status"
            shift
            ;;
        health)
            COMMAND="health"
            shift
            ;;
        logs)
            COMMAND="logs"
            shift
            ;;
        help|--help|-h)
            show_help
            exit 0
            ;;
        --build)
            FORCE_BUILD=true
            shift
            ;;
        --no-deps)
            SKIP_DEPS=true
            shift
            ;;
        --background)
            BACKGROUND=true
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Default command based on environment
if [ -z "$COMMAND" ]; then
    if [ "$NODE_ENV" = "production" ] || [ -f ".production" ]; then
        COMMAND="production"
    else
        COMMAND="development"
    fi
fi

# Execute command
case $COMMAND in
    development|production)
        start_system "$COMMAND" "$FORCE_BUILD"
        if [ "$BACKGROUND" = "false" ]; then
            monitor_system
        fi
        ;;
    stop)
        stop_services
        ;;
    restart)
        # Detect previous mode or default to development
        local prev_mode="development"
        if [ -f ".production" ] || [ "$NODE_ENV" = "production" ]; then
            prev_mode="production"
        fi
        log_info "Restarting in $prev_mode mode..."
        stop_services
        sleep 2
        start_system "$prev_mode" "$FORCE_BUILD"
        if [ "$BACKGROUND" = "false" ]; then
            monitor_system
        fi
        ;;
    status)
        check_status
        ;;
    health)
        check_health
        ;;
    logs)
        show_logs
        ;;
    *)
        log_error "Invalid command: $COMMAND"
        show_help
        exit 1
        ;;
esac
