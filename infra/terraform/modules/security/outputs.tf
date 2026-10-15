output "alb_security_group_id" {
  description = "Security group ID for Application Load Balancer"
  value       = aws_security_group.alb.id
}

output "tier1_public_security_group_id" {
  description = "Security group ID for Tier 1 public-facing APIs (auth, payment, merchant, billing)"
  value       = aws_security_group.tier1_public.id
}

output "tier2_admin_security_group_id" {
  description = "Security group ID for Tier 2 admin/BFF portals (admin, dashboard, reporting, dispute)"
  value       = aws_security_group.tier2_admin.id
}

output "tier3_private_security_group_id" {
  description = "Security group ID for Tier 3 core private banking services (ledger, risk, provider, settlement, reconcile, notification)"
  value       = aws_security_group.tier3_private.id
}

output "tier4_workers_security_group_id" {
  description = "Security group ID for Tier 4 pure headless background workers (transaction-service) with zero inbound ingress"
  value       = aws_security_group.tier4_workers.id
}

output "webhook_security_group_id" {
  description = "Security group ID for Webhook Dispatcher Service"
  value       = aws_security_group.webhook.id
}

output "rds_proxy_security_group_id" {
  description = "Security group ID for RDS Proxy"
  value       = aws_security_group.rds_proxy.id
}

output "rds_security_group_id" {
  description = "Security group ID for RDS PostgreSQL database"
  value       = aws_security_group.rds.id
}

output "redis_security_group_id" {
  description = "Security group ID for ElastiCache Redis cluster"
  value       = aws_security_group.redis.id
}

output "msk_security_group_id" {
  description = "Security group ID for Managed Streaming for Kafka (MSK)"
  value       = aws_security_group.msk.id
}
