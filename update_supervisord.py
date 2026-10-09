import re

with open('supervisord.conf', 'r') as f:
    content = f.read()

env_map = {
    'auth-service': 'PORT="",SERVICE_PORT="3001",GRPC_PORT="50051",MERCHANT_SERVICE_HOST="127.0.0.1",MERCHANT_GRPC_PORT="50052"',
    'merchant-service': 'PORT="",SERVICE_PORT="3002",GRPC_PORT="50052",CERT_DIR="/app/certs"',
    'admin-service': 'PORT="",SERVICE_PORT="3003"',
    'reporting-service': 'PORT="",SERVICE_PORT="3008"',
    'dashboard-service': 'PORT="",SERVICE_PORT="3009",PAYMENT_SERVICE_ADDR="127.0.0.1:50057",SETTLEMENT_SERVICE_ADDR="127.0.0.1:50058",MERCHANT_SERVICE_HOST="127.0.0.1",MERCHANT_GRPC_PORT="50052",LEDGER_SERVICE_ADDR="127.0.0.1:50053",NOTIFICATION_SERVICE_ADDR="127.0.0.1:50062",WEBHOOK_SERVICE_ADDR="127.0.0.1:50056"',
    'payment-service': 'PORT="",GRPC_PORT="50057",MERCHANT_SERVICE_ADDR="127.0.0.1:50052",RISK_SERVICE_ADDR="127.0.0.1:50054",LEDGER_SERVICE_ADDR="127.0.0.1:50053",PROVIDER_SERVICE_ADDR="127.0.0.1:50055",WEBHOOK_SERVICE_ADDR="127.0.0.1:50056",PRICING_SERVICE_ADDR="127.0.0.1:50064"',
    'ledger-service': 'PORT="",GRPC_PORT="50053"',
    'risk-service': 'PORT="",GRPC_PORT="50054"',
    'provider-service': 'PORT="",GRPC_PORT="50055"',
    'webhook-service': 'PORT="",GRPC_PORT="50056",MERCHANT_SERVICE_ADDR="127.0.0.1:50052"',
    'settlement-service': 'PORT="",GRPC_PORT="50058",LEDGER_SERVICE_ADDR="127.0.0.1:50053",PAYMENT_SERVICE_ADDR="127.0.0.1:50057"',
    'transaction-service': 'PORT="",GRPC_PORT="50063",PAYMENT_SERVICE_ADDR="127.0.0.1:50057",LEDGER_SERVICE_ADDR="127.0.0.1:50053"',
    'reconciliation-service': 'PORT="",GRPC_PORT="50059"',
    'dispute-service': 'PORT="",GRPC_PORT="50060"',
    'billing-service': 'PORT="",GRPC_PORT="50061"',
    
    # NEW SERVICES
    'notification-service': 'PORT="",SERVICE_PORT="3007",GRPC_PORT="50062"',
    'fx-service': 'PORT="",GRPC_PORT="50065"',
    'pricing-service': 'PORT="",GRPC_PORT="50064"',
    'routing-service': 'PORT="",GRPC_PORT="50066"',
    'vault-service': 'PORT="",GRPC_PORT="50067"'
}

new_programs = """
[program:notification-service]
directory=/app/services/notification-service
command=npm run start
autostart=true
autorestart=true
environment=PORT="",SERVICE_PORT="3007",GRPC_PORT="50062"
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:fx-service]
command=/app/bin/fx-service
autostart=true
autorestart=true
environment=PORT="",GRPC_PORT="50065"
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:pricing-service]
command=/app/bin/pricing-service
autostart=true
autorestart=true
environment=PORT="",GRPC_PORT="50064"
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:routing-service]
command=/app/bin/routing-service
autostart=true
autorestart=true
environment=PORT="",GRPC_PORT="50066"
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

[program:vault-service]
command=/app/bin/vault-service
autostart=true
autorestart=true
environment=PORT="",GRPC_PORT="50067"
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
"""

new_content = []
current_prog = None
for line in content.split('\n'):
    if line.startswith('[program:'):
        current_prog = line.split(':')[1].strip(']')
    
    if line.startswith('environment='):
        if current_prog in env_map:
            new_content.append(f'environment={env_map[current_prog]}')
            continue
    new_content.append(line)

new_content_str = '\n'.join(new_content)
if "[program:notification-service]" not in new_content_str:
    new_content_str += "\n" + new_programs

with open('supervisord.conf', 'w') as f:
    f.write(new_content_str)

print("Updated supervisord.conf")
