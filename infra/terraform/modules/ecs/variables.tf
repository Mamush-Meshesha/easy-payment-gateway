variable "project_name" {
  description = "Project name identifier"
  type        = string
}

variable "environment" {
  description = "Deployment environment (staging, production)"
  type        = string
}

variable "aws_region" {
  description = "AWS deployment region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where ECS tasks and Cloud Map discovery reside"
  type        = string
}

variable "private_app_subnet_ids" {
  description = "List of private application subnets across AZs"
  type        = list(string)
}

variable "alb_listener_arn" {
  description = "ARN of the public ALB HTTP listener for route rules"
  type        = string
}

variable "security_group_ids" {
  description = "Map of security group IDs per service tier"
  type        = map(string)
}

variable "ecr_repository_urls" {
  description = "Map of ECR repository URLs keyed by service name"
  type        = map(string)
}

variable "database_address" {
  description = "Hostname of the RDS PostgreSQL database"
  type        = string
}

variable "database_port" {
  description = "Port of the RDS PostgreSQL database"
  type        = number
  default     = 5432
}

variable "database_name" {
  description = "Default database name"
  type        = string
  default     = "payment_gateway"
}

variable "database_credentials_secret_arn" {
  description = "Secrets Manager secret ARN containing master database credentials"
  type        = string
}

variable "redis_endpoint" {
  description = "Primary endpoint address for ElastiCache Redis"
  type        = string
}

variable "redis_port" {
  description = "Port for ElastiCache Redis"
  type        = number
  default     = 6379
}

variable "redis_auth_secret_arn" {
  description = "Secrets Manager secret ARN containing Redis auth token"
  type        = string
}

variable "kms_key_arns" {
  description = "List of KMS Key ARNs for secret decryption and storage access"
  type        = list(string)
  default     = []
}

variable "s3_bucket_arns" {
  description = "List of S3 Bucket ARNs for task document access"
  type        = list(string)
  default     = []
}

variable "default_cpu" {
  description = "Fargate CPU units per task (256 = 0.25 vCPU)"
  type        = number
  default     = 256
}

variable "default_memory" {
  description = "Fargate memory in MiB per task"
  type        = number
  default     = 512
}

variable "service_desired_count" {
  description = "Desired number of running tasks per microservice"
  type        = number
  default     = 0
}

variable "log_retention_in_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 7
}
