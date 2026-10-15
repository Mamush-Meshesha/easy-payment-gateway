# ==============================================================================
# Security Group Architecture: 4-Tier Least-Privilege Network Isolation
# ==============================================================================

# 1. Ingress Tier: Application Load Balancer
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-${var.environment}-sg-alb"
  description = "Controls public inbound traffic to the Application Load Balancer"
  vpc_id      = var.vpc_id

  ingress {
    description = "Allow inbound HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow inbound HTTP for redirect to HTTPS"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow outbound to application targets"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-sg-alb"
    Environment = var.environment
  }
}

# 2. Tier 1: Public Ingress APIs (auth, payment, merchant/kyc, billing)
resource "aws_security_group" "tier1_public" {
  name        = "${var.project_name}-${var.environment}-sg-tier1-public"
  description = "Allows ingress from ALB strictly on public API service ports"
  vpc_id      = var.vpc_id

  # Ingress strictly from ALB on configured ports
  ingress {
    description     = "Auth Service HTTP"
    from_port       = 3001
    to_port         = 3001
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "Payment Service HTTP"
    from_port       = 8084
    to_port         = 8084
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "Merchant Service HTTP (Public Onboarding)"
    from_port       = 3002
    to_port         = 3002
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "Billing Service HTTP"
    from_port       = 3016
    to_port         = 3016
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow outbound to VPC dependencies and external telco APIs"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-sg-tier1-public"
    Environment = var.environment
  }

  lifecycle {
    ignore_changes = [ingress]
  }
}

# 3. Tier 2: Authenticated Portals & BFF (admin, dashboard, reporting, dispute)
resource "aws_security_group" "tier2_admin" {
  name        = "${var.project_name}-${var.environment}-sg-tier2-admin"
  description = "Allows ingress from ALB strictly on admin and BFF portal ports"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Admin Service HTTP"
    from_port       = 3003
    to_port         = 3003
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "Dashboard BFF HTTP"
    from_port       = 3009
    to_port         = 3009
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "Reporting Service HTTP"
    from_port       = 3008
    to_port         = 3008
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "Dispute Service HTTP"
    from_port       = 3017
    to_port         = 3017
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow outbound to VPC dependencies"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-sg-tier2-admin"
    Environment = var.environment
  }
}

# 4. Tier 4: Pure Headless Kafka Workers (e.g. transaction-service)
# Strictly ZERO unsolicited inbound ingress rules
resource "aws_security_group" "tier4_workers" {
  name        = "${var.project_name}-${var.environment}-sg-tier4-workers"
  description = "Security group for pure headless asynchronous workers (e.g. transaction-service). Strictly zero inbound ingress."
  vpc_id      = var.vpc_id

  # Explicitly NO inbound rules (pure headless background worker)

  egress {
    description = "Allow outbound to Kafka, database, and internal dependencies"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-sg-tier4-workers"
    Environment = var.environment
  }
}

# 4b. Dedicated Security Group for Webhook Dispatcher Service
resource "aws_security_group" "webhook" {
  name        = "${var.project_name}-${var.environment}-sg-webhook-service"
  description = "Security group for webhook dispatcher service; internal gRPC for inspection, outbound for merchant delivery"
  vpc_id      = var.vpc_id

  # Webhook status inspection gRPC (50056) called strictly by Tier 2 Admin/Dashboard
  ingress {
    description     = "Webhook status inspection gRPC from Tier 2 Admin/Dashboard"
    from_port       = 50056
    to_port         = 50056
    protocol        = "tcp"
    security_groups = [aws_security_group.tier2_admin.id]
  }

  egress {
    description = "Allow outbound to external merchant webhook URLs, Kafka, and database"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-sg-webhook-service"
    Environment = var.environment
  }
}

# Internal gRPC for Merchant Service (50052):
# Called strictly by: Tier 2 Admin (merchants/KYC), Webhook (signing keys), Tier 3 Settlement (payouts), Tier 1 Auth
resource "aws_security_group_rule" "merchant_grpc_from_callers" {
  for_each = {
    "tier2_admin"   = aws_security_group.tier2_admin.id
    "webhook"       = aws_security_group.webhook.id
    "tier3_private" = aws_security_group.tier3_private.id
    "tier1_public"  = aws_security_group.tier1_public.id
  }

  type                     = "ingress"
  from_port                = 50052
  to_port                  = 50052
  protocol                 = "tcp"
  security_group_id        = aws_security_group.tier1_public.id
  source_security_group_id = each.value
  description              = "Allow authorized internal services to query Merchant Service gRPC"
}

