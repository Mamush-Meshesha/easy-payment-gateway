# infra/terraform/route53.tf
# Terraform configuration for Route53 Latency-Based Routing

resource "aws_route53_zone" "payment_gateway" {
  provider = aws.primary
  name     = "api.paymentgateway.com"
}

# Health Check for US-East-1 API Gateway
resource "aws_route53_health_check" "us_east_health" {
  provider          = aws.primary
  fqdn              = "us-east.api.paymentgateway.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 10
}

# Health Check for EU-West-1 API Gateway
resource "aws_route53_health_check" "eu_west_health" {
  provider          = aws.primary
  fqdn              = "eu-west.api.paymentgateway.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = 3
  request_interval  = 10
}

# Latency Record for US-East-1
resource "aws_route53_record" "api_us" {
  provider = aws.primary
  zone_id  = aws_route53_zone.payment_gateway.zone_id
  name     = "api.paymentgateway.com"
  type     = "A"

  set_identifier = "us-east-1-region"
  
  latency_routing_policy {
    region = "us-east-1"
  }

  health_check_id = aws_route53_health_check.us_east_health.id

  alias {
    name                   = "us-east.api.paymentgateway.com"
    zone_id                = "Z1234567890" # Replace with actual API GW Zone ID
    evaluate_target_health = true
  }
}

# Latency Record for EU-West-1
resource "aws_route53_record" "api_eu" {
  provider = aws.primary
  zone_id  = aws_route53_zone.payment_gateway.zone_id
  name     = "api.paymentgateway.com"
  type     = "A"

  set_identifier = "eu-west-1-region"

  latency_routing_policy {
    region = "eu-west-1"
  }

  health_check_id = aws_route53_health_check.eu_west_health.id

  alias {
    name                   = "eu-west.api.paymentgateway.com"
    zone_id                = "Z0987654321" # Replace with actual API GW Zone ID
    evaluate_target_health = true
  }
}
