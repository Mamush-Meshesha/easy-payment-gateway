# ==============================================================================
# Payment Gateway — Staging Environment
# Milestone 1: Foundation (Networking, Security, ECR)
# Milestone 2: Ingress & Storage (ALB, WAF, S3, CloudFront OAC, VPC Endpoints)
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }

  # After bootstrapping with infra/terraform/bootstrap/, enable remote state:
  # backend "s3" {
  #   bucket         = "payment-gateway-tf-state-staging"
  #   key            = "staging/terraform.tfstate"
  #   region         = "eu-north-1"
  #   encrypt        = true
  #   dynamodb_table = "payment-gateway-tf-locks-staging"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# ------------------------------------------------------------------------------
# Milestone 1: VPC Networking (6 Subnets across 2 AZs, NAT Gateway, S3 GW Endpoint)
# ------------------------------------------------------------------------------
module "vpc" {
  source = "../../modules/vpc"

  project_name              = var.project_name
  environment               = var.environment
  vpc_cidr                  = var.vpc_cidr
  availability_zones        = var.availability_zones
  availability_zone_ids     = var.availability_zone_ids
  public_subnet_cidrs       = var.public_subnet_cidrs
  private_app_subnet_cidrs  = var.private_app_subnet_cidrs
  private_data_subnet_cidrs = var.private_data_subnet_cidrs
  enable_nat_gateway_per_az = var.enable_nat_gateway_per_az
}

# ------------------------------------------------------------------------------
# Milestone 1: Security Groups (4-Tier Isolation with Worker-to-Core Access)
# ------------------------------------------------------------------------------
module "security" {
  source = "../../modules/security"

  project_name                = var.project_name
  environment                 = var.environment
  vpc_id                      = module.vpc.vpc_id
  allow_direct_rds_connection = var.allow_direct_rds_connection
}

# ------------------------------------------------------------------------------
# Milestone 1: Private ECR Repositories (16 Microservices with Scanning & Lifecycle)
# ------------------------------------------------------------------------------
module "ecr" {
  source = "../../modules/ecr"

  project_name         = var.project_name
  environment          = var.environment
  service_names        = var.service_names
  image_tag_mutability = var.ecr_image_tag_mutability
  scan_on_push         = true
  keep_last_n_images   = var.ecr_keep_last_n_images
}

# ==============================================================================
# Milestone 2: Private S3 Storage (KYC, Disputes, Statements, Audit Reports)
# ==============================================================================
module "s3_storage" {
  count  = var.enable_milestone2_ingress_storage ? 1 : 0
  source = "../../modules/s3_storage"

  project_name      = var.project_name
  environment       = var.environment
  aws_region        = var.aws_region
  enable_versioning = true
}

# ==============================================================================
# Milestone 2: VPC Interface Endpoints (ECR API, ECR DKR, Secrets, CloudWatch)
# ==============================================================================
module "vpc_endpoints" {
  count  = var.enable_milestone2_ingress_storage ? 1 : 0
  source = "../../modules/vpc_endpoints"

  project_name = var.project_name
  environment  = var.environment
  aws_region   = var.aws_region
  vpc_id       = module.vpc.vpc_id
  subnet_ids   = module.vpc.private_app_subnet_ids
  authorized_security_group_ids = [
    module.security.tier1_public_security_group_id,
    module.security.tier2_admin_security_group_id,
    module.security.tier3_private_security_group_id,
    module.security.tier4_workers_security_group_id,
    module.security.webhook_security_group_id
  ]
}

# ==============================================================================
# Milestone 2: Public Ingress (ALB, optional ACM/Route 53, and Monitored WAFv2)
# ==============================================================================
module "ingress" {
  count  = var.enable_milestone2_ingress_storage ? 1 : 0
  source = "../../modules/ingress"

  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = module.vpc.vpc_id
  public_subnet_ids     = module.vpc.public_subnet_ids
  alb_security_group_id = module.security.alb_security_group_id
  domain_name           = var.domain_name
  enable_custom_domain  = var.enable_custom_domain
  route53_zone_id       = var.route53_zone_id
  waf_rate_limit        = var.waf_rate_limit
}

