#!/bin/bash
# Deployment script for Anko Story Board App Terraform configuration

set -e  # Exit immediately if a command exits with a non-zero status

# Colors for better output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if terraform is installed
check_terraform() {
  if ! [ -x "$(command -v terraform)" ]; then
    echo -e "${RED}Error: terraform is not installed.${NC}" >&2
    echo "Please install Terraform from https://www.terraform.io/downloads.html"
    exit 1
  fi

  # Check terraform version
  TERRAFORM_VERSION=$(terraform version -json | jq -r '.terraform_version')
  echo -e "${GREEN}Terraform version: ${TERRAFORM_VERSION}${NC}"
}

# Function to check if gcloud is installed
check_gcloud() {
  if ! [ -x "$(command -v gcloud)" ]; then
    echo -e "${RED}Error: gcloud is not installed.${NC}" >&2
    echo "Please install Google Cloud SDK from https://cloud.google.com/sdk/docs/install"
    exit 1
  fi

  # Check if user is authenticated
  if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    echo -e "${YELLOW}You are not authenticated with gcloud. Please login:${NC}"
    gcloud auth login
    gcloud auth application-default login
  else
    echo -e "${GREEN}Already authenticated with gcloud as $(gcloud auth list --filter=status:ACTIVE --format="value(account)")${NC}"
  fi
}

# Function to check if terraform.tfvars exists
check_tfvars() {
  if [ ! -f "terraform.tfvars" ]; then
    echo -e "${YELLOW}terraform.tfvars file not found. Creating from example...${NC}"
    if [ -f "terraform.tfvars.example" ]; then
      cp terraform.tfvars.example terraform.tfvars
      echo -e "${RED}Please edit terraform.tfvars with your actual values before continuing.${NC}"
      echo -e "${RED}Especially update the billing_account value which is required.${NC}"
      exit 1
    else
      echo -e "${RED}Error: terraform.tfvars.example not found. Cannot create terraform.tfvars.${NC}"
      exit 1
    fi
  fi
}

# Initialize Terraform
initialize() {
  echo -e "${GREEN}Initializing Terraform...${NC}"
  terraform init
  echo -e "${GREEN}Terraform initialized successfully.${NC}"
}

# Plan Terraform changes
plan() {
  echo -e "${GREEN}Planning Terraform changes...${NC}"
  terraform plan -out=tfplan
  echo -e "${GREEN}Terraform plan completed. Review the plan above.${NC}"
}

# Apply Terraform changes
apply() {
  echo -e "${GREEN}Applying Terraform changes...${NC}"
  terraform apply tfplan
  echo -e "${GREEN}Terraform changes applied successfully.${NC}"
  
  # Output important information
  echo -e "\n${YELLOW}Firebase Web App Configuration:${NC}"
  terraform output -json firebase_web_app_config | jq .
}

# Destroy Terraform resources (with confirmation)
destroy() {
  echo -e "${RED}WARNING: This will destroy all resources created by Terraform.${NC}"
  echo -e "${RED}This action is not reversible and will delete ALL data.${NC}"
  read -p "Are you sure you want to continue? (yes/no): " confirmation
  
  if [ "$confirmation" = "yes" ]; then
    echo -e "${YELLOW}Destroying all Terraform-managed resources...${NC}"
    terraform destroy
    echo -e "${GREEN}All resources destroyed successfully.${NC}"
  else
    echo -e "${GREEN}Destroy operation cancelled.${NC}"
  fi
}

# Parse command line arguments
case "$1" in
  init)
    check_terraform
    check_gcloud
    initialize
    ;;
  plan)
    check_terraform
    check_gcloud
    check_tfvars
    initialize
    plan
    ;;
  apply)
    check_terraform
    check_gcloud
    check_tfvars
    
    # Check if plan exists
    if [ ! -f "tfplan" ]; then
      echo -e "${YELLOW}No tfplan file found. Running plan first...${NC}"
      plan
    fi
    
    apply
    ;;
  destroy)
    check_terraform
    check_gcloud
    check_tfvars
    initialize
    destroy
    ;;
  *)
    echo -e "${GREEN}Anko Story Board App Terraform Deployment Script${NC}"
    echo "Usage: $0 {init|plan|apply|destroy}"
    echo ""
    echo "  init     - Initialize Terraform"
    echo "  plan     - Create a Terraform plan"
    echo "  apply    - Apply the Terraform plan"
    echo "  destroy  - Destroy all resources created by Terraform"
    exit 1
    ;;
esac

exit 0 