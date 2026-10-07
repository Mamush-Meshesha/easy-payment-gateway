# infra/terraform/database.tf
# Terraform configuration for Multi-Region AWS Aurora Global Database

provider "aws" {
  region = "us-east-1"
  alias  = "primary"
}

provider "aws" {
  region = "eu-west-1"
  alias  = "secondary"
}

# AWS Aurora Global Cluster
resource "aws_rds_global_cluster" "payment_gateway_global" {
  provider                  = aws.primary
  global_cluster_identifier = "pg-global-cluster"
  engine                    = "aurora-postgresql"
  engine_version            = "15.4"
  database_name             = "payment_gateway"
  storage_encrypted         = true
}

# Primary Cluster (US-East-1)
resource "aws_rds_cluster" "primary" {
  provider                  = aws.primary
  cluster_identifier        = "pg-cluster-primary"
  engine                    = aws_rds_global_cluster.payment_gateway_global.engine
  engine_version            = aws_rds_global_cluster.payment_gateway_global.engine_version
  global_cluster_identifier = aws_rds_global_cluster.payment_gateway_global.id
  master_username           = "postgres"
  master_password           = "supersecret" # Use AWS Secrets Manager in production
  skip_final_snapshot       = true
}

resource "aws_rds_cluster_instance" "primary_instance" {
  provider             = aws.primary
  count                = 2 # Multi-AZ
  identifier           = "pg-cluster-primary-instance-${count.index}"
  cluster_identifier   = aws_rds_cluster.primary.id
  instance_class       = "db.r6g.large"
  engine               = aws_rds_cluster.primary.engine
  engine_version       = aws_rds_cluster.primary.engine_version
}

# Secondary Cluster (EU-West-1)
resource "aws_rds_cluster" "secondary" {
  provider                  = aws.secondary
  cluster_identifier        = "pg-cluster-secondary"
  engine                    = aws_rds_global_cluster.payment_gateway_global.engine
  engine_version            = aws_rds_global_cluster.payment_gateway_global.engine_version
  global_cluster_identifier = aws_rds_global_cluster.payment_gateway_global.id
  skip_final_snapshot       = true

  # Enable Write Forwarding for Active-Active simulated experience
  enable_global_write_forwarding = true
  depends_on                     = [aws_rds_cluster_instance.primary_instance]
}

resource "aws_rds_cluster_instance" "secondary_instance" {
  provider             = aws.secondary
  count                = 2 # Multi-AZ
  identifier           = "pg-cluster-secondary-instance-${count.index}"
  cluster_identifier   = aws_rds_cluster.secondary.id
  instance_class       = "db.r6g.large"
  engine               = aws_rds_cluster.secondary.engine
  engine_version       = aws_rds_cluster.secondary.engine_version
}
