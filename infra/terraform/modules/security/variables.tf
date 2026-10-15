variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "payment-gateway"
}

variable "environment" {
  description = "Environment name (staging/production)"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC where security groups will be created"
  type        = string
}

variable "allow_direct_rds_connection" {
  description = "Explicit toggle to allow application tiers direct connectivity to RDS PostgreSQL (bypassing RDS Proxy for initial migration scripts or benchmarking). Default false enforces RDS Proxy only."
  type        = bool
  default     = false
}
