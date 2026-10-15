# VPC Resource
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-vpc"
    Environment = var.environment
  }
}

# Internet Gateway for public ingress
resource "aws_internet_gateway" "gw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-${var.environment}-igw"
    Environment = var.environment
  }
}

# 1. Public Ingress Subnets (ALB & NAT Gateways)
resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = length(var.availability_zone_ids) > 0 ? null : var.availability_zones[count.index]
  availability_zone_id    = length(var.availability_zone_ids) > 0 ? var.availability_zone_ids[count.index] : null
  map_public_ip_on_launch = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-public-${length(var.availability_zone_ids) > 0 ? var.availability_zone_ids[count.index] : var.availability_zones[count.index]}"
    Tier        = "Public"
    Environment = var.environment
  }
}

# 2. Private Application Subnets (ECS Fargate Tasks & Workers)
resource "aws_subnet" "private_app" {
  count                   = length(var.private_app_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.private_app_subnet_cidrs[count.index]
  availability_zone       = length(var.availability_zone_ids) > 0 ? null : var.availability_zones[count.index]
  availability_zone_id    = length(var.availability_zone_ids) > 0 ? var.availability_zone_ids[count.index] : null
  map_public_ip_on_launch = false

  tags = {
    Name        = "${var.project_name}-${var.environment}-app-${length(var.availability_zone_ids) > 0 ? var.availability_zone_ids[count.index] : var.availability_zones[count.index]}"
    Tier        = "Private-App"
    Environment = var.environment
  }
}

# 3. Private Data Subnets (RDS, Redis, MSK)
resource "aws_subnet" "private_data" {
  count                   = length(var.private_data_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.private_data_subnet_cidrs[count.index]
  availability_zone       = length(var.availability_zone_ids) > 0 ? null : var.availability_zones[count.index]
  availability_zone_id    = length(var.availability_zone_ids) > 0 ? var.availability_zone_ids[count.index] : null
  map_public_ip_on_launch = false

  tags = {
    Name        = "${var.project_name}-${var.environment}-data-${length(var.availability_zone_ids) > 0 ? var.availability_zone_ids[count.index] : var.availability_zones[count.index]}"
    Tier        = "Private-Data"
    Environment = var.environment
  }
}

# NAT Gateways & Elastic IPs
locals {
  nat_count = var.enable_nat_gateway_per_az ? length(var.availability_zones) : 1
}

resource "aws_eip" "nat" {
  count  = local.nat_count
  domain = "vpc"

  tags = {
    Name        = "${var.project_name}-${var.environment}-nat-eip-${count.index}"
    Environment = var.environment
  }
}

resource "aws_nat_gateway" "nat" {
  count         = local.nat_count
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "${var.project_name}-${var.environment}-nat-${count.index}"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.gw]
}

# Public Route Table -> Internet Gateway
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.gw.id
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-public-rt"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private App Route Tables -> NAT Gateway
resource "aws_route_table" "private_app" {
  count  = length(var.private_app_subnet_cidrs)
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = var.enable_nat_gateway_per_az ? aws_nat_gateway.nat[count.index].id : aws_nat_gateway.nat[0].id
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-app-rt-${var.availability_zones[count.index]}"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "private_app" {
  count          = length(aws_subnet.private_app)
  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = aws_route_table.private_app[count.index].id
}

# Private Data Route Table (Isolated, No Internet Routing)
resource "aws_route_table" "private_data" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "${var.project_name}-${var.environment}-data-rt"
    Environment = var.environment
  }
}

resource "aws_route_table_association" "private_data" {
  count          = length(aws_subnet.private_data)
  subnet_id      = aws_subnet.private_data[count.index].id
  route_table_id = aws_route_table.private_data.id
}

data "aws_region" "current" {}

# S3 Gateway Endpoint (Cost Optimization: Free S3 traffic directly inside VPC)
resource "aws_vpc_endpoint" "s3" {
  vpc_id            = aws_vpc.main.id
  service_name      = "com.amazonaws.${data.aws_region.current.name}.s3"
  vpc_endpoint_type = "Gateway"

  route_table_ids = concat(
    [aws_route_table.public.id, aws_route_table.private_data.id],
    aws_route_table.private_app[*].id
  )

  tags = {
    Name        = "${var.project_name}-${var.environment}-s3-gw-endpoint"
    Environment = var.environment
  }
}
