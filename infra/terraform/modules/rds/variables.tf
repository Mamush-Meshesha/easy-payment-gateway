variable "project_name" {
  description = "Project name identifier"
  type        = string
}

variable "environment" {
  description = "Target deployment environment (staging, production)"
  type        = string
}

variable "aws_region" {
  description = "AWS deployment region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where RDS and RDS Proxy reside"
  type        = string
}

variable "database_subnet_ids" {
  description = "Private isolated data subnet IDs across AZs"
  type        = list(string)
}

variable "rds_security_group_id" {
  description = "Security group ID for RDS PostgreSQL"
  type        = string
}

variable "rds_proxy_security_group_id" {
  description = "Security group ID for RDS Proxy"
  type        = string
}

variable "db_name" {
  description = "Default database name"
  type        = string
  default     = "payment_gateway"
}

variable "db_username" {
  description = "Master database username"
  type        = string
  default     = "gateway_admin"
}

variable "db_instance_class" {
  description = "RDS DB instance class (db.t4g.micro for Free Tier, db.t4g.medium+ for prod)"
  type        = string
  default     = "db.t4g.micro"
}

variable "allocated_storage" {
  description = "Allocated storage in gigabytes (20 for Free Tier)"
  type        = number
  default     = 20
}

variable "max_allocated_storage" {
  description = "Maximum storage limit for autoscaling in gigabytes"
  type        = number
  default     = 100
}

variable "multi_az" {
  description = "Deploy RDS instance across multiple availability zones"
  type        = bool
  default     = true
}

variable "enable_deletion_protection" {
  description = "Prevent accidental deletion of RDS instance"
  type        = bool
  default     = false
}

variable "backup_retention_period" {
  description = "Number of days to retain automated backups (1 for Free Tier accounts, 7-30 for production)"
  type        = number
  default     = 1
}

variable "enable_rds_proxy" {
  description = "Whether to provision Amazon RDS Proxy for connection pooling"
  type        = bool
  default     = true
}
