# Enable Cloud Storage API
resource "google_project_service" "storage" {
  project = google_project.anko_story_board.project_id
  service = "storage.googleapis.com"

  disable_dependent_services = true
  disable_on_destroy         = false

  depends_on = [google_firebase_project.default]
}

# Create default Firebase Storage bucket
# This is the main bucket Firebase uses for file storage
resource "google_storage_bucket" "firebase_storage" {
  name          = "${var.project_id}-storage"
  location      = var.storage_location
  project       = google_project.anko_story_board.project_id
  force_destroy = var.environment != "production" # Be cautious with force_destroy in production

  # Enable versioning for data protection
  versioning {
    enabled = true
  }

  # Optional: Configure lifecycle rules for managing object versions
  lifecycle_rule {
    condition {
      age = 30 # days
    }
    action {
      type = "Delete" # Delete noncurrent versions after 30 days
    }
  }

  # Use uniform bucket-level access
  uniform_bucket_level_access = true

  depends_on = [google_project_service.storage]
}

# Create a separate bucket for user uploads (optional)
resource "google_storage_bucket" "user_uploads" {
  count         = var.create_user_uploads_bucket ? 1 : 0
  name          = "${var.project_id}-user-uploads"
  location      = var.storage_location
  project       = google_project.anko_story_board.project_id
  force_destroy = var.environment != "production"

  cors {
    origin          = ["*"] # You should restrict this in production
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }

  # Use uniform bucket-level access
  uniform_bucket_level_access = true

  depends_on = [google_project_service.storage]
}