# ==============================================================================
# Milestone 2: CloudFront CDN with Origin Access Control (Merchant Portal SPA)
# ==============================================================================
module "cloudfront" {
  count  = var.enable_milestone2_ingress_storage ? 1 : 0
  source = "../../modules/cloudfront"

  project_name = var.project_name
  environment  = var.environment
}

# ==============================================================================
# Milestone 3: Database & Cache Infrastructure (RDS PostgreSQL, Proxy, Redis)
# ==============================================================================
module "rds" {
  count  = var.enable_milestone3_databases ? 1 : 0
  source = "../../modules/rds"

  project_name                = var.project_name
  environment                 = var.environment
  aws_region                  = var.aws_region
  vpc_id                      = module.vpc.vpc_id
  database_subnet_ids         = module.vpc.private_data_subnet_ids
  rds_security_group_id       = module.security.rds_security_group_id
  rds_proxy_security_group_id = module.security.rds_proxy_security_group_id

  db_instance_class          = var.rds_instance_class
  allocated_storage          = var.rds_allocated_storage
  max_allocated_storage      = var.rds_max_allocated_storage
  multi_az                   = var.rds_multi_az
  enable_rds_proxy           = var.enable_rds_proxy
  backup_retention_period    = var.rds_backup_retention_period
  enable_deletion_protection = false
}

module "elasticache" {
  count  = var.enable_milestone3_databases ? 1 : 0
  source = "../../modules/elasticache"

  project_name            = var.project_name
  environment             = var.environment
  database_subnet_ids     = module.vpc.private_data_subnet_ids
  redis_security_group_id = module.security.redis_security_group_id

  node_type                  = var.redis_node_type
  num_cache_clusters         = var.redis_num_cache_clusters
  multi_az_enabled           = true
  automatic_failover_enabled = true
}

# ==============================================================================
# Milestone 4: ECS Fargate Fleet & Cloud Map Service Discovery
# ==============================================================================
module "ecs" {
  count  = var.enable_milestone4_ecs ? 1 : 0
  source = "../../modules/ecs"

  project_name           = var.project_name
  environment            = var.environment
  aws_region             = var.aws_region
  vpc_id                 = module.vpc.vpc_id
  private_app_subnet_ids = module.vpc.private_app_subnet_ids
  alb_listener_arn       = one(module.ingress[*].http_listener_arn)

  security_group_ids = {
    "tier1_public"  = module.security.tier1_public_security_group_id
    "tier2_admin"   = module.security.tier2_admin_security_group_id
    "tier3_private" = module.security.tier3_private_security_group_id
    "tier4_workers" = module.security.tier4_workers_security_group_id
    "webhook"       = module.security.webhook_security_group_id
  }

  ecr_repository_urls = module.ecr.repository_urls

  database_address                = one(module.rds[*].db_instance_address)
  database_port                   = one(module.rds[*].db_instance_port)
  database_name                   = "payment_gateway"
  database_credentials_secret_arn = one(module.rds[*].db_credentials_secret_arn)

  redis_endpoint        = one(module.elasticache[*].primary_endpoint_address)
  redis_port            = one(module.elasticache[*].port)
  redis_auth_secret_arn = one(module.elasticache[*].redis_auth_secret_arn)

  kms_key_arns = compact([
    one(module.s3_storage[*].storage_kms_key_arn),
    one(module.rds[*].db_kms_key_arn)
  ])

  s3_bucket_arns = compact([
    one(module.s3_storage[*].kyc_bucket_arn),
    one(module.s3_storage[*].dispute_bucket_arn),
    one(module.s3_storage[*].settlement_bucket_arn),
    one(module.s3_storage[*].reports_bucket_arn)
  ])

  default_cpu           = var.ecs_default_cpu
  default_memory        = var.ecs_default_memory
  service_desired_count = var.service_desired_count
}


