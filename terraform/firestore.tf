# Firestore Security Rules
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
      // Allow creation of new tenants by any authenticated user
      allow create: if request.auth != null;
      
      // Allow read by members of the tenant or admins
      allow read: if request.auth != null && 
                  (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tenants[tenantId].role in ["admin", "manager", "contributor"] ||
                   get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true);
      
      // Allow updates by tenant admins or global admins
      allow update: if request.auth != null && 
                    (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.tenants[tenantId].role == "admin" ||
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true);
      
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
        
        // Issue Type Epics under projects
        match /issueTypeEpics/{epicId} {
          allow read: if request.auth != null && 
                       (request.auth.token.tenantId == tenantId ||
                        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true);
          
          // Contributors, managers, and admins can write to issue type epics
          allow write: if request.auth != null && 
                        (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "contributor" ||
                         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "manager" ||
                         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.admin == true);
                         
          // Stories under issue type epics
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

resource "google_firestore_index" "issueTypeEpics_by_tenant_order" {
  project    = google_project.anko_story_board.project_id
  collection = "issueTypeEpics"

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

resource "google_firestore_index" "issueTypeEpics_by_project_order" {
  project    = google_project.anko_story_board.project_id
  collection = "issueTypeEpics"

  fields {
    field_path = "projectId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "displayOrder"
    order      = "ASCENDING"
  }

  fields {
    field_path = "__name__"
    order      = "ASCENDING"
  }

  depends_on = [google_firestore_database.database]
}
