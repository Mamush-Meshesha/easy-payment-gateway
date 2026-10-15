variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "payment-gateway"
}

variable "environment" {
  description = "Target deployment environment"
  type        = string
}

variable "aws_region" {
  description = "AWS region for bucket location"
  type        = string
  default     = "eu-north-1"
}

variable "enable_versioning" {
  description = "Enable object versioning across storage buckets"
  type        = bool
  default     = true
}

variable "retention_days_reports" {
  description = "Days before transitioning older accounting reports to infrequent access or expiration"
  type        = number
  default     = 365
}
