#!/bin/sh

echo "Running prisma db push for all Node.js services..."

cd /app/services/auth-service && npx prisma db push --accept-data-loss
cd /app/services/merchant-service && npx prisma db push --accept-data-loss
cd /app/services/admin-service && npx prisma db push --accept-data-loss
cd /app/services/notification-service && npx prisma db push --accept-data-loss
cd /app/services/reporting-service && npx prisma db push --accept-data-loss

echo "Starting supervisord..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
