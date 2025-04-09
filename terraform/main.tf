// Configuring Terraform providers
terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 4.0"
    }
  }

  # Optional: Uncomment to use Terraform Cloud for state management
  # backend "remote" {
  #   organization = "your-organization"
  #   workspaces {
  #     name = "anko-story-board-app"
  #   }
  # }
}

# Configure the Google Provider
provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

# Create a Google Cloud project (if not using an existing one)
resource "google_project" "anko_story_board" {
  name            = var.project_name
  project_id      = var.project_id
  billing_account = var.billing_account
  # Optional: organization_id = var.organization_id
}

# Enable required Google Cloud APIs
resource "google_project_service" "firebase" {
  project = google_project.anko_story_board.project_id
  service = "firebase.googleapis.com"

  disable_dependent_services = true
  disable_on_destroy         = false
}

resource "google_project_service" "firestore" {
  project = google_project.anko_story_board.project_id
  service = "firestore.googleapis.com"

  disable_dependent_services = true
  disable_on_destroy         = false

  depends_on = [google_project_service.firebase]
}

resource "google_project_service" "identitytoolkit" {
  project = google_project.anko_story_board.project_id
  service = "identitytoolkit.googleapis.com" # Required for Firebase Authentication

  disable_dependent_services = true
  disable_on_destroy         = false

  depends_on = [google_project_service.firebase]
}

# Initialize Firebase for the project
resource "google_firebase_project" "default" {
  provider = google-beta
  project  = google_project.anko_story_board.project_id

  depends_on = [google_project_service.firebase]
}

# Create a Firestore database
resource "google_firestore_database" "database" {
  provider    = google-beta
  project     = google_project.anko_story_board.project_id
  name        = "(default)"
  location_id = var.firestore_location
  type        = "FIRESTORE_NATIVE"

  depends_on = [google_project_service.firestore]
}

# Create Firebase Web App
resource "google_firebase_web_app" "anko_story_board_app" {
  provider     = google-beta
  project      = google_project.anko_story_board.project_id
  display_name = "Anko Story Board App"

  depends_on = [google_firebase_project.default]
}

# Output Firebase configuration for the web app
output "firebase_web_app_config" {
  value     = google_firebase_web_app.anko_story_board_app.config
  sensitive = true
}
