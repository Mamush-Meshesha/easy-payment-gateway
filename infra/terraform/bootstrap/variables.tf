variable "aws_region" {
  description = "Primary AWS Region for the payment gateway"
  type        = string
  default     = "eu-north-1"
}

variable "environment" {
  description = "Environment name (bootstrap)"
  type        = string
  default     = "bootstrap"
}

variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "payment-gateway"
}
