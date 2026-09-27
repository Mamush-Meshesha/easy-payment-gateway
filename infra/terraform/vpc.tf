# -------------------------------------------------------------
# VPC and Networking Foundation
# -------------------------------------------------------------
resource "aws_vpc" "payment_gateway" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "payment-gateway-vpc"
    Environment = var.environment
  }
}

# Public Subnets (For Load Balancers / API Gateway)
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.payment_gateway.id
  cidr_block              = cidrsubnet(aws_vpc.payment_gateway.cidr_block, 8, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "payment-gateway-public-${count.index + 1}"
  }
}

# Private Subnets (For Microservices & Databases)
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.payment_gateway.id
  cidr_block        = cidrsubnet(aws_vpc.payment_gateway.cidr_block, 8, count.index + 3)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "payment-gateway-private-${count.index + 1}"
  }
}

# NAT Gateway for Outbound Internet Access (Providers/Webhooks)
resource "aws_eip" "nat" {
  domain = "vpc"
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id
  depends_on    = [aws_internet_gateway.main]
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.payment_gateway.id
}
