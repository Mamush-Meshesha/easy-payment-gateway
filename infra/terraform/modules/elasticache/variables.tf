variable "project_name" {
  description = "Project name identifier"
  type        = string
}

variable "environment" {
  description = "Target deployment environment (staging, production)"
  type        = string
}

variable "database_subnet_ids" {
  description = "Private isolated data subnet IDs across AZs"
  type        = list(string)
}

variable "redis_security_group_id" {
  description = "Security group ID for ElastiCache Redis"
  type        = string
}

variable "node_type" {
  description = "ElastiCache node instance class"
  type        = string
  default     = "cache.t4g.micro"
}

variable "num_cache_clusters" {
  description = "Total number of cache clusters (1 Primary + (N-1) Replicas)"
  type        = number
  default     = 2
}

variable "multi_az_enabled" {
  description = "Whether to enable Multi-AZ automatic failover"
  type        = bool
  default     = true
}

variable "automatic_failover_enabled" {
  description = "Whether a read replica is promoted to primary upon failure"
  type        = bool
  default     = true
}

variable "snapshot_retention_limit" {
  description = "Number of days for which automated snapshots are retained"
  type        = number
  default     = 7
}
