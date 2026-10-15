# ==============================================================================
# Managed PostgreSQL (Amazon RDS Multi-AZ) & Amazon RDS Proxy
# ==============================================================================

resource "random_password" "db_master" {
  length           = 24
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# KMS Key for Database Storage Encryption
resource "aws_kms_key" "rds" {
  description             = "KMS Key for ${var.project_name}-${var.environment} RDS PostgreSQL storage encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-rds-key"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_kms_alias" "rds" {
  name          = "alias/${var.project_name}-${var.environment}-rds-key"
  target_key_id = aws_kms_key.rds.key_id
}

# Subnet Group across isolated Private Data Subnets
resource "aws_db_subnet_group" "postgres" {
  name        = "${var.project_name}-${var.environment}-db-subnet-group"
  description = "Isolated private data subnets for RDS PostgreSQL"
  subnet_ids  = var.database_subnet_ids

  tags = {
    Name        = "${var.project_name}-${var.environment}-db-subnet-group"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Parameter Group with TLS Enforcement & Audit Logging
resource "aws_db_parameter_group" "postgres" {
  name        = "${var.project_name}-${var.environment}-pg15-params"
  family      = "postgres15"
  description = "PostgreSQL 15 parameter group with TLS enforcement and query logging"

  parameter {
    name         = "rds.force_ssl"
    value        = "1"
    apply_method = "pending-reboot"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_lock_waits"
    value = "1"
  }

  parameter {
    name  = "log_min_duration_statement"
    value = "250"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-pg15-params"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Primary Database Instance
resource "aws_db_instance" "postgres" {
  identifier            = "${var.project_name}-${var.environment}-postgres"
  engine                = "postgres"
  engine_version        = "15"
  instance_class        = var.db_instance_class
  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id            = aws_kms_key.rds.arn

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_master.result

  db_subnet_group_name   = aws_db_subnet_group.postgres.name
  vpc_security_group_ids = [var.rds_security_group_id]
  parameter_group_name   = aws_db_parameter_group.postgres.name

  multi_az            = var.multi_az
  publicly_accessible = false

  backup_retention_period    = var.backup_retention_period
  backup_window              = "03:00-04:00"
  maintenance_window         = "Sun:04:00-Sun:05:00"
  auto_minor_version_upgrade = true

  deletion_protection       = var.enable_deletion_protection
  skip_final_snapshot       = var.environment == "staging" ? true : false
  final_snapshot_identifier = var.environment == "staging" ? null : "${var.project_name}-${var.environment}-final-snapshot"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  tags = {
    Name        = "${var.project_name}-${var.environment}-postgres"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Secrets Manager Secret for Master Credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.project_name}/${var.environment}/rds/master-credentials"
  description             = "Master database connection credentials for RDS PostgreSQL"
  kms_key_id              = aws_kms_key.rds.arn
  recovery_window_in_days = 0

  tags = {
    Name        = "${var.project_name}-${var.environment}-db-credentials"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    engine       = "postgres"
    host         = aws_db_instance.postgres.address
    port         = 5432
    username     = var.db_username
    password     = random_password.db_master.result
    dbname       = var.db_name
    database_url = "postgresql://${var.db_username}:${urlencode(random_password.db_master.result)}@${aws_db_instance.postgres.address}:5432/${var.db_name}?sslmode=require"
  })
}

# ==============================================================================
# Amazon RDS Proxy for High-Concurrency Connection Multiplexing
# ==============================================================================

resource "aws_iam_role" "rds_proxy" {
  count = var.enable_rds_proxy ? 1 : 0
  name  = "${var.project_name}-${var.environment}-rds-proxy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-rds-proxy-role"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_iam_role_policy" "rds_proxy_secrets" {
  count = var.enable_rds_proxy ? 1 : 0
  name  = "${var.project_name}-${var.environment}-rds-proxy-secrets-policy"
  role  = aws_iam_role.rds_proxy[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.db_credentials.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = [
          aws_kms_key.rds.arn
        ]
      }
    ]
  })
}

resource "aws_db_proxy" "postgres" {
  count                  = var.enable_rds_proxy ? 1 : 0
  name                   = "${var.project_name}-${var.environment}-rds-proxy"
  debug_logging          = false
  engine_family          = "POSTGRESQL"
  idle_client_timeout    = 1800
  require_tls            = true
  role_arn               = aws_iam_role.rds_proxy[0].arn
  vpc_security_group_ids = [var.rds_proxy_security_group_id]
  vpc_subnet_ids         = var.database_subnet_ids

  auth {
    auth_scheme = "SECRETS"
    description = "Master database credentials from Secrets Manager"
    iam_auth    = "DISABLED"
    secret_arn  = aws_secretsmanager_secret.db_credentials.arn
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-rds-proxy"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_db_proxy_default_target_group" "postgres" {
  count         = var.enable_rds_proxy ? 1 : 0
  db_proxy_name = aws_db_proxy.postgres[0].name

  connection_pool_config {
    connection_borrow_timeout    = 120
    max_connections_percent      = 90
    max_idle_connections_percent = 50
  }
}

resource "aws_db_proxy_target" "postgres" {
  count                  = var.enable_rds_proxy ? 1 : 0
  db_proxy_name          = aws_db_proxy.postgres[0].name
  target_group_name      = aws_db_proxy_default_target_group.postgres[0].name
  db_instance_identifier = aws_db_instance.postgres.identifier
}
