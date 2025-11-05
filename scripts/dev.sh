#!/usr/bin/env bash
set -euo pipefail

# Bisheng dev helper (backend + platform + client)
#
# Usage:
#   scripts/dev.sh start [backend|platform|client|all]
#   scripts/dev.sh stop  [backend|platform|client|all]
#   scripts/dev.sh restart [backend|platform|client|all]
#   scripts/dev.sh status [backend|platform|client|all]
#   scripts/dev.sh logs [backend|platform|client|all]
#
# Defaults (can be overridden by env vars):
#   BACKEND_HOST=127.0.0.1
#   BACKEND_PORT=7860
#   PLATFORM_PORT=3001
#   CLIENT_PORT=4001
#   BACKEND_DIR=<repo>/src/backend
#   PLATFORM_DIR=<repo>/src/frontend/platform
#   CLIENT_DIR=<repo>/src/frontend/client
#   VITE_PROXY_TARGET=http://$BACKEND_HOST:$BACKEND_PORT
#   BACKEND_LOG=/tmp/bisheng-backend.log
#   PLATFORM_LOG=/tmp/bisheng-platform.log
#   CLIENT_LOG=/tmp/bisheng-client.log

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
RUN_DIR="$REPO_ROOT/.run"
mkdir -p "$RUN_DIR"

BACKEND_HOST=${BACKEND_HOST:-127.0.0.1}
BACKEND_PORT=${BACKEND_PORT:-7860}
PLATFORM_PORT=${PLATFORM_PORT:-3001}
CLIENT_PORT=${CLIENT_PORT:-4001}
BACKEND_DIR=${BACKEND_DIR:-"$REPO_ROOT/src/backend"}
PLATFORM_DIR=${PLATFORM_DIR:-"$REPO_ROOT/src/frontend/platform"}
CLIENT_DIR=${CLIENT_DIR:-"$REPO_ROOT/src/frontend/client"}
BACKEND_LOG=${BACKEND_LOG:-/tmp/bisheng-backend.log}
PLATFORM_LOG=${PLATFORM_LOG:-/tmp/bisheng-platform.log}
CLIENT_LOG=${CLIENT_LOG:-/tmp/bisheng-client.log}
VITE_PROXY_TARGET=${VITE_PROXY_TARGET:-"http://$BACKEND_HOST:$BACKEND_PORT"}

BACKEND_PID_FILE="$RUN_DIR/backend.pid"
PLATFORM_PID_FILE="$RUN_DIR/platform.pid"
CLIENT_PID_FILE="$RUN_DIR/client.pid"

# 保持向后兼容性
FRONTEND_PORT=${FRONTEND_PORT:-$PLATFORM_PORT}
FRONTEND_DIR=${FRONTEND_DIR:-$PLATFORM_DIR}
FRONTEND_LOG=${FRONTEND_LOG:-$PLATFORM_LOG}
FRONTEND_PID_FILE="$RUN_DIR/frontend.pid"

color() { # $1=color $2..=msg
  local c="$1"; shift
  case "$c" in
    green) printf "\033[32m%s\033[0m\n" "$*" ;;
    red)   printf "\033[31m%s\033[0m\n" "$*" ;;
    yellow)printf "\033[33m%s\033[0m\n" "$*" ;;
    cyan)  printf "\033[36m%s\033[0m\n" "$*" ;;
    *)     printf "%s\n" "$*" ;;
  esac
}

require_cmd() { # $1=cmd
  command -v "$1" >/dev/null 2>&1 || { color red "Missing command: $1"; exit 1; }
}

is_alive() { # $1=pid
  kill -0 "$1" 2>/dev/null || return 1
}

