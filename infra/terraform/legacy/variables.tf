variable "aws_region" {
  description = "The AWS region to deploy the infrastructure to"
  type        = string
  default     = "af-south-1" # Cape Town region, geographically closest for Ethiopian market
}

variable "environment" {
  description = "Environment name (e.g. dev, staging, prod)"
  type        = string
  default     = "dev"
}
