output "endpoint_security_group_id" {
  description = "Security group ID for VPC Interface Endpoints"
  value       = aws_security_group.endpoints.id
}

output "endpoint_ids" {
  description = "Map of interface endpoint names to their IDs"
  value       = { for k, v in aws_vpc_endpoint.interface_endpoints : k => v.id }
}
