output "alb_id" {
  description = "The ID of the Application Load Balancer"
  value       = aws_lb.main.id
}

output "alb_arn" {
  description = "The ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "alb_dns_name" {
  description = "The public DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "The canonical hosted zone ID of the Application Load Balancer"
  value       = aws_lb.main.zone_id
}

output "http_listener_arn" {
  description = "The ARN of the HTTP listener (port 80)"
  value       = aws_lb_listener.http.arn
}

output "https_listener_arn" {
  description = "The ARN of the HTTPS listener (port 443, empty if custom domain disabled)"
  value       = length(aws_lb_listener.https) > 0 ? aws_lb_listener.https[0].arn : null
}

output "waf_web_acl_arn" {
  description = "The ARN of the AWS WAFv2 Web ACL"
  value       = aws_wafv2_web_acl.alb_waf.arn
}
