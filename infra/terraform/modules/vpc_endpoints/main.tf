# ==============================================================================
# AWS VPC Interface Endpoints (ECR API, ECR DKR, Secrets Manager, CloudWatch)
# ==============================================================================

# Dedicated Security Group for VPC Interface Endpoints
resource "aws_security_group" "endpoints" {
  name        = "${var.project_name}-${var.environment}-sg-vpc-endpoints"
  description = "Controls HTTPS access to private AWS service interface endpoints"
  vpc_id      = var.vpc_id

  ingress {
    description     = "HTTPS from authorized application task security groups"
    from_port       = 443
    to_port         = 443
    protocol        = "tcp"
    security_groups = var.authorized_security_group_ids
  }

  egress {
    description = "Allow outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-sg-vpc-endpoints"
    Environment = var.environment
  }
}

locals {
  interface_services = {
    ecr_api = "com.amazonaws.${var.aws_region}.ecr.api"
    ecr_dkr = "com.amazonaws.${var.aws_region}.ecr.dkr"
    secrets = "com.amazonaws.${var.aws_region}.secretsmanager"
    logs    = "com.amazonaws.${var.aws_region}.logs"
  }
}

resource "aws_vpc_endpoint" "interface_endpoints" {
  for_each = local.interface_services

  vpc_id              = var.vpc_id
  service_name        = each.value
  vpc_endpoint_type   = "Interface"
  subnet_ids          = var.subnet_ids
  security_group_ids  = [aws_security_group.endpoints.id]
  private_dns_enabled = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-vpce-${each.key}"
    Service     = each.key
    Environment = var.environment
  }
}
