# -------------------------------------------------------------
# Managed PostgreSQL (AWS RDS Multi-AZ)
# -------------------------------------------------------------
resource "aws_db_subnet_group" "default" {
  name       = "payment-gateway-db-subnet"
  subnet_ids = aws_subnet.private[*].id
  tags = {
    Name = "Payment DB subnet group"
  }
}

resource "aws_db_instance" "payment_postgres" {
  identifier           = "payment-gateway-prod"
  engine               = "postgres"
  engine_version       = "15.3"
  instance_class       = "db.r6g.xlarge" # Memory optimized for financial workload
  allocated_storage    = 100             # Start with 100GB
  max_allocated_storage = 1000           # Autoscaling up to 1TB

  db_name              = "payment_gateway"
  username             = var.db_username
  password             = var.db_password
  
  db_subnet_group_name   = aws_db_subnet_group.default.name
  vpc_security_group_ids = [aws_security_group.db_sg.id]

  # Production Durability Settings
  multi_az               = true
  storage_type           = "gp3"
  storage_encrypted      = true
  kms_key_id             = aws_kms_key.db_encryption.arn

  backup_retention_period = 30 # 30 days retention for financial audit
  backup_window           = "03:00-04:00"
  maintenance_window      = "Sun:04:00-Sun:05:00"

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  
  deletion_protection = true # PREVENT ACCIDENTAL DELETION
}

# KMS Key for DB Encryption
resource "aws_kms_key" "db_encryption" {
  description             = "KMS key for Payment Gateway Database"
  deletion_window_in_days = 30
  enable_key_rotation     = true
}

resource "aws_security_group" "db_sg" {
  name        = "payment_db_sg"
  description = "Allow inbound traffic to PostgreSQL from private subnets"
  vpc_id      = aws_vpc.payment_gateway.id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = aws_subnet.private[*].cidr_block
  }
}
