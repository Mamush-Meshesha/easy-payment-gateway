output "state_bucket_name" {
  description = "Name of the created S3 bucket for Terraform remote state"
  value       = aws_s3_bucket.state.id
}

output "state_bucket_arn" {
  description = "ARN of the created S3 bucket"
  value       = aws_s3_bucket.state.arn
}

output "kms_key_arn" {
  description = "ARN of the customer managed KMS key encrypting the state bucket"
  value       = aws_kms_key.terraform_state.arn
}

output "dynamodb_lock_table_name" {
  description = "Name of the DynamoDB table for state locking (Terraform < 1.10 compatibility)"
  value       = aws_dynamodb_table.locks.id
}

output "aws_region" {
  description = "Region where state backend is provisioned"
  value       = var.aws_region
}
