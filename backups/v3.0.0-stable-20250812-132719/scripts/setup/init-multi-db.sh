#!/bin/bash
set -e

# Script para criar múltiplos bancos de dados para isolamento por serviço
# Usado no container PostgreSQL para separar recovery de broadcast

POSTGRES="psql --username ${POSTGRES_USER}"

echo "Creating multiple databases for client isolation..."

# Função para criar database se não existir
create_database() {
    local database=$1
    echo "Creating database: $database"
    $POSTGRES <<-EOSQL
        SELECT 'CREATE DATABASE $database'
        WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$database')\gexec
EOSQL
    echo "Database $database created or already exists"
}

# Criar databases para cada serviço
for db in $(echo $POSTGRES_MULTIPLE_DATABASES | tr ',' ' '); do
    create_database $db
done

echo "Multiple databases created successfully!"