# ==============================================================================
# Payment Gateway — Staging Environment Variables
# Milestone 1: Foundation (VPC, Security, ECR) [Applied: 69 resources]
# Milestone 2: Ingress & Storage (ALB, WAF, S3, CloudFront OAC, VPC Endpoints)
# ==============================================================================

aws_region   = "eu-north-1"
project_name = "payment-gateway"
environment  = "staging"

# ------------------------------------------------------------------------------
# Milestone 2 Feature Flag
# ------------------------------------------------------------------------------
enable_milestone2_ingress_storage = true

# Network Configuration
vpc_cidr                  = "10.20.0.0/16"
availability_zones        = ["eu-north-1a", "eu-north-1b"]
public_subnet_cidrs       = ["10.20.0.0/24", "10.20.1.0/24"]
private_app_subnet_cidrs  = ["10.20.10.0/24", "10.20.11.0/24"]
private_data_subnet_cidrs = ["10.20.20.0/24", "10.20.21.0/24"]

# Cost optimizations & direct RDS connection (free tier / benchmark profile)
enable_nat_gateway_per_az   = false
allow_direct_rds_connection = true
waf_rate_limit              = 2000

# ------------------------------------------------------------------------------
# Milestone 3: Database & Cache (RDS, Redis)
# ------------------------------------------------------------------------------
enable_milestone3_databases = true
rds_instance_class          = "db.t4g.micro"
rds_allocated_storage       = 20
rds_max_allocated_storage   = 100
rds_multi_az                = false
enable_rds_proxy            = false
rds_backup_retention_period = 1
redis_node_type             = "cache.t4g.micro"
redis_num_cache_clusters    = 2

# ------------------------------------------------------------------------------
# Milestone 4: ECS Fargate Fleet & Cloud Map Service Discovery
# ------------------------------------------------------------------------------
enable_milestone4_ecs = true
service_desired_count = 1
ecs_default_cpu       = 256
ecs_default_memory    = 512



