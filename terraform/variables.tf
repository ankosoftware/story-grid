variable "project_id" {
  description = "The ID of the Google Cloud project"
  type        = string
  # Default value should be customized
  default = "anko-story-board-app"
}

variable "project_name" {
  description = "The name of the Google Cloud project"
  type        = string
  default     = "Anko Story Board App"
}

variable "region" {
  description = "The default GCP region for resource deployment"
  type        = string
  default     = "us-central1"
}

variable "firestore_location" {
  description = "The location for the Firestore database"
  type        = string
  default     = "us-central"
}

variable "storage_location" {
  description = "The location for Google Cloud Storage buckets"
  type        = string
  default     = "US" # Use multi-region for better availability
}

variable "environment" {
  description = "The deployment environment (e.g., development, staging, production)"
  type        = string
  default     = "development"
}

variable "create_user_uploads_bucket" {
  description = "Whether to create a separate bucket for user uploads"
  type        = bool
  default     = true
}

variable "billing_account" {
  description = "The ID of the billing account to associate with the project"
  type        = string
  # This needs to be configured according to your GCP billing account
  default = ""
}

variable "organization_id" {
  description = "The ID of the organization (optional)"
  type        = string
  default     = ""
}

variable "service_account_email" {
  description = "The email address of the service account that needs Firebase Admin access"
  type        = string
  default     = ""
}
