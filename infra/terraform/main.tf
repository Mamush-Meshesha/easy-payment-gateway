terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    cockroach = {
      source  = "cockroachdb/cockroach"
      version = "~> 1.0"
    }
  }
}

# Active Region (US East)
provider "aws" {
  region = "us-east-1"
  alias  = "us_east"
}

# Active Region (EU West)
provider "aws" {
  region = "eu-west-1"
  alias  = "eu_west"
}

provider "cockroach" {
  # API Key should be passed via COCKROACH_API_KEY env var
}

# ==========================================================
# Route53 Latency-Based Routing (Global Traffic Manager)
# ==========================================================
resource "aws_route53_zone" "payment_gateway" {
  name = "api.paymentgateway.local"
}

resource "aws_route53_health_check" "us_east_health" {
  fqdn              = "us-east.api.paymentgateway.local"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "10"
}

resource "aws_route53_health_check" "eu_west_health" {
  fqdn              = "eu-west.api.paymentgateway.local"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "10"
}

# Route traffic to US East if latency is lower, failover if unhealthy
resource "aws_route53_record" "api_us" {
  zone_id = aws_route53_zone.payment_gateway.zone_id
  name    = "api.paymentgateway.local"
  type    = "A"
  
  set_identifier = "us-east-region"
  
  latency_routing_policy {
    region = "us-east-1"
  }
  
  health_check_id = aws_route53_health_check.us_east_health.id
  records         = ["10.0.1.50"] # Placeholder for API Gateway LB
  ttl             = 60
}

# Route traffic to EU West if latency is lower, failover if unhealthy
resource "aws_route53_record" "api_eu" {
  zone_id = aws_route53_zone.payment_gateway.zone_id
  name    = "api.paymentgateway.local"
  type    = "A"
  
  set_identifier = "eu-west-region"
  
  latency_routing_policy {
    region = "eu-west-1"
  }
  
  health_check_id = aws_route53_health_check.eu_west_health.id
  records         = ["10.1.1.50"] # Placeholder for API Gateway LB
  ttl             = 60
}

# ==========================================================
# CockroachDB Global Serverless Cluster (Multi-Region SQL)
# ==========================================================
resource "cockroach_cluster" "global_payment_db" {
  name           = "global-payment-ledger"
  cloud_provider = "AWS"
  serverless = {
    routing_id = "payment-gateway-routing"
  }
  regions = [
    {
      name = "us-east-1"
      primary = true
    },
    {
      name = "eu-west-1"
    }
  ]
}
