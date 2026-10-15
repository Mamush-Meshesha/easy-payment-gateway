# ==============================================================================
# AWS ECS Fargate Microservice Fleet & AWS Cloud Map Service Discovery
# ==============================================================================

locals {
  services = {
    # --------------------------------------------------------------------------
    # Tier 1: Public APIs (Port mapped to ALB)
    # --------------------------------------------------------------------------
    "auth-service" = {
      tier         = "tier1_public"
      port         = 3001
      grpc_port    = 50051
      path_pattern = ["/api/v1/auth*"]
      priority     = 10
      health_path  = "/health"
      is_public    = true
    }
    "payment-service" = {
      tier         = "tier1_public"
      port         = 8084
      grpc_port    = 50051
      path_pattern = ["/api/v1/payments*", "/api/v1/checkout*"]
      priority     = 20
      health_path  = "/health"
      is_public    = true
    }
    "merchant-service" = {
      tier         = "tier1_public"
      port         = 3002
      grpc_port    = 50052
      path_pattern = ["/api/v1/merchants*"]
      priority     = 30
      health_path  = "/health"
      is_public    = true
    }
    "billing-service" = {
      tier         = "tier1_public"
      port         = 3016
      grpc_port    = 0
      path_pattern = ["/api/v1/billing*"]
      priority     = 40
      health_path  = "/health"
      is_public    = true
    }

    # --------------------------------------------------------------------------
    # Tier 2: Authenticated Portals & BFFs (Port mapped to ALB)
    # --------------------------------------------------------------------------
    "admin-service" = {
      tier         = "tier2_admin"
      port         = 3003
      grpc_port    = 0
      path_pattern = ["/api/v1/admin*"]
      priority     = 50
      health_path  = "/health"
      is_public    = true
    }
    "dashboard-service" = {
      tier         = "tier2_admin"
      port         = 3009
      grpc_port    = 0
      path_pattern = ["/api/v1/dashboard*"]
      priority     = 60
      health_path  = "/health"
      is_public    = true
    }
    "reporting-service" = {
      tier         = "tier2_admin"
      port         = 3008
      grpc_port    = 0
      path_pattern = ["/api/v1/reporting*"]
      priority     = 70
      health_path  = "/health"
      is_public    = true
    }
    "dispute-service" = {
      tier         = "tier2_admin"
      port         = 3017
      grpc_port    = 0
      path_pattern = ["/api/v1/disputes*"]
      priority     = 80
      health_path  = "/health"
      is_public    = true
    }

    # --------------------------------------------------------------------------
    # Tier 3: Core Private Banking Services (Internal gRPC over mTLS / Cloud Map DNS)
    # --------------------------------------------------------------------------
    "ledger-service" = {
      tier         = "tier3_private"
      port         = 0
      grpc_port    = 50053
      path_pattern = []
      priority     = 0
      health_path  = ""
      is_public    = false
    }
    "risk-service" = {
      tier         = "tier3_private"
      port         = 8086
      grpc_port    = 50054
      path_pattern = []
      priority     = 0
      health_path  = ""
      is_public    = false
    }
    "provider-service" = {
      tier         = "tier3_private"
      port         = 8087
      grpc_port    = 50055
      path_pattern = []
      priority     = 0
      health_path  = ""
      is_public    = false
    }
    "settlement-service" = {
      tier         = "tier3_private"
      port         = 3010
      grpc_port    = 50057
      path_pattern = []
      priority     = 0
      health_path  = ""
      is_public    = false
    }
    "reconciliation-service" = {
      tier         = "tier3_private"
      port         = 3011
      grpc_port    = 0
      path_pattern = ["/api/v1/reconciliation*"]
      priority     = 90
      health_path  = "/health"
      is_public    = true
    }
    "notification-service" = {
      tier         = "tier3_private"
      port         = 3007
      grpc_port    = 50058
      path_pattern = []
      priority     = 0
      health_path  = ""
      is_public    = false
    }

    # --------------------------------------------------------------------------
    # Tier 4: Asynchronous Workers & Webhooks
    # --------------------------------------------------------------------------
    "transaction-service" = {
      tier         = "tier4_workers"
      port         = 0
      grpc_port    = 0
      path_pattern = []
      priority     = 0
      health_path  = ""
      is_public    = false
    }
    "webhook-service" = {
      tier         = "webhook"
      port         = 0
      grpc_port    = 50056
      path_pattern = []
      priority     = 0
      health_path  = ""
      is_public    = false
    }
  }

  public_services = { for k, v in local.services : k => v if v.is_public }
}

