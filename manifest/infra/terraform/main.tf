provider "aws" {
  region = "ap-northeast-2"
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# ACM 인증서 (CloudFront는 반드시 us-east-1)
resource "aws_acm_certificate" "matzip" {
  provider          = aws.us_east_1
  domain_name       = "matzip.yjmatzip.com"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

# 1. 기존 S3 버킷 정보 (이미 생성한 버킷 이름과 일치시켜주세요)
resource "aws_s3_bucket" "frontend_bucket" {
  bucket = "matzip-frontend"
}

# 2. CloudFront Origin Access Control (OAC) 생성
resource "aws_cloudfront_origin_access_control" "main" {
  name                              = "s3-oac"
  description                       = "OAC for matzip-frontend"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# 3. CloudFront Distribution 생성
resource "aws_cloudfront_distribution" "s3_distribution" {
  # S3 오리진 (프론트엔드)
  origin {
    domain_name              = aws_s3_bucket.frontend_bucket.bucket_regional_domain_name
    origin_id                = "S3-Origin"
    origin_access_control_id = aws_cloudfront_origin_access_control.main.id
  }

  # 백엔드 오리진 (Cloudflare Tunnel)
  origin {
    domain_name = "api-origin.yjmatzip.com"
    origin_id   = "Backend-Origin"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  aliases             = ["matzip.yjmatzip.com"]

  # SPA(Vite)를 위한 에러 응답 설정
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
  }

  # /api/* → 백엔드
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "Backend-Origin"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type", "Origin"]
      cookies {
        forward = "all"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
  }

  # /* → S3 프론트엔드
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-Origin"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.matzip.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}

# 4. S3 버킷 정책 업데이트 (CloudFront OAC만 허용)
resource "aws_s3_bucket_policy" "allow_access_from_cloudfront" {
  bucket = aws_s3_bucket.frontend_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontServicePrincipalReadOnly"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.frontend_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.s3_distribution.arn
          }
        }
      }
    ]
  })
}

output "cloudfront_domain_name" {
  value = aws_cloudfront_distribution.s3_distribution.domain_name
}

output "acm_certificate_validation_records" {
  value = aws_acm_certificate.matzip.domain_validation_options
  description = "Cloudflare DNS에 추가해야 할 CNAME 레코드 (인증서 검증용)"
}
