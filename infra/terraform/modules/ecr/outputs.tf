output "repository_urls" {
  description = "Map of microservice names to their ECR repository URLs"
  value       = { for k, v in aws_ecr_repository.services : k => v.repository_url }
}

output "repository_arns" {
  description = "Map of microservice names to their ECR repository ARNs"
  value       = { for k, v in aws_ecr_repository.services : k => v.arn }
}

output "repository_names" {
  description = "List of created repository names"
  value       = [for v in aws_ecr_repository.services : v.name]
}
