variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "payment-gateway"
}

variable "environment" {
  description = "Target deployment environment"
  type        = string
}

variable "price_class" {
  description = "CloudFront distribution price class"
  type        = string
  default     = "PriceClass_100"
}
