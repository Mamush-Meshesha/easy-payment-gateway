output "cluster_id" {
  description = "The ECS Cluster ID"
  value       = aws_ecs_cluster.main.id
}

output "cluster_arn" {
  description = "The ECS Cluster ARN"
  value       = aws_ecs_cluster.main.arn
}

output "cloudmap_namespace_id" {
  description = "The AWS Cloud Map private DNS namespace ID"
  value       = aws_service_discovery_private_dns_namespace.main.id
}

output "cloudmap_namespace_arn" {
  description = "The AWS Cloud Map private DNS namespace ARN"
  value       = aws_service_discovery_private_dns_namespace.main.arn
}

output "ecs_execution_role_arn" {
  description = "IAM Role ARN used by ECS for task execution"
  value       = aws_iam_role.ecs_execution.arn
}

output "ecs_task_role_arn" {
  description = "IAM Role ARN assumed by running microservice containers"
  value       = aws_iam_role.ecs_task.arn
}

output "service_discovery_domains" {
  description = "Map of internal Cloud Map DNS hostnames for microservices"
  value       = { for k, v in local.services : k => "${k}.payment-gateway.internal" }
}

output "alb_target_group_arns" {
  description = "Map of ALB Target Group ARNs for public microservices"
  value       = { for k, v in aws_lb_target_group.services : k => v.arn }
}
