output "frontend_bucket_name" {
  description = "Name of the S3 bucket storing frontend static SPA builds"
  value       = aws_s3_bucket.frontend.id
}

output "frontend_bucket_arn" {
  description = "ARN of the frontend S3 bucket"
  value       = aws_s3_bucket.frontend.arn
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.spa.id
}

output "cloudfront_domain_name" {
  description = "Public domain name of the CloudFront distribution (e.g. d111111abcdef8.cloudfront.net)"
  value       = aws_cloudfront_distribution.spa.domain_name
}
