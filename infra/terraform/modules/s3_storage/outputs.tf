output "storage_kms_key_arn" {
  description = "ARN of the KMS key used for document storage encryption"
  value       = aws_kms_key.storage.arn
}

output "kyc_bucket_name" {
  description = "Name of the KYC documents S3 bucket"
  value       = aws_s3_bucket.buckets["kyc_docs"].id
}

output "kyc_bucket_arn" {
  description = "ARN of the KYC documents S3 bucket"
  value       = aws_s3_bucket.buckets["kyc_docs"].arn
}

output "dispute_bucket_name" {
  description = "Name of the dispute evidence S3 bucket"
  value       = aws_s3_bucket.buckets["dispute_evidence"].id
}

output "dispute_bucket_arn" {
  description = "ARN of the dispute evidence S3 bucket"
  value       = aws_s3_bucket.buckets["dispute_evidence"].arn
}

output "settlement_bucket_name" {
  description = "Name of the bank settlement statements S3 bucket"
  value       = aws_s3_bucket.buckets["settlement_statements"].id
}

output "settlement_bucket_arn" {
  description = "ARN of the bank settlement statements S3 bucket"
  value       = aws_s3_bucket.buckets["settlement_statements"].arn
}

output "reports_bucket_name" {
  description = "Name of the audit and accounting reports S3 bucket"
  value       = aws_s3_bucket.buckets["audit_reports"].id
}

output "reports_bucket_arn" {
  description = "ARN of the audit and accounting reports S3 bucket"
  value       = aws_s3_bucket.buckets["audit_reports"].arn
}