# Internal gRPC for Auth & Payment Service (50051):
# Called strictly by: Tier 2 Dashboard (payment/refund reads) and Tier 1 Merchant Service (auth token validation)
resource "aws_security_group_rule" "auth_payment_grpc_from_callers" {
  for_each = {
    "tier2_admin"  = aws_security_group.tier2_admin.id
    "tier1_public" = aws_security_group.tier1_public.id
  }

  type                     = "ingress"
  from_port                = 50051
  to_port                  = 50051
  protocol                 = "tcp"
  security_group_id        = aws_security_group.tier1_public.id
  source_security_group_id = each.value
  description              = "Allow Dashboard BFF and Merchant Service to query Auth/Payment gRPC"
}

# 5. Tier 3: Core Private Banking Services (ledger, risk, provider, settlement, reconcile, notification)
# Caller-specific least privilege: Each port permits ONLY the actual clients that communicate with it.
resource "aws_security_group" "tier3_private" {
  name        = "${var.project_name}-${var.environment}-sg-tier3-private"
  description = "Core banking services; reachable ONLY internally by authorized callers per port"
  vpc_id      = var.vpc_id

  # ----------------------------------------------------------------------------
  # Ledger Service (gRPC 50053):
  # Called by: Tier 1 (payment-service), Tier 2 (dispute, dashboard, admin),
  # and Tier 3 peers (settlement-service, reconciliation-service)
  # ----------------------------------------------------------------------------
  ingress {
    description     = "Ledger gRPC from Tier 1 Payment Service"
    from_port       = 50053
    to_port         = 50053
    protocol        = "tcp"
    security_groups = [aws_security_group.tier1_public.id]
  }

  ingress {
    description     = "Ledger gRPC from Tier 2 Dispute/Dashboard/Admin"
    from_port       = 50053
    to_port         = 50053
    protocol        = "tcp"
    security_groups = [aws_security_group.tier2_admin.id]
  }

  # ----------------------------------------------------------------------------
  # Risk Service:
  # gRPC (50054) called strictly by Tier 1 (payment-service)
  # HTTP (8086) called strictly by Tier 2 (admin-service for metrics/review)
  # ----------------------------------------------------------------------------
  ingress {
    description     = "Risk gRPC strictly from Tier 1 Payment Service"
    from_port       = 50054
    to_port         = 50054
    protocol        = "tcp"
    security_groups = [aws_security_group.tier1_public.id]
  }

  ingress {
    description     = "Risk HTTP strictly from Tier 2 Admin Portal"
    from_port       = 8086
    to_port         = 8086
    protocol        = "tcp"
    security_groups = [aws_security_group.tier2_admin.id]
  }

  # ----------------------------------------------------------------------------
  # Provider Service:
  # gRPC (50055) called strictly by Tier 1 (payment-service)
  # HTTP (8087) internal routing config called strictly by Tier 2 (admin-service)
  # ----------------------------------------------------------------------------
  ingress {
    description     = "Provider gRPC strictly from Tier 1 Payment Service"
    from_port       = 50055
    to_port         = 50055
    protocol        = "tcp"
    security_groups = [aws_security_group.tier1_public.id]
  }

  ingress {
    description     = "Provider HTTP internal config strictly from Tier 2 Admin"
    from_port       = 8087
    to_port         = 8087
    protocol        = "tcp"
    security_groups = [aws_security_group.tier2_admin.id]
  }

  # ----------------------------------------------------------------------------
  # Settlement Service:
  # gRPC (50057) called strictly by Tier 2 (dashboard-service for payout history)
  # HTTP (3010) called strictly by Tier 2 (admin-service for batch trigger)
  # ----------------------------------------------------------------------------
  ingress {
    description     = "Settlement gRPC strictly from Tier 2 Dashboard BFF"
    from_port       = 50057
    to_port         = 50057
    protocol        = "tcp"
    security_groups = [aws_security_group.tier2_admin.id]
  }

  ingress {
    description     = "Settlement HTTP strictly from Tier 2 Admin Portal"
    from_port       = 3010
    to_port         = 3010
    protocol        = "tcp"
    security_groups = [aws_security_group.tier2_admin.id]
  }

  # ----------------------------------------------------------------------------
  # Reconciliation Service:
  # HTTP (3011) called strictly by Tier 2 (admin-service for audit trigger/status)
  # ----------------------------------------------------------------------------
  ingress {
    description     = "Reconciliation HTTP from Tier 2 Admin and ALB"
    from_port       = 3011
    to_port         = 3011
    protocol        = "tcp"
    security_groups = [aws_security_group.tier2_admin.id, aws_security_group.alb.id]
  }

  # ----------------------------------------------------------------------------
  # Notification Service:
  # gRPC (50058) called by Tier 1 (payment-service) and Tier 2 (dashboard)
  # HTTP (3007) called by Tier 2 (admin-service)
  # ----------------------------------------------------------------------------
  ingress {
    description     = "Notification gRPC from Tier 1 & Tier 2"
    from_port       = 50058
    to_port         = 50058
    protocol        = "tcp"
    security_groups = [aws_security_group.tier1_public.id, aws_security_group.tier2_admin.id]
  }

  ingress {
    description     = "Notification HTTP strictly from Tier 2 Admin"
    from_port       = 3007
    to_port         = 3007
    protocol        = "tcp"
    security_groups = [aws_security_group.tier2_admin.id]
  }

  # Allow Tier 3 internal peer communication (e.g., settlement/reconciliation -> ledger)
  ingress {
    description = "Allow Tier 3 peer services self-communication (e.g. settlement calling ledger)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    self        = true
  }

  egress {
    description = "Allow outbound to database, cache, MSK, and external telco APIs via NAT"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-sg-tier3-private"
    Environment = var.environment
  }
}

