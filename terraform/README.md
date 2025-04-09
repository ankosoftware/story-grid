# Terraform Configuration for Anko Story Board App

This directory contains Terraform configuration files to provision and manage the Google Cloud resources required for the Anko Story Board application, including Firebase and Firestore.

## Prerequisites

1. [Terraform](https://www.terraform.io/downloads.html) (v1.0.0 or newer)
2. [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
3. A Google Cloud account with billing enabled
4. Appropriate permissions to create and manage Google Cloud resources

## Configuration Files

- `main.tf` - Core configuration for Google Cloud Project and Firebase
- `variables.tf` - Variable definitions used across all configuration files
- `firebase_auth.tf` - Firebase Authentication configuration
- `firestore.tf` - Firestore database, security rules, and indexes
- `storage.tf` - Google Cloud Storage buckets for Firebase Storage

## Setup Instructions

### 1. Authentication

First, authenticate with Google Cloud:

```bash
gcloud auth application-default login
```

### 2. Configure Variables

Copy the example terraform.tfvars file and update it with your own values:

```bash
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars` to set:

- Your GCP billing account ID
- Project ID (if you want to use a specific one)
- Other environment-specific variables

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Plan Deployment

```bash
terraform plan
```

Review the plan to ensure it matches your expectations.

### 5. Apply Changes

```bash
terraform apply
```

Type "yes" when prompted to confirm deployment.

### 6. Update Application Configuration

After successful deployment, Terraform will output Firebase configuration details. Update your application's `.env.local` file with these values.

## Important Notes

1. **Billing Account**: You must provide a valid billing account ID in your `terraform.tfvars` file or the deployment will fail.

2. **Security Rules**: The Firestore security rules included here provide a starting point based on the multi-tenant architecture. Review and adjust them according to your specific security requirements.

3. **Production Deployments**: For production environments:

   - Set `environment = "production"` in your terraform.tfvars
   - Review and tighten the CORS settings in the storage buckets
   - Consider using a remote backend for storing Terraform state

4. **Destroying Resources**: Be cautious when running `terraform destroy` as it will remove all created resources, including databases and storage buckets. For production environments, consider adding additional safeguards.

## Customization

- To modify Firestore security rules, edit the rules string in `firestore.tf`
- To add more indexes, add additional `google_firestore_index` resources in `firestore.tf`
- To configure additional Firebase features, add the corresponding resources to the appropriate configuration files
