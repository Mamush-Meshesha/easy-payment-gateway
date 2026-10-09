#!/bin/sh

echo "Applying global prisma schema..."
cd /app && npx prisma db push --schema=global_schema.prisma --accept-data-loss

echo "Starting supervisord..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