# ==============================================================================
# 1. ECS Cluster
# ==============================================================================

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${var.environment}-cluster"

  setting {
    name  = "containerInsights"
    value = "disabled" # Lean staging profile
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-cluster"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ==============================================================================
# 2. AWS Cloud Map Private DNS Service Discovery (payment-gateway.internal)
# ==============================================================================

resource "aws_service_discovery_private_dns_namespace" "main" {
  name        = "payment-gateway.internal"
  description = "Private DNS namespace for Payment Gateway microservice gRPC mesh"
  vpc         = var.vpc_id

  tags = {
    Name        = "${var.project_name}-${var.environment}-cloudmap"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_service_discovery_service" "services" {
  for_each = local.services

  name = each.key

  dns_config {
    namespace_id = aws_service_discovery_private_dns_namespace.main.id

    dns_records {
      ttl  = 10
      type = "A"
    }

    routing_policy = "MULTIVALUE"
  }

  health_check_custom_config {
    failure_threshold = 1
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-${each.key}-discovery"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ==============================================================================
# 3. ECS IAM Roles (Task Execution & Application Task Roles)
# ==============================================================================

# A. Task Execution Role (Pull from ECR, publish logs, pull secrets)
resource "aws_iam_role" "ecs_execution" {
  name = "${var.project_name}-${var.environment}-ecs-execution-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-ecs-execution-role"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_iam_role_policy_attachment" "ecs_execution_base" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_execution_secrets" {
  name = "${var.project_name}-${var.environment}-ecs-secrets-policy"
  role = aws_iam_role.ecs_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          var.database_credentials_secret_arn,
          "${var.database_credentials_secret_arn}*",
          var.redis_auth_secret_arn,
          "${var.redis_auth_secret_arn}*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = length(var.kms_key_arns) > 0 ? var.kms_key_arns : ["*"]
      }
    ]
  })
}

# B. Task Application Role (Access S3 buckets & KMS)
resource "aws_iam_role" "ecs_task" {
  name = "${var.project_name}-${var.environment}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-${var.environment}-ecs-task-role"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_iam_role_policy" "ecs_task_s3" {
  count = length(var.s3_bucket_arns) > 0 ? 1 : 0
  name  = "${var.project_name}-${var.environment}-ecs-s3-policy"
  role  = aws_iam_role.ecs_task.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = concat(
          var.s3_bucket_arns,
          [for arn in var.s3_bucket_arns : "${arn}/*"]
        )
      },
      {
        Effect = "Allow"
        Action = [
          "kms:GenerateDataKey",
          "kms:Decrypt"
        ]
        Resource = length(var.kms_key_arns) > 0 ? var.kms_key_arns : ["*"]
      }
    ]
  })
}

# ==============================================================================
# 4. CloudWatch Log Groups
# ==============================================================================

