#!/bin/bash
set -e

if [ "$RUN_MODE" = "test" ]; then
    echo "Running tests..."
    export PYTHONPATH=./app:./tests
    uv run pytest "$@"
elif [ "$RUN_MODE" = "dev" ]; then
    echo "Starting development server..."
    export PYTHONPATH=./app
    exec uv run uvicorn app.main:http_api_app --host 0.0.0.0 --port 7086 --reload "$@"
else
    echo "Error: Unknown RUN_MODE='$RUN_MODE'. Valid values are 'dev' or 'test'."
    exit 1
fi 