port_listen() { # $1=port
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

stop_pid() { # $1=pid $2=name
  local pid="$1" name="$2"
  if is_alive "$pid"; then
    color yellow "Stopping $name (pid=$pid)"
    kill "$pid" 2>/dev/null || true
    sleep 1
    if is_alive "$pid"; then
      color yellow "Killing $name (pid=$pid)"
      kill -9 "$pid" 2>/dev/null || true
    fi
  fi
}

start_backend() {
  require_cmd poetry
  if [ -f "$BACKEND_PID_FILE" ] && is_alive "$(cat "$BACKEND_PID_FILE")"; then
    color green "Backend already running (pid=$(cat "$BACKEND_PID_FILE"))"
    return 0
  fi
  if port_listen "$BACKEND_PORT"; then
    color yellow "Port $BACKEND_PORT already in use. Trying to continue..."
  fi
  color cyan "Starting backend on $BACKEND_HOST:$BACKEND_PORT"
  local pid
  pid=$(poetry -C "$BACKEND_DIR" run sh -lc 'nohup uvicorn bisheng.main:app --host '"$BACKEND_HOST"' --port '"$BACKEND_PORT"' --log-level info > '"$BACKEND_LOG"' 2>&1 & echo $!')
  echo "$pid" > "$BACKEND_PID_FILE"
  color green "Backend pid=$pid (log: $BACKEND_LOG)"
  for i in {1..40}; do
    if curl -sf "http://$BACKEND_HOST:$BACKEND_PORT/health" >/dev/null 2>&1; then
      color green "Backend is healthy"
      return 0
    fi
    sleep 0.5
  done
  color yellow "Backend did not report healthy (http://$BACKEND_HOST:$BACKEND_PORT/health). Check logs."
}

start_platform() {
  require_cmd npm
  if [ -f "$PLATFORM_PID_FILE" ] && is_alive "$(cat "$PLATFORM_PID_FILE")"; then
    color green "Platform already running (pid=$(cat "$PLATFORM_PID_FILE"))"
    return 0
  fi
  if port_listen "$PLATFORM_PORT"; then
    color yellow "Port $PLATFORM_PORT already in use. Trying to continue..."
  fi
  color cyan "Starting platform on http://127.0.0.1:$PLATFORM_PORT (proxy -> $VITE_PROXY_TARGET)"
  local pid
  VITE_PROXY_TARGET="$VITE_PROXY_TARGET" nohup npm --prefix "$PLATFORM_DIR" run start > "$PLATFORM_LOG" 2>&1 & pid=$!
  echo "$pid" > "$PLATFORM_PID_FILE"
  color green "Platform pid=$pid (log: $PLATFORM_LOG)"
}

start_client() {
  require_cmd npm
  if [ -f "$CLIENT_PID_FILE" ] && is_alive "$(cat "$CLIENT_PID_FILE")"; then
    color green "Client already running (pid=$(cat "$CLIENT_PID_FILE"))"
    return 0
  fi
  if port_listen "$CLIENT_PORT"; then
    color yellow "Port $CLIENT_PORT already in use. Trying to continue..."
  fi
  color cyan "Starting client on http://127.0.0.1:$CLIENT_PORT/workspace"
  local pid
  nohup npm --prefix "$CLIENT_DIR" run start > "$CLIENT_LOG" 2>&1 & pid=$!
  echo "$pid" > "$CLIENT_PID_FILE"
  color green "Client pid=$pid (log: $CLIENT_LOG)"
}

# 保持向后兼容性
start_frontend() {
  start_platform
  # 同时创建frontend.pid文件指向platform进程
  if [ -f "$PLATFORM_PID_FILE" ]; then
    cp "$PLATFORM_PID_FILE" "$FRONTEND_PID_FILE"
  fi
}

stop_backend() {
  if [ -f "$BACKEND_PID_FILE" ]; then
    stop_pid "$(cat "$BACKEND_PID_FILE")" backend || true
    rm -f "$BACKEND_PID_FILE"
  fi
  if port_listen "$BACKEND_PORT"; then
    color yellow "Killing any process on :$BACKEND_PORT"
    lsof -nP -iTCP:"$BACKEND_PORT" -sTCP:LISTEN -t | xargs -I{} kill {} 2>/dev/null || true
  fi
}

stop_platform() {
  if [ -f "$PLATFORM_PID_FILE" ]; then
    stop_pid "$(cat "$PLATFORM_PID_FILE")" platform || true
    rm -f "$PLATFORM_PID_FILE"
  fi
  if port_listen "$PLATFORM_PORT"; then
    color yellow "Killing any process on :$PLATFORM_PORT"
    lsof -nP -iTCP:"$PLATFORM_PORT" -sTCP:LISTEN -t | xargs -I{} kill {} 2>/dev/null || true
  fi
}

stop_client() {
  if [ -f "$CLIENT_PID_FILE" ]; then
    stop_pid "$(cat "$CLIENT_PID_FILE")" client || true
    rm -f "$CLIENT_PID_FILE"
  fi
  if port_listen "$CLIENT_PORT"; then
    color yellow "Killing any process on :$CLIENT_PORT"
    lsof -nP -iTCP:"$CLIENT_PORT" -sTCP:LISTEN -t | xargs -I{} kill {} 2>/dev/null || true
  fi
}

# 保持向后兼容性
stop_frontend() {
  stop_platform
  rm -f "$FRONTEND_PID_FILE"
}

cmd_start() {
  local target=${1:-all}
  case "$target" in
    backend) start_backend ;;
    platform) start_platform ;;
    client) start_client ;;
    frontend) start_frontend ;; # 向后兼容
    both) start_backend; start_platform ;; # 向后兼容
    all) start_backend; start_platform; start_client ;;
    *) color red "Unknown target: $target"; exit 1;;
  esac
  cmd_status "$target"
}

