output "db_instance_id" {
  description = "The RDS instance identifier"
  value       = aws_db_instance.postgres.id
}

output "db_instance_arn" {
  description = "The ARN of the RDS instance"
  value       = aws_db_instance.postgres.arn
}

output "db_instance_endpoint" {
  description = "Connection endpoint for direct RDS PostgreSQL connection"
  value       = aws_db_instance.postgres.endpoint
}

output "db_instance_address" {
  description = "DNS hostname of the RDS PostgreSQL instance"
  value       = aws_db_instance.postgres.address
}

output "db_instance_port" {
  description = "Database port"
  value       = aws_db_instance.postgres.port
}

output "db_name" {
  description = "Default database name"
  value       = aws_db_instance.postgres.db_name
}

output "db_username" {
  description = "Master database username"
  value       = aws_db_instance.postgres.username
}

output "db_kms_key_arn" {
  description = "KMS Key ARN used for database storage encryption"
  value       = aws_kms_key.rds.arn
}

output "db_credentials_secret_arn" {
  description = "Secrets Manager secret ARN containing connection credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "rds_proxy_id" {
  description = "The ID of the RDS Proxy"
  value       = var.enable_rds_proxy ? aws_db_proxy.postgres[0].id : null
}

output "rds_proxy_arn" {
  description = "The ARN of the RDS Proxy"
  value       = var.enable_rds_proxy ? aws_db_proxy.postgres[0].arn : null
}

output "rds_proxy_endpoint" {
  description = "Connection endpoint for the RDS Proxy"
  value       = var.enable_rds_proxy ? aws_db_proxy.postgres[0].endpoint : null
}
