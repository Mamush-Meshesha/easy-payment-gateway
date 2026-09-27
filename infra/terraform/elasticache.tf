# -------------------------------------------------------------
# Managed Redis (AWS ElastiCache Cluster)
# -------------------------------------------------------------
resource "aws_elasticache_subnet_group" "default" {
  name       = "payment-gateway-redis-subnet"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_replication_group" "payment_redis" {
  replication_group_id          = "payment-gateway-redis"
  description                   = "Redis cluster for rate limiting and fast caching"
  node_type                     = "cache.m6g.large"
  port                          = 6379
  parameter_group_name          = "default.redis7.cluster.on"
  
  subnet_group_name             = aws_elasticache_subnet_group.default.name
  security_group_ids            = [aws_security_group.redis_sg.id]

  # Scalability and Availability
  automatic_failover_enabled    = true
  multi_az_enabled              = true
  
  # AOF equivalent for ElastiCache is multi-AZ with daily backups
  snapshot_retention_limit      = 7
  snapshot_window               = "02:00-03:00"

  # Encryption
  at_rest_encryption_enabled    = true
  transit_encryption_enabled    = true
  
  num_node_groups         = 2 # Shards
  replicas_per_node_group = 2 # Replicas per shard
}

resource "aws_security_group" "redis_sg" {
  name        = "payment_redis_sg"
  description = "Allow inbound traffic to Redis from private subnets"
  vpc_id      = aws_vpc.payment_gateway.id

  ingress {
    from_port   = 6379
    to_port     = 6379
    protocol    = "tcp"
    cidr_blocks = aws_subnet.private[*].cidr_block
  }
}
