variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "payment-gateway"
}

variable "environment" {
  description = "Target deployment environment"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where ALB is deployed"
  type        = string
}

variable "public_subnet_ids" {
  description = "Public subnet IDs where ALB nodes will be placed"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "Security group ID for Application Load Balancer"
  type        = string
}

variable "domain_name" {
  description = "Primary custom domain name for the payment gateway API (e.g. staging-api.paymentgateway.et)"
  type        = string
  default     = ""
}

variable "enable_custom_domain" {
  description = "Whether to provision ACM certificate and Route 53 validation (false uses default HTTP listener for staging testing)"
  type        = bool
  default     = false
}

variable "route53_zone_id" {
  description = "Route 53 hosted zone ID for domain validation and alias records"
  type        = string
  default     = ""
}

variable "waf_rate_limit" {
  description = "Max requests per 5-minute evaluation window per IP"
  type        = number
  default     = 2000
}
