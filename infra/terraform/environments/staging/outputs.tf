# ==============================================================================
# Staging Outputs (Milestone 1 & Milestone 2)
# ==============================================================================

# ------------------------------------------------------------------------------
# Milestone 1: Networking & Security
# ------------------------------------------------------------------------------
output "vpc_id" {
  description = "VPC ID for staging environment"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_app_subnet_ids" {
  description = "Private application subnet IDs (for ECS Fargate tasks)"
  value       = module.vpc.private_app_subnet_ids
}

output "private_data_subnet_ids" {
  description = "Private data subnet IDs (for RDS, ElastiCache, MSK)"
  value       = module.vpc.private_data_subnet_ids
}

output "nat_gateway_ips" {
  description = "Static egress IP addresses for telecom provider allowlisting"
  value       = module.vpc.nat_gateway_ips
}

output "alb_security_group_id" {
  description = "Security group ID for Application Load Balancer"
  value       = module.security.alb_security_group_id
}

output "tier1_public_security_group_id" {
  description = "Security group ID for Tier 1 public services"
  value       = module.security.tier1_public_security_group_id
}

output "tier2_admin_security_group_id" {
  description = "Security group ID for Tier 2 admin/BFF portals"
  value       = module.security.tier2_admin_security_group_id
}

output "tier3_private_security_group_id" {
  description = "Security group ID for Tier 3 core banking services"
  value       = module.security.tier3_private_security_group_id
}

output "tier4_workers_security_group_id" {
  description = "Security group ID for Tier 4 pure headless workers (transaction-service) with zero ingress"
  value       = module.security.tier4_workers_security_group_id
}

output "webhook_security_group_id" {
  description = "Security group ID for Webhook Dispatcher service"
  value       = module.security.webhook_security_group_id
}

output "rds_security_group_id" {
  description = "Security group ID for RDS PostgreSQL"
  value       = module.security.rds_security_group_id
}

output "rds_proxy_security_group_id" {
  description = "Security group ID for RDS Proxy"
  value       = module.security.rds_proxy_security_group_id
}

output "redis_security_group_id" {
  description = "Security group ID for ElastiCache Redis"
  value       = module.security.redis_security_group_id
}

output "msk_security_group_id" {
  description = "Security group ID for Amazon MSK"
  value       = module.security.msk_security_group_id
}

output "ecr_repository_urls" {
  description = "Map of microservice names to their ECR repository URLs"
  value       = module.ecr.repository_urls
}

# ------------------------------------------------------------------------------
# Milestone 2: S3 Storage Buckets (Evaluates to null if M2 is disabled)
# ------------------------------------------------------------------------------
output "kyc_bucket_name" {
  description = "S3 bucket name for KYC identity documents"
  value       = one(module.s3_storage[*].kyc_bucket_name)
}

output "dispute_bucket_name" {
  description = "S3 bucket name for dispute evidence"
  value       = one(module.s3_storage[*].dispute_bucket_name)
}

output "settlement_bucket_name" {
  description = "S3 bucket name for bank settlement statements"
  value       = one(module.s3_storage[*].settlement_bucket_name)
}

output "reports_bucket_name" {
  description = "S3 bucket name for accounting audit reports"
  value       = one(module.s3_storage[*].reports_bucket_name)
}

output "storage_kms_key_arn" {
  description = "KMS Key ARN encrypting storage buckets"
  value       = one(module.s3_storage[*].storage_kms_key_arn)
}

# ------------------------------------------------------------------------------
# Milestone 2: Ingress & CDN (Evaluates to null if M2 is disabled)
# ------------------------------------------------------------------------------
output "alb_dns_name" {
  description = "Public DNS name of the Application Load Balancer"
  value       = one(module.ingress[*].alb_dns_name)
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = one(module.ingress[*].alb_arn)
}

output "waf_web_acl_arn" {
  description = "ARN of the AWS WAFv2 Web ACL protecting the ALB"
  value       = one(module.ingress[*].waf_web_acl_arn)
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront CDN distribution for Merchant Portal SPA"
  value       = one(module.cloudfront[*].cloudfront_domain_name)
}

output "frontend_spa_bucket_name" {
  description = "S3 bucket name storing frontend static assets"
  value       = one(module.cloudfront[*].frontend_bucket_name)
}

# ------------------------------------------------------------------------------
# Milestone 2: VPC Interface Endpoints (Evaluates to null if M2 is disabled)
# ------------------------------------------------------------------------------
output "vpc_endpoint_security_group_id" {
  description = "Security group ID protecting VPC Interface Endpoints"
  value       = one(module.vpc_endpoints[*].endpoint_security_group_id)
}

output "vpc_interface_endpoint_ids" {
  description = "Map of created VPC interface endpoint IDs"
  value       = one(module.vpc_endpoints[*].endpoint_ids)
}

# ------------------------------------------------------------------------------
# Milestone 3: Databases & Caches (Evaluates to null if M3 is disabled)
# ------------------------------------------------------------------------------
output "rds_instance_endpoint" {
  description = "Direct connection endpoint for RDS PostgreSQL instance"
  value       = one(module.rds[*].db_instance_endpoint)
}

output "rds_instance_address" {
  description = "DNS hostname of the RDS PostgreSQL instance"
  value       = one(module.rds[*].db_instance_address)
}

output "rds_instance_port" {
  description = "Database port for RDS PostgreSQL"
  value       = one(module.rds[*].db_instance_port)
}

output "rds_proxy_endpoint" {
  description = "Connection endpoint for the Amazon RDS Proxy"
  value       = one(module.rds[*].rds_proxy_endpoint)
}

output "rds_kms_key_arn" {
  description = "KMS Key ARN encrypting RDS storage"
  value       = one(module.rds[*].db_kms_key_arn)
}

output "rds_credentials_secret_arn" {
  description = "Secrets Manager secret ARN containing RDS master credentials"
  value       = one(module.rds[*].db_credentials_secret_arn)
}

output "redis_primary_endpoint_address" {
  description = "Primary endpoint address for ElastiCache Redis writes"
  value       = one(module.elasticache[*].primary_endpoint_address)
}

output "redis_reader_endpoint_address" {
  description = "Reader endpoint address for ElastiCache Redis read scaling"
  value       = one(module.elasticache[*].reader_endpoint_address)
}

output "redis_port" {
  description = "Port number for ElastiCache Redis"
  value       = one(module.elasticache[*].port)
}

output "redis_auth_secret_arn" {
  description = "Secrets Manager secret ARN containing Redis auth token and configuration"
  value       = one(module.elasticache[*].redis_auth_secret_arn)
}

# ------------------------------------------------------------------------------
# Milestone 4: ECS Fleet & Cloud Map Discovery (Evaluates to null if M4 is disabled)
# ------------------------------------------------------------------------------
output "ecs_cluster_id" {
  description = "The ECS Cluster ID"
  value       = one(module.ecs[*].cluster_id)
}

output "ecs_cluster_arn" {
  description = "The ECS Cluster ARN"
  value       = one(module.ecs[*].cluster_arn)
}

output "cloudmap_namespace_id" {
  description = "The Cloud Map Private DNS Namespace ID"
  value       = one(module.ecs[*].cloudmap_namespace_id)
}

output "cloudmap_service_discovery_domains" {
  description = "Map of Cloud Map internal DNS names for microservices"
  value       = one(module.ecs[*].service_discovery_domains)
}


