#!/bin/bash
# stop-services-local.sh

PID_FILE="logs/local.pids"

if [ -f "$PID_FILE" ]; then
    echo "Stopping local microservices..."
    while read -r pid; do
        if kill -0 "$pid" 2>/dev/null; then
            echo "Stopping process $pid..."
            kill "$pid"
        fi
    done < "$PID_FILE"
    rm "$PID_FILE"
    echo "All local services stopped."
else
    echo "No $PID_FILE found. No services to stop."
fi

# Bring down docker containers gracefully
echo "Stopping Docker containers..."
docker compose stop postgres redis kafka kafka-init
