#!/bin/sh
set -e

echo "🚀 Starting application..."

# Roda as migrações
echo "📦 Running database migrations..."
node dist/scripts/run-migrations.js

# Inicia a aplicação
echo "✅ Migrations completed. Starting NestJS application..."
exec node dist/src/main.js