cmd_stop() {
  local target=${1:-all}
  case "$target" in
    backend) stop_backend ;;
    platform) stop_platform ;;
    client) stop_client ;;
    frontend) stop_frontend ;; # 向后兼容
    both) stop_platform || true; stop_backend || true ;; # 向后兼容
    all) stop_client || true; stop_platform || true; stop_backend || true ;;
    *) color red "Unknown target: $target"; exit 1;;
  esac
  cmd_status "$target"
}

cmd_restart() {
  local target=${1:-both}
  cmd_stop "$target" || true
  cmd_start "$target"
}

cmd_status() {
  local target=${1:-all}
  echo "--- Status ($target) ---"
  if [[ "$target" == "backend" || "$target" == "both" || "$target" == "all" ]]; then
    if [ -f "$BACKEND_PID_FILE" ] && is_alive "$(cat "$BACKEND_PID_FILE")"; then
      color green "Backend: RUNNING (pid=$(cat "$BACKEND_PID_FILE")) on $BACKEND_HOST:$BACKEND_PORT"
    else
      color red   "Backend: STOPPED"
    fi
  fi
  if [[ "$target" == "platform" || "$target" == "frontend" || "$target" == "both" || "$target" == "all" ]]; then
    if [ -f "$PLATFORM_PID_FILE" ] && is_alive "$(cat "$PLATFORM_PID_FILE")"; then
      color green "Platform: RUNNING (pid=$(cat "$PLATFORM_PID_FILE")) on http://127.0.0.1:$PLATFORM_PORT"
    else
      color red   "Platform: STOPPED"
    fi
  fi
  if [[ "$target" == "client" || "$target" == "all" ]]; then
    if [ -f "$CLIENT_PID_FILE" ] && is_alive "$(cat "$CLIENT_PID_FILE")"; then
      color green "Client: RUNNING (pid=$(cat "$CLIENT_PID_FILE")) on http://127.0.0.1:$CLIENT_PORT/workspace"
    else
      color red   "Client: STOPPED"
    fi
  fi
}

cmd_logs() {
  local which=${1:-all}
  case "$which" in
    backend|b) tail -n 200 -f "$BACKEND_LOG" ;;
    platform|p) tail -n 200 -f "$PLATFORM_LOG" ;;
    client|c) tail -n 200 -f "$CLIENT_LOG" ;;
    frontend|f) tail -n 200 -f "$PLATFORM_LOG" ;; # 向后兼容
    both)
      tail -n 50 -f "$BACKEND_LOG" & T1=$!
      tail -n 50 -f "$PLATFORM_LOG" & T2=$!
      trap 'kill $T1 $T2 2>/dev/null || true' INT TERM EXIT
      wait ;;
    all)
      tail -n 30 -f "$BACKEND_LOG" & T1=$!
      tail -n 30 -f "$PLATFORM_LOG" & T2=$!
      tail -n 30 -f "$CLIENT_LOG" & T3=$!
      trap 'kill $T1 $T2 $T3 2>/dev/null || true' INT TERM EXIT
      wait ;;
    *) color red "Usage: $0 logs [backend|platform|client|all]"; exit 1;;
  esac
}

CMD=${1:-}
TARGET=${2:-both}
case "$CMD" in
  start)   cmd_start "$TARGET" ;;
  stop)    cmd_stop "$TARGET" ;;
  restart) cmd_restart "$TARGET" ;;
  status)  cmd_status "$TARGET" ;;
  logs)    cmd_logs "$TARGET" ;;
  *)
    cat <<USAGE
Usage:
  $0 start [backend|platform|client|all]
  $0 stop  [backend|platform|client|all]
  $0 restart [backend|platform|client|all]
  $0 status [backend|platform|client|all]
  $0 logs [backend|platform|client|all]

Services:
  BACKEND: $BACKEND_HOST:$BACKEND_PORT (dir: $BACKEND_DIR, log: $BACKEND_LOG)
  PLATFORM: 127.0.0.1:$PLATFORM_PORT (dir: $PLATFORM_DIR, log: $PLATFORM_LOG)
  CLIENT: 127.0.0.1:$CLIENT_PORT/workspace (dir: $CLIENT_DIR, log: $CLIENT_LOG)
  Proxy: VITE_PROXY_TARGET=$VITE_PROXY_TARGET

Legacy compatibility:
  'frontend' and 'both' are still supported for backward compatibility
USAGE
    exit 1
    ;;
 esac

