# Enable Firebase Authentication Service
resource "google_project_service" "auth" {
  project = google_project.anko_story_board.project_id
  service = "identitytoolkit.googleapis.com"

  disable_dependent_services = true
  disable_on_destroy         = false

  depends_on = [google_firebase_project.default]
}

# Configure Firebase Authentication providers
# Note: Currently, Terraform doesn't have a dedicated provider for detailed Firebase Auth configuration
# This configuration enables the services, and you'll need to configure the specific providers
# (Google, Email/Password, etc.) through the Firebase Console or Firebase Admin SDK

# Optional: Define IAM roles for Firebase Authentication
resource "google_project_iam_member" "firebase_auth_admin" {
  project = google_project.anko_story_board.project_id
  role    = "roles/firebase.admin"
  member  = "serviceAccount:${var.service_account_email}"

  depends_on = [google_project_service.auth]

  # This is a placeholder - you would set the service_account_email variable
  # with the email of your service account that needs Firebase Admin access
  count = var.service_account_email != "" ? 1 : 0
}
