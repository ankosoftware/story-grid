# Firestore Security Rules
resource "google_firestore_document" "firestore_rules" {
  project     = google_project.anko_story_board.project_id
  collection  = "_firestore_rules"
  document_id = "cloud_firestore_rules"
  fields = jsonencode({
    rules = {
      stringValue = <<EOT
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Multi-tenant security rules
    match /tenants/{tenantId} {
      // Base tenant data can be read by any authenticated user in that tenant
      allow read: if request.auth != null && 
                   (request.auth.token.tenantId == tenantId || 
                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true);
      
      // Only tenant admins can write to tenant data
      allow write: if request.auth != null && 
                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true;
      
      // Projects collection under a tenant
      match /projects/{projectId} {
        // Anyone in the tenant can read projects
        allow read: if request.auth != null && 
                     (request.auth.token.tenantId == tenantId ||
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true);
        
        // Project managers and admins can write to projects
        allow write: if request.auth != null && 
                      (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "manager" || 
                       get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true);
        
        // Stories and epics under projects
        match /epics/{epicId} {
          allow read: if request.auth != null && 
                       (request.auth.token.tenantId == tenantId ||
                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true);
          
          // Contributors, managers, and admins can write to epics
          allow write: if request.auth != null && 
                        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "contributor" ||
                         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "manager" ||
                         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true);
        }
        
        match /stories/{storyId} {
          allow read: if request.auth != null && 
                       (request.auth.token.tenantId == tenantId ||
                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true);
          
          // Contributors, managers, and admins can write to stories
          allow write: if request.auth != null && 
                        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "contributor" ||
                         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "manager" ||
                         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true);
        }
        
        match /releases/{releaseId} {
          allow read: if request.auth != null && 
                       (request.auth.token.tenantId == tenantId ||
                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true);
          
          // Only managers and admins can write to releases
          allow write: if request.auth != null && 
                        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "manager" ||
                         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true);
        }
      }
    }
    
    // Users collection
    match /users/{userId} {
      // Users can read/write their own data
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Admins can read all user data
      allow read: if request.auth != null && 
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true;
      
      // Only admins can create/update/delete other users
      allow create, update, delete: if request.auth != null && 
                                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true;
    }
  }
}
EOT
    }
  })

  depends_on = [google_firestore_database.database]
}

# Firestore Indexes (example)
# Note: For complex apps, you may want to maintain this in a separate file
resource "google_firestore_index" "stories_by_project_priority" {
  project    = google_project.anko_story_board.project_id
  collection = "stories"

  fields {
    field_path = "projectId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "priority"
    order      = "DESCENDING"
  }

  fields {
    field_path = "__name__"
    order      = "ASCENDING"
  }

  depends_on = [google_firestore_database.database]
}

resource "google_firestore_index" "epics_by_tenant_order" {
  project    = google_project.anko_story_board.project_id
  collection = "epics"

  fields {
    field_path = "tenantId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "displayOrder"
    order      = "ASCENDING"
  }

  depends_on = [google_firestore_database.database]
} 
