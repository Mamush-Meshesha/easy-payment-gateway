output "primary_endpoint_address" {
  description = "The address of the endpoint for the primary node in the replication group"
  value       = aws_elasticache_replication_group.redis.primary_endpoint_address
}

output "reader_endpoint_address" {
  description = "The address of the endpoint for the reader node in the replication group"
  value       = aws_elasticache_replication_group.redis.reader_endpoint_address
}

output "port" {
  description = "Port number on which the cache nodes accept connections"
  value       = aws_elasticache_replication_group.redis.port
}

output "replication_group_id" {
  description = "The ID of the ElastiCache replication group"
  value       = aws_elasticache_replication_group.redis.id
}

output "redis_auth_secret_arn" {
  description = "Secrets Manager secret ARN containing Redis auth token and endpoints"
  value       = aws_secretsmanager_secret.redis_auth.arn
}