resource "aws_cloudwatch_log_group" "services" {
  for_each = local.services

  name              = "/ecs/${var.project_name}-${var.environment}/${each.key}"
  retention_in_days = var.log_retention_in_days

  tags = {
    Name        = "${var.project_name}-${var.environment}-${each.key}-logs"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# ==============================================================================
# 5. Application Load Balancer Target Groups & Routing Rules
# ==============================================================================

resource "aws_lb_target_group" "services" {
  for_each = local.public_services

  name        = "pg-stg-${substr(each.key, 0, 25)}"
  port        = each.value.port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type          = "ip"
  deregistration_delay = 15

  health_check {
    enabled             = true
    path                = each.value.health_path != "" ? each.value.health_path : "/"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = {
    Name        = "${var.project_name}-${var.environment}-${each.key}-tg"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_lb_listener_rule" "services" {
  for_each = local.public_services

  listener_arn = var.alb_listener_arn
  priority     = each.value.priority

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.services[each.key].arn
  }

  condition {
    path_pattern {
      values = each.value.path_pattern
    }
  }
}

# ==============================================================================
# 6. ECS Task Definitions & Services
# ==============================================================================

resource "aws_ecs_task_definition" "services" {
  for_each = local.services

  family                   = "${var.project_name}-${var.environment}-${each.key}"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = tostring(var.default_cpu)
  memory                   = tostring(var.default_memory)
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    merge(
      {
        name      = each.key
        image     = "${lookup(var.ecr_repository_urls, each.key, "")}:latest"
        essential = true

      portMappings = concat(
        each.value.port > 0 ? [
          {
            containerPort = each.value.port
            hostPort      = each.value.port
            protocol      = "tcp"
          }
        ] : [],
        each.value.grpc_port > 0 ? [
          {
            containerPort = each.value.grpc_port
            hostPort      = each.value.grpc_port
            protocol      = "tcp"
          }
        ] : []
      )

      environment = [
        { name = "ENVIRONMENT", value = var.environment },
        { name = "PORT", value = tostring(each.value.port) },
        { name = "GRPC_PORT", value = tostring(each.value.grpc_port) },
        { name = "DB_HOST", value = var.database_address },
        { name = "DB_PORT", value = tostring(var.database_port) },
        { name = "DB_NAME", value = var.database_name },
        { name = "REDIS_HOST", value = var.redis_endpoint },
        { name = "REDIS_PORT", value = tostring(var.redis_port) },
        { name = "NODE_PATH", value = "/app/node_modules:/app/services/${each.key}/node_modules" },
        { name = "JWT_SECRET", value = "staging_jwt_secret_payment_gateway_2026" },
        { name = "LEDGER_SERVICE_ADDR", value = "ledger-service.payment-gateway.internal:50053" },
        { name = "MERCHANT_SERVICE_ADDR", value = "merchant-service.payment-gateway.internal:50052" },
        { name = "RISK_SERVICE_ADDR", value = "risk-service.payment-gateway.internal:50054" },
        { name = "PROVIDER_SERVICE_ADDR", value = "provider-service.payment-gateway.internal:50055" },
        { name = "AUTH_SERVICE_HOST", value = "auth-service.payment-gateway.internal" },
        { name = "AUTH_GRPC_PORT", value = "50051" },
        { name = "PAYMENT_SERVICE_ADDR", value = "payment-service.payment-gateway.internal:50051" },
        { name = "SETTLEMENT_SERVICE_ADDR", value = "settlement-service.payment-gateway.internal:50057" },
        { name = "NOTIFICATION_SERVICE_ADDR", value = "notification-service.payment-gateway.internal:50058" },
        { name = "WEBHOOK_SERVICE_ADDR", value = "webhook-service.payment-gateway.internal:50056" }
      ]

      secrets = [
        {
          name      = "DATABASE_CREDENTIALS"
          valueFrom = var.database_credentials_secret_arn
        },
        {
          name      = "DATABASE_URL"
          valueFrom = "${var.database_credentials_secret_arn}:database_url::"
        },
        {
          name      = "REDIS_AUTH"
          valueFrom = var.redis_auth_secret_arn
        },
        {
          name      = "REDIS_URL"
          valueFrom = "${var.redis_auth_secret_arn}:redis_url::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.services[each.key].name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    },
    each.key == "auth-service" ? { command = ["node", "dist/app.js"] } : {}
  )])

  tags = {
    Name        = "${var.project_name}-${var.environment}-${each.key}-taskdef"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_ecs_service" "services" {
  for_each = local.services

  name            = each.key
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.services[each.key].arn
  desired_count                      = var.service_desired_count
  launch_type                        = "FARGATE"
  deployment_minimum_healthy_percent = 0
  deployment_maximum_percent         = 100
  health_check_grace_period_seconds  = contains(keys(local.public_services), each.key) ? 60 : 0

  network_configuration {
    subnets          = var.private_app_subnet_ids
    security_groups  = [lookup(var.security_group_ids, each.value.tier, "")]
    assign_public_ip = false
  }

  service_registries {
    registry_arn = aws_service_discovery_service.services[each.key].arn
  }

  dynamic "load_balancer" {
    for_each = contains(keys(local.public_services), each.key) ? [1] : []
    content {
      target_group_arn = aws_lb_target_group.services[each.key].arn
      container_name   = each.key
      container_port   = each.value.port
    }
  }

  depends_on = [
    aws_lb_listener_rule.services
  ]

  tags = {
    Name        = "${var.project_name}-${var.environment}-${each.key}-service"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
