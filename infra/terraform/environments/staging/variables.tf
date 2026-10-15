variable "aws_region" {
  description = "AWS deployment region"
  type        = string
  default     = "eu-north-1"
}

variable "project_name" {
  description = "Project name identifier"
  type        = string
  default     = "payment-gateway"
}

variable "environment" {
  description = "Target deployment environment"
  type        = string
  default     = "staging"
}

variable "vpc_cidr" {
  description = "CIDR block for staging VPC"
  type        = string
  default     = "10.20.0.0/16"
}

variable "availability_zones" {
  description = "Availability zone names to deploy subnets into"
  type        = list(string)
  default     = ["eu-north-1a", "eu-north-1b"]
}

variable "availability_zone_ids" {
  description = "Optional explicit AZ IDs (e.g. ['euw1-az1', 'euw1-az2']) to prevent account-specific AZ name mapping divergence"
  type        = list(string)
  default     = []
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.20.0.0/24", "10.20.1.0/24"]
}

variable "private_app_subnet_cidrs" {
  description = "CIDR blocks for private application subnets"
  type        = list(string)
  default     = ["10.20.10.0/24", "10.20.11.0/24"]
}

variable "private_data_subnet_cidrs" {
  description = "CIDR blocks for private data subnets"
  type        = list(string)
  default     = ["10.20.20.0/24", "10.20.21.0/24"]
}

variable "enable_nat_gateway_per_az" {
  description = "Whether to provision one NAT Gateway per AZ (false = 1 shared NAT GW for staging to save cost)"
  type        = bool
  default     = false
}

variable "allow_direct_rds_connection" {
  description = "Explicit toggle to permit application tiers direct access to RDS PostgreSQL (bypassing proxy for migration/benchmarking)"
  type        = bool
  default     = false
}

variable "service_names" {
  description = "List of microservices to create private ECR repositories for"
  type        = list(string)
  default = [
    "auth-service",
    "merchant-service",
    "admin-service",
    "dashboard-service",
    "notification-service",
    "reporting-service",
    "payment-service",
    "transaction-service",
    "provider-service",
    "webhook-service",
    "ledger-service",
    "reconciliation-service",
    "settlement-service",
    "risk-service",
    "billing-service",
    "dispute-service"
  ]
}

variable "ecr_image_tag_mutability" {
  description = "Tag mutability setting for ECR repositories (IMMUTABLE or MUTABLE)"
  type        = string
  default     = "MUTABLE"
}

variable "ecr_keep_last_n_images" {
  description = "Number of tagged images to keep in ECR"
  type        = number
  default     = 30
}

# ------------------------------------------------------------------------------
# Milestone 2: Feature Flag & Variables
# ------------------------------------------------------------------------------
variable "enable_milestone2_ingress_storage" {
  description = "Feature flag to enable Milestone 2 resources (ALB, WAF, S3 document storage, CloudFront, VPC Interface Endpoints). Default false guarantees Milestone 1 Foundation isolation."
  type        = bool
  default     = false
}

variable "enable_custom_domain" {
  description = "Whether to provision Route 53 validation and ACM certificate for ALB"
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Custom domain name for public API ALB"
  type        = string
  default     = ""
}

variable "route53_zone_id" {
  description = "Route 53 hosted zone ID for domain validation and alias records"
  type        = string
  default     = ""
}

variable "waf_rate_limit" {
  description = "Max requests per 5-minute evaluation window per IP in WAF"
  type        = number
  default     = 2000
}

# ------------------------------------------------------------------------------
# Milestone 3: Database & Cache Feature Flags & Variables
# ------------------------------------------------------------------------------
variable "enable_milestone3_databases" {
  description = "Feature flag to enable Milestone 3 data resources (Amazon RDS PostgreSQL, RDS Proxy, and Amazon ElastiCache Redis). Default false guarantees Milestone 1 & 2 isolation."
  type        = bool
  default     = false
}

variable "rds_instance_class" {
  description = "Instance class for staging RDS PostgreSQL"
  type        = string
  default     = "db.t4g.small"
}

variable "rds_allocated_storage" {
  description = "Allocated storage in GB for staging RDS PostgreSQL"
  type        = number
  default     = 50
}

variable "rds_max_allocated_storage" {
  description = "Maximum storage in GB for autoscaling"
  type        = number
  default     = 500
}

variable "rds_multi_az" {
  description = "Deploy RDS instance across multiple availability zones"
  type        = bool
  default     = true
}

variable "enable_rds_proxy" {
  description = "Whether to provision Amazon RDS Proxy for connection pooling"
  type        = bool
  default     = true
}

variable "redis_node_type" {
  description = "Instance class for ElastiCache Redis cluster"
  type        = string
  default     = "cache.t4g.micro"
}

variable "redis_num_cache_clusters" {
  description = "Number of cache nodes in the Redis replication group"
  type        = number
  default     = 2
}

variable "rds_backup_retention_period" {
  description = "Number of days to retain automated backups (1 for Free Tier accounts, 7-30 for production)"
  type        = number
  default     = 1
}

# ------------------------------------------------------------------------------
# Milestone 4: ECS Fargate Fleet Feature Flags & Variables
# ------------------------------------------------------------------------------
variable "enable_milestone4_ecs" {
  description = "Feature flag to enable Milestone 4 ECS Fargate cluster, Cloud Map private DNS, and microservice task definitions. Default false guarantees isolation."
  type        = bool
  default     = false
}

variable "service_desired_count" {
  description = "Desired number of running tasks per microservice (0 until images are pushed, 1+ for active rollout)"
  type        = number
  default     = 0
}

variable "ecs_default_cpu" {
  description = "Fargate CPU units per task"
  type        = number
  default     = 256
}

variable "ecs_default_memory" {
  description = "Fargate memory in MiB per task"
  type        = number
  default     = 512
}



