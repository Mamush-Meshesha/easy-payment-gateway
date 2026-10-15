# ==============================================================================
# Private Encrypted S3 Storage Buckets (KYC, Disputes, Statements, Reports)
# ==============================================================================

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

# KMS Key for Banking Document Storage
resource "aws_kms_key" "storage" {
  description             = "KMS Key for Payment Gateway document storage (KYC, Disputes, Statements)"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name        = "${var.project_name}-${var.environment}-s3-key"
    Environment = var.environment
  }
}

resource "aws_kms_alias" "storage" {
  name          = "alias/${var.project_name}-${var.environment}-s3-key"
  target_key_id = aws_kms_key.storage.key_id
}

locals {
  storage_buckets = {
    kyc_docs = {
      name        = "${var.project_name}-${var.environment}-kyc-docs-${random_string.suffix.result}"
      description = "Merchant KYC identification documents and business licenses"
    }
    dispute_evidence = {
      name        = "${var.project_name}-${var.environment}-dispute-evidence-${random_string.suffix.result}"
      description = "Customer chargeback proof and transaction receipts"
    }
    settlement_statements = {
      name        = "${var.project_name}-${var.environment}-settlement-statements-${random_string.suffix.result}"
      description = "Bank settlement reconciliation feeds from Telebirr CBE and M-Pesa"
    }
    audit_reports = {
      name        = "${var.project_name}-${var.environment}-audit-reports-${random_string.suffix.result}"
      description = "Exported accounting ledgers tax declarations and financial reports"
    }
  }
}

resource "aws_s3_bucket" "buckets" {
  for_each = local.storage_buckets

  bucket        = each.value.name
  force_destroy = false

  tags = {
    Name        = each.value.name
    Description = each.value.description
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "versioning" {
  for_each = aws_s3_bucket.buckets

  bucket = each.value.id
  versioning_configuration {
    status = var.enable_versioning ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "encryption" {
  for_each = aws_s3_bucket.buckets

  bucket = each.value.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.storage.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "public_access" {
  for_each = aws_s3_bucket.buckets

  bucket = each.value.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enforce HTTPS/TLS 1.2+ across all storage buckets
resource "aws_s3_bucket_policy" "enforce_tls" {
  for_each = aws_s3_bucket.buckets

  bucket = each.value.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          each.value.arn,
          "${each.value.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      }
    ]
  })
}
