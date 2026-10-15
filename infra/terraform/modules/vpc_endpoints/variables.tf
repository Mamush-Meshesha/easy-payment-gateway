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
  description = "AWS region"
  type        = string
  default     = "eu-north-1"
}

variable "vpc_id" {
  description = "VPC ID where interface endpoints are placed"
  type        = string
}

variable "subnet_ids" {
  description = "Private application subnets where ENIs will be provisioned"
  type        = list(string)
}

variable "authorized_security_group_ids" {
  description = "List of application task security groups authorized to connect to VPC endpoints on port 443"
  type        = list(string)
}
