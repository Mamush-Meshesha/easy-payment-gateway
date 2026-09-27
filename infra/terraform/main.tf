terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ---------------------------------------------------------
# Placeholder for future production infrastructure
# ---------------------------------------------------------

# 1. VPC & Networking Foundation
# resource "aws_vpc" "payment_vpc" { ... }

# 2. Managed PostgreSQL (RDS)
# resource "aws_db_instance" "payment_db" { ... }

# 3. Managed Redis (ElastiCache)
# resource "aws_elasticache_cluster" "payment_redis" { ... }

# 4. Managed Kafka (MSK)
# resource "aws_msk_cluster" "payment_kafka" { ... }

# 5. Kubernetes Cluster (EKS) for Microservices
# resource "aws_eks_cluster" "payment_eks" { ... }
