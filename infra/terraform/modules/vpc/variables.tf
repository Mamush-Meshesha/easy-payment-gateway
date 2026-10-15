variable "project_name" {
  description = "Project name prefix"
  type        = string
  default     = "payment-gateway"
}

variable "environment" {
  description = "Environment name (staging/production)"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.20.0.0/16"
}

variable "availability_zones" {
  description = "List of Availability Zone names in the primary region (used if availability_zone_ids is empty)"
  type        = list(string)
  default     = ["eu-north-1a", "eu-north-1b"]
}

variable "availability_zone_ids" {
  description = "Optional list of explicit AZ IDs (e.g. ['euw1-az1', 'euw1-az2']) to prevent account-specific AZ name mapping divergence"
  type        = list(string)
  default     = []
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public ingress subnets"
  type        = list(string)
  default     = ["10.20.0.0/24", "10.20.1.0/24"]
}

variable "private_app_subnet_cidrs" {
  description = "CIDR blocks for private application subnets"
  type        = list(string)
  default     = ["10.20.10.0/24", "10.20.11.0/24"]
}

variable "private_data_subnet_cidrs" {
  description = "CIDR blocks for private data subnets"
  type        = list(string)
  default     = ["10.20.20.0/24", "10.20.21.0/24"]
}

variable "enable_nat_gateway_per_az" {
  description = "Set to true for production (2 NAT Gateways) or false for staging (1 NAT Gateway)"
  type        = bool
  default     = false
}
