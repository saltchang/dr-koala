#!/bin/bash

set -e

DATABASE_URL_ENV=${DATABASE_URL:-""}
DB_HOST_ENV=${DB_HOST:-""}
DB_PORT_ENV=${DB_PORT:-""}
DB_NAME_ENV=${DB_NAME:-""}
DB_USER_ENV=${DB_USER:-""}
DB_PASSWORD_ENV=${DB_PASSWORD:-""}
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

read_db_config_from_env_file() {
    local env_file=$1

    if [ ! -f "$env_file" ]; then
        return 1
    fi

    local db_host db_port db_name db_user db_password
    
    db_host=$(grep -E "^DB_HOST=" "$env_file" | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    db_port=$(grep -E "^DB_PORT=" "$env_file" | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    db_name=$(grep -E "^DB_NAME=" "$env_file" | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    db_user=$(grep -E "^DB_USER=" "$env_file" | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
    db_password=$(grep -E "^DB_PASSWORD=" "$env_file" | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")

    echo "$db_host $db_port $db_name $db_user $db_password"
}

construct_db_url_from_config() {
    local host=$1
    local port=$2
    local name=$3
    local user=$4
    local password=$5

    echo "postgresql+asyncpg://${user}:${password}@${host}:${port}/${name}"
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
    local username password host port dbname

    if [ -z "$db_url" ]; then
        # Try to get from individual DB_* environment variables first
        if [ -n "$DB_HOST_ENV" ] && [ -n "$DB_PORT_ENV" ] && [ -n "$DB_NAME_ENV" ] && [ -n "$DB_USER_ENV" ] && [ -n "$DB_PASSWORD_ENV" ]; then
            echo "Using DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD environment variables"
            host=$DB_HOST_ENV
            port=$DB_PORT_ENV
            dbname=$DB_NAME_ENV
            username=$DB_USER_ENV
            password=$DB_PASSWORD_ENV
        elif [ -n "$DATABASE_URL_ENV" ]; then
            echo "Initializing database from DATABASE_URL environment variable: $DATABASE_URL_ENV"
            db_url=$DATABASE_URL_ENV
        elif [ -n "$ENV_FILE_PATH" ]; then
            echo "Database config not provided, reading from ENV_FILE: $ENV_FILE_PATH"
            if [ ! -f "$ENV_FILE_PATH" ]; then
                echo "Error: ENV_FILE does not exist: $ENV_FILE_PATH"
                echo "Usage: $0 init [DATABASE_URL]"
                exit 1
            fi
            
            # Try reading individual DB_* variables first
            read -r host port dbname username password <<<"$(read_db_config_from_env_file "$ENV_FILE_PATH")"
            
            # If any of them are empty, try reading DATABASE_URL instead
            if [ -z "$host" ] || [ -z "$port" ] || [ -z "$dbname" ] || [ -z "$username" ] || [ -z "$password" ]; then
                db_url=$(read_db_url_from_env_file "$ENV_FILE_PATH")
                if [ -z "$db_url" ]; then
                    echo "Error: Neither DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD nor DATABASE_URL found in env file: $ENV_FILE_PATH"
                    echo "Usage: $0 init [DATABASE_URL]"
                    exit 1
                fi
            fi
        else
            echo "Error: Database config is not provided as argument, not set as environment variables, and ENV_FILE not set"
            echo "Usage: $0 init [DATABASE_URL]"
            exit 1
        fi
    fi

    # If we still have db_url, parse it
    if [ -n "$db_url" ]; then
        echo "Parsing database URL: $db_url"
        read -r username password host port dbname <<<"$(parse_db_url "$db_url")"
    fi

    echo "Initializing database: $dbname at $host:$port"
    PGPASSWORD=$password psql -h "$host" -p "$port" -U "$username" -d "postgres" -tc "SELECT 1 FROM pg_database WHERE datname = '$dbname'" | grep -q 1 || PGPASSWORD=$password psql -h "$host" -p "$port" -U "$username" -d "postgres" -c "CREATE DATABASE $dbname;"

    echo "Database $dbname initialized successfully!"
}

reset() {
    local db_url=$1
    local username password host port dbname

    if [ -z "$db_url" ]; then
        # Try to get from individual DB_* environment variables first
        if [ -n "$DB_HOST_ENV" ] && [ -n "$DB_PORT_ENV" ] && [ -n "$DB_NAME_ENV" ] && [ -n "$DB_USER_ENV" ] && [ -n "$DB_PASSWORD_ENV" ]; then
            echo "Using DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD environment variables"
            host=$DB_HOST_ENV
            port=$DB_PORT_ENV
            dbname=$DB_NAME_ENV
            username=$DB_USER_ENV
            password=$DB_PASSWORD_ENV
        elif [ -n "$DATABASE_URL_ENV" ]; then
            db_url=$DATABASE_URL_ENV
        elif [ -n "$ENV_FILE_PATH" ]; then
            if [ ! -f "$ENV_FILE_PATH" ]; then
                echo "Error: ENV_FILE does not exist: $ENV_FILE_PATH"
                echo "Usage: $0 reset [DATABASE_URL]"
                exit 1
            fi
            
            # Try reading individual DB_* variables first
            read -r host port dbname username password <<<"$(read_db_config_from_env_file "$ENV_FILE_PATH")"
            
            # If any of them are empty, try reading DATABASE_URL instead
            if [ -z "$host" ] || [ -z "$port" ] || [ -z "$dbname" ] || [ -z "$username" ] || [ -z "$password" ]; then
                db_url=$(read_db_url_from_env_file "$ENV_FILE_PATH")
                if [ -z "$db_url" ]; then
                    echo "Error: Neither DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD nor DATABASE_URL found in env file: $ENV_FILE_PATH"
                    echo "Usage: $0 reset [DATABASE_URL]"
                    exit 1
                fi
            fi
        else
            echo "Error: Database config is not provided as argument, not set as environment variables, and ENV_FILE not set"
            echo "Usage: $0 reset [DATABASE_URL]"
            exit 1
        fi
    fi

    # If we still have db_url, parse it
    if [ -n "$db_url" ]; then
        read -r username password host port dbname <<<"$(parse_db_url "$db_url")"
    fi

    echo "Resetting database: $dbname at $host:$port"
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
