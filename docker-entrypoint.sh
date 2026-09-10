#!/bin/sh
set -e

echo "🚀 Starting application..."

echo "📦 Running database migrations..."
node dist/scripts/run-migrations.js

echo "📦 Running Better Auth migrations..."
node dist/scripts/run-auth-migrations.js

echo "✅ Migrations completed. Starting NestJS application..."
exec node dist/main.js
