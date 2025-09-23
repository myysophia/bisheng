#!/usr/bin/env bash
set -euo pipefail

# Bisheng dev helper (frontend + backend)
#
# Usage:
#   scripts/dev.sh start [backend|frontend|both]
#   scripts/dev.sh stop  [backend|frontend|both]
#   scripts/dev.sh restart [backend|frontend|both]
#   scripts/dev.sh status [backend|frontend|both]
#   scripts/dev.sh logs [backend|frontend|both]
#
# Defaults (can be overridden by env vars):
#   BACKEND_HOST=127.0.0.1
#   BACKEND_PORT=7860
#   FRONTEND_PORT=3001
#   BACKEND_DIR=<repo>/src/backend
#   FRONTEND_DIR=<repo>/src/frontend/platform
#   VITE_PROXY_TARGET=http://$BACKEND_HOST:$BACKEND_PORT
#   BACKEND_LOG=/tmp/bisheng-backend.log
#   FRONTEND_LOG=/tmp/bisheng-frontend.log

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)
RUN_DIR="$REPO_ROOT/.run"
mkdir -p "$RUN_DIR"

BACKEND_HOST=${BACKEND_HOST:-127.0.0.1}
BACKEND_PORT=${BACKEND_PORT:-7860}
FRONTEND_PORT=${FRONTEND_PORT:-3001}
BACKEND_DIR=${BACKEND_DIR:-"$REPO_ROOT/src/backend"}
FRONTEND_DIR=${FRONTEND_DIR:-"$REPO_ROOT/src/frontend/platform"}
BACKEND_LOG=${BACKEND_LOG:-/tmp/bisheng-backend.log}
FRONTEND_LOG=${FRONTEND_LOG:-/tmp/bisheng-frontend.log}
VITE_PROXY_TARGET=${VITE_PROXY_TARGET:-"http://$BACKEND_HOST:$BACKEND_PORT"}

BACKEND_PID_FILE="$RUN_DIR/backend.pid"
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

start_frontend() {
  require_cmd npm
  if [ -f "$FRONTEND_PID_FILE" ] && is_alive "$(cat "$FRONTEND_PID_FILE")"; then
    color green "Frontend already running (pid=$(cat "$FRONTEND_PID_FILE"))"
    return 0
  fi
  if port_listen "$FRONTEND_PORT"; then
    color yellow "Port $FRONTEND_PORT already in use. Trying to continue..."
  fi
  color cyan "Starting frontend on http://127.0.0.1:$FRONTEND_PORT (proxy -> $VITE_PROXY_TARGET)"
  local pid
  VITE_PROXY_TARGET="$VITE_PROXY_TARGET" nohup npm --prefix "$FRONTEND_DIR" run start > "$FRONTEND_LOG" 2>&1 & pid=$!
  echo "$pid" > "$FRONTEND_PID_FILE"
  color green "Frontend pid=$pid (log: $FRONTEND_LOG)"
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

stop_frontend() {
  if [ -f "$FRONTEND_PID_FILE" ]; then
    stop_pid "$(cat "$FRONTEND_PID_FILE")" frontend || true
    rm -f "$FRONTEND_PID_FILE"
  fi
  if port_listen "$FRONTEND_PORT"; then
    color yellow "Killing any process on :$FRONTEND_PORT"
    lsof -nP -iTCP:"$FRONTEND_PORT" -sTCP:LISTEN -t | xargs -I{} kill {} 2>/dev/null || true
  fi
}

cmd_start() {
  local target=${1:-both}
  case "$target" in
    backend) start_backend ;;
    frontend) start_frontend ;;
    both|all) start_backend; start_frontend ;;
    *) color red "Unknown target: $target"; exit 1;;
  esac
  cmd_status "$target"
}

cmd_stop() {
  local target=${1:-both}
  case "$target" in
    backend) stop_backend ;;
    frontend) stop_frontend ;;
    both|all) stop_frontend || true; stop_backend || true ;;
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
  local target=${1:-both}
  echo "--- Status ($target) ---"
  if [[ "$target" == "backend" || "$target" == "both" || "$target" == "all" ]]; then
    if [ -f "$BACKEND_PID_FILE" ] && is_alive "$(cat "$BACKEND_PID_FILE")"; then
      color green "Backend: RUNNING (pid=$(cat "$BACKEND_PID_FILE")) on $BACKEND_HOST:$BACKEND_PORT"
    else
      color red   "Backend: STOPPED"
    fi
  fi
  if [[ "$target" == "frontend" || "$target" == "both" || "$target" == "all" ]]; then
    if [ -f "$FRONTEND_PID_FILE" ] && is_alive "$(cat "$FRONTEND_PID_FILE")"; then
      color green "Frontend: RUNNING (pid=$(cat "$FRONTEND_PID_FILE")) on http://127.0.0.1:$FRONTEND_PORT"
    else
      color red   "Frontend: STOPPED"
    fi
  fi
}

cmd_logs() {
  local which=${1:-both}
  case "$which" in
    backend|b) tail -n 200 -f "$BACKEND_LOG" ;;
    frontend|f) tail -n 200 -f "$FRONTEND_LOG" ;;
    both|all)
      tail -n 50 -f "$BACKEND_LOG" & T1=$!
      tail -n 50 -f "$FRONTEND_LOG" & T2=$!
      trap 'kill $T1 $T2 2>/dev/null || true' INT TERM EXIT
      wait ;;
    *) color red "Usage: $0 logs [backend|frontend|both]"; exit 1;;
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
  $0 start [backend|frontend|both]
  $0 stop  [backend|frontend|both]
  $0 restart [backend|frontend|both]
  $0 status [backend|frontend|both]
  $0 logs [backend|frontend|both]

Defaults:
  BACKEND: $BACKEND_HOST:$BACKEND_PORT (dir: $BACKEND_DIR, log: $BACKEND_LOG)
  FRONTEND: 127.0.0.1:$FRONTEND_PORT (dir: $FRONTEND_DIR, log: $FRONTEND_LOG)
  Proxy: VITE_PROXY_TARGET=$VITE_PROXY_TARGET
USAGE
    exit 1
    ;;
 esac

