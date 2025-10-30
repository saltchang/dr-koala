#!/bin/bash

set -e

DATABASE_URL_ENV=${DATABASE_URL:-""}
ENV_FILE_PATH=${ENV_FILE:-""}

read_db_url_from_env_file() {
    local env_file=$1

    if [ ! -f "$env_file" ]; then
        return 1
    fi

    local db_url
    db_url=$(grep -E "^DATABASE_URL=" "$env_file" | cut -d= -f2-)

    db_url="${db_url#\"}"
    db_url="${db_url%\"}"
    db_url="${db_url#\'}"
    db_url="${db_url%\'}"

    echo "$db_url"
}

parse_db_url() {
    local db_url=$1
    local db_info=${db_url#*://}
    local user_pass=${db_info%%@*}
    local username=${user_pass%%:*}
    local password=${user_pass#*:}
    local host_port_db=${db_info#*@}
    local host_port=${host_port_db%%/*}
    local host=${host_port%%:*}
    local port=${host_port#*:}
    local dbname=${host_port_db#*/}

    echo "$username $password $host $port $dbname"
}

init() {
    echo "Initializing database..."
    local db_url=$1

    if [ -z "$db_url" ]; then
        if [ -n "$DATABASE_URL_ENV" ]; then
            echo "Initializing database from DATABASE_URL environment variable: $DATABASE_URL_ENV"
            db_url=$DATABASE_URL_ENV
        elif [ -n "$ENV_FILE_PATH" ]; then
            echo "DATABASE_URL not provided, reading from ENV_FILE: $ENV_FILE_PATH"
            if [ ! -f "$ENV_FILE_PATH" ]; then
                echo "Error: ENV_FILE does not exist: $ENV_FILE_PATH"
                echo "Run \`cp .env.example $ENV_FILE_PATH\` to create a new $ENV_FILE_PATH file"
                exit 1
            fi
            db_url=$(read_db_url_from_env_file "$ENV_FILE_PATH")
            if [ -z "$db_url" ]; then
                echo "Error: DATABASE_URL not found in env file: $ENV_FILE_PATH"
                echo "Usage: $0 init [DATABASE_URL]"
                exit 1
            fi
        else
            echo "Error: DATABASE_URL is not provided as argument, not set as environment variable, and ENV_FILE not set"
            echo "Usage: $0 init [DATABASE_URL]"
            exit 1
        fi
    fi

    echo "Parsing database URL: $db_url"
    read -r username password host port dbname <<<"$(parse_db_url "$db_url")"

    echo "Initializing database: $dbname"
    PGPASSWORD=$password psql -h "$host" -p "$port" -U "$username" -d "postgres" -tc "SELECT 1 FROM pg_database WHERE datname = '$dbname'" | grep -q 1 || PGPASSWORD=$password psql -h "$host" -p "$port" -U "$username" -d "postgres" -c "CREATE DATABASE $dbname;"

    echo "Database $dbname initialized successfully!"
}

reset() {
    local db_url=$1

    if [ -z "$db_url" ]; then
        if [ -n "$DATABASE_URL_ENV" ]; then
            db_url=$DATABASE_URL_ENV
        elif [ -n "$ENV_FILE_PATH" ]; then
            if [ ! -f "$ENV_FILE_PATH" ]; then
                echo "Error: ENV_FILE does not exist: $ENV_FILE_PATH"
                echo "Usage: $0 reset [DATABASE_URL]"
                exit 1
            fi
            db_url=$(read_db_url_from_env_file "$ENV_FILE_PATH")
            if [ -z "$db_url" ]; then
                echo "Error: DATABASE_URL not found in env file: $ENV_FILE_PATH"
                echo "Usage: $0 reset [DATABASE_URL]"
                exit 1
            fi
        else
            echo "Error: DATABASE_URL is not provided as argument, not set as environment variable, and ENV_FILE not set"
            echo "Usage: $0 reset [DATABASE_URL]"
            exit 1
        fi
    fi

    read -r username password host port dbname <<<"$(parse_db_url "$db_url")"

    echo "Resetting database: $dbname"
    PGPASSWORD=$password psql -h "$host" -p "$port" -U "$username" -d "postgres" -c "DROP DATABASE IF EXISTS $dbname;"
    PGPASSWORD=$password psql -h "$host" -p "$port" -U "$username" -d "postgres" -c "CREATE DATABASE $dbname;"

    echo "Database $dbname reset successfully!"
}

if [ "$1" = "init" ]; then
    init "$2"
elif [ "$1" = "reset" ]; then
    reset "$2"
else
    echo "Usage: $0 [init|reset] [DATABASE_URL]"
    echo "If DATABASE_URL is not provided as argument, it will be read from:"
    echo "  1. DATABASE_URL environment variable"
    echo "  2. ENV_FILE environment variable pointing to a .env file"
    exit 1
fi