# 6. Data Tier: Amazon RDS Proxy
resource "aws_security_group" "rds_proxy" {
  name        = "${var.project_name}-${var.environment}-sg-rds-proxy"
  description = "Allows PostgreSQL connections from all authorized application task tiers"
  vpc_id      = var.vpc_id

  ingress {
    description = "PostgreSQL connections from all application task tiers"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    security_groups = [
      aws_security_group.tier1_public.id,
      aws_security_group.tier2_admin.id,
      aws_security_group.tier3_private.id,
      aws_security_group.tier4_workers.id,
      aws_security_group.webhook.id
    ]
  }

  egress {
    description = "Allow outbound to RDS instance"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = ["10.20.0.0/16"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-sg-rds-proxy"
    Environment = var.environment
  }
}

# 7. Data Tier: Amazon RDS PostgreSQL
# Hardened rule: By default, accepts connections strictly and exclusively from RDS Proxy
resource "aws_security_group" "rds" {
  name        = "${var.project_name}-${var.environment}-sg-rds"
  description = "Controls access to PostgreSQL database (strictly via RDS Proxy by default)"
  vpc_id      = var.vpc_id

  ingress {
    description     = "PostgreSQL strictly from RDS Proxy security group"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.rds_proxy.id]
  }

  egress {
    description = "Outbound for monitoring and telemetry"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["10.20.0.0/16"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-sg-rds"
    Environment = var.environment
  }

  lifecycle {
    ignore_changes = [ingress]
  }
}

# Explicit, controlled bypass rules for direct RDS access (benchmarking or migration scripts)
resource "aws_security_group_rule" "rds_direct_ingress" {
  for_each = var.allow_direct_rds_connection ? {
    "tier1_public"  = aws_security_group.tier1_public.id
    "tier2_admin"   = aws_security_group.tier2_admin.id
    "tier3_private" = aws_security_group.tier3_private.id
    "tier4_workers" = aws_security_group.tier4_workers.id
    "webhook"       = aws_security_group.webhook.id
  } : {}

  type                     = "ingress"
  from_port                = 5432
  to_port                  = 5432
  protocol                 = "tcp"
  source_security_group_id = each.value
  security_group_id        = aws_security_group.rds.id
  description              = "Controlled exception: direct PostgreSQL bypass for migrations or benchmarking"
}

# 8. Data Tier: Amazon ElastiCache Redis
resource "aws_security_group" "redis" {
  name        = "${var.project_name}-${var.environment}-sg-redis"
  description = "Allows Redis access strictly from authorized application tiers"
  vpc_id      = var.vpc_id

  ingress {
    description = "Redis from application tiers"
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    security_groups = [
      aws_security_group.tier1_public.id,
      aws_security_group.tier2_admin.id,
      aws_security_group.tier3_private.id
    ]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-sg-redis"
    Environment = var.environment
  }
}

# 9. Data Tier: Amazon MSK (Kafka)
resource "aws_security_group" "msk" {
  name        = "${var.project_name}-${var.environment}-sg-msk"
  description = "Allows Kafka client access from authorized producers and consumers"
  vpc_id      = var.vpc_id

  ingress {
    description = "Kafka plaintext/TLS brokers from producers and workers"
    from_port   = 9092
    to_port     = 9098
    protocol    = "tcp"
    security_groups = [
      aws_security_group.tier1_public.id,
      aws_security_group.tier2_admin.id,
      aws_security_group.tier3_private.id,
      aws_security_group.tier4_workers.id,
      aws_security_group.webhook.id
    ]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-sg-msk"
    Environment = var.environment
  }
}
