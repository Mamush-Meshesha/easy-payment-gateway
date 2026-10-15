variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "payment-gateway"
}

variable "environment" {
  description = "Deployment environment (staging, production)"
  type        = string
}

variable "service_names" {
  description = "List of microservice repository names to create"
  type        = list(string)
  default = [
    "auth-service",
    "merchant-service",
    "admin-service",
    "dashboard-service",
    "notification-service",
    "reporting-service",
    "payment-service",
    "transaction-service",
    "provider-service",
    "webhook-service",
    "ledger-service",
    "reconciliation-service",
    "settlement-service",
    "risk-service",
    "billing-service",
    "dispute-service"
  ]
}

variable "image_tag_mutability" {
  description = "The tag mutability setting for the repository (MUTABLE or IMMUTABLE)"
  type        = string
  default     = "IMMUTABLE"
}

variable "scan_on_push" {
  description = "Indicates whether images are scanned after being pushed to the repository"
  type        = bool
  default     = true
}

variable "keep_last_n_images" {
  description = "Number of tagged images to keep before pruning older versions"
  type        = number
  default     = 30
}
