# ==============================================================================
# Managed Redis (Amazon ElastiCache Replication Group)
# ==============================================================================

resource "random_password" "redis_auth" {
  length  = 32
  special = false
}

# Subnet Group across isolated Private Data Subnets
resource "aws_elasticache_subnet_group" "redis" {
  name        = "${var.project_name}-${var.environment}-redis-subnet-group"
  description = "Isolated private data subnets for ElastiCache Redis"
  subnet_ids  = var.database_subnet_ids

  tags = {
    Name        = "${var.project_name}-${var.environment}-redis-subnet-group"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Parameter Group for Redis 7.x
resource "aws_elasticache_parameter_group" "redis" {
  name        = "${var.project_name}-${var.environment}-redis7-params"
  family      = "redis7"
  description = "Redis 7 parameter group with optimized eviction and memory policies"

  parameter {
    name  = "maxmemory-policy"
    value = "volatile-lru"
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-redis7-params"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# High-Availability Redis Replication Group (Multi-AZ with Primary & Read Replica)
resource "aws_elasticache_replication_group" "redis" {
  replication_group_id = "${var.project_name}-${var.environment}-redis"
  description          = "Redis replication group for rate limiting, distributed caching, and token revocation"
  node_type            = var.node_type
  port                 = 6379
  parameter_group_name = aws_elasticache_parameter_group.redis.name

  subnet_group_name  = aws_elasticache_subnet_group.redis.name
  security_group_ids = [var.redis_security_group_id]

  num_cache_clusters         = var.num_cache_clusters
  automatic_failover_enabled = var.automatic_failover_enabled
  multi_az_enabled           = var.multi_az_enabled

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = random_password.redis_auth.result

  snapshot_retention_limit   = var.snapshot_retention_limit
  snapshot_window            = "02:00-03:00"
  maintenance_window         = "Sun:05:00-Sun:06:00"
  auto_minor_version_upgrade = true
  apply_immediately          = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-redis"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Secrets Manager Secret for Redis Auth Token & Connection Info
resource "aws_secretsmanager_secret" "redis_auth" {
  name                    = "${var.project_name}/${var.environment}/redis/auth-token"
  description             = "Auth token and connection endpoints for ElastiCache Redis"
  recovery_window_in_days = 0

  tags = {
    Name        = "${var.project_name}-${var.environment}-redis-auth"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_secretsmanager_secret_version" "redis_auth" {
  secret_id = aws_secretsmanager_secret.redis_auth.id
  secret_string = jsonencode({
    primary_endpoint = aws_elasticache_replication_group.redis.primary_endpoint_address
    reader_endpoint  = aws_elasticache_replication_group.redis.reader_endpoint_address
    port             = 6379
    auth_token       = random_password.redis_auth.result
    tls              = true
    redis_url        = "rediss://:${random_password.redis_auth.result}@${aws_elasticache_replication_group.redis.primary_endpoint_address}:6379"
  })
}
