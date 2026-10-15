# -------------------------------------------------------------
# Managed Kafka (AWS MSK)
# -------------------------------------------------------------
resource "aws_msk_cluster" "payment_kafka" {
  cluster_name           = "payment-gateway-kafka"
  kafka_version          = "3.5.1"
  number_of_broker_nodes = 3

  broker_node_group_info {
    instance_type   = "kafka.m5.large"
    ebs_volume_size = 1000 # 1TB per broker for 7-day retention
    client_subnets  = aws_subnet.private[*].id
    security_groups = [aws_security_group.kafka_sg.id]
  }

  encryption_info {
    encryption_at_rest_kms_key_arn = aws_kms_key.kafka_encryption.arn
    encryption_in_transit {
      client_broker = "TLS"
      in_cluster    = true
    }
  }

  # Production logging for Auditing
  logging_info {
    broker_logs {
      cloudwatch_logs {
        enabled   = true
        log_group = aws_cloudwatch_log_group.kafka_logs.name
      }
    }
  }
}

resource "aws_cloudwatch_log_group" "kafka_logs" {
  name              = "/aws/msk/payment-gateway-kafka"
  retention_in_days = 90
}

resource "aws_kms_key" "kafka_encryption" {
  description             = "KMS key for Kafka Encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_security_group" "kafka_sg" {
  name        = "payment_kafka_sg"
  description = "Allow inbound traffic to Kafka"
  vpc_id      = aws_vpc.payment_gateway.id

  ingress {
    from_port   = 9092
    to_port     = 9094
    protocol    = "tcp"
    cidr_blocks = aws_subnet.private[*].cidr_block
  }
}
