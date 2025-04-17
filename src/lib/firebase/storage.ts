import { storage } from "./firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { v4 as uuidv4 } from "uuid";

interface UploadResult {
  url: string;
  path: string;
}

interface UploadOptions {
  tenantId?: string;
  projectId?: string;
  contentType?: string;
}

/**
 * Uploads an image to Firebase Storage
 * @param file - The file to upload
 * @param options - Upload options including tenant/project IDs and path
 * @returns Promise with the download URL and storage path
 */
export const uploadImage = async (
  file: File,
  options?: UploadOptions & { path?: string }
): Promise<UploadResult> => {
  if (!file) {
    throw new Error("No file provided");
  }

  // Generate a unique file name to avoid collisions
  const fileExtension = file.name.split(".").pop();
  const fileName = `${uuidv4()}.${fileExtension}`;

  // Build the storage path with tenant and project info if available
  let basePath = options?.path || "images";
  if (options?.tenantId) {
    basePath = `tenants/${options.tenantId}/${basePath}`;

    if (options?.projectId) {
      basePath = `tenants/${options.tenantId}/projects/${options.projectId}/${basePath}`;
    }
  }

  const fullPath = `${basePath}/${fileName}`;

  // Create a storage reference
  const storageRef = ref(storage, fullPath);

  // Upload the file
  await uploadBytes(storageRef, file, {
    contentType: options?.contentType,
  });

  // Get the download URL
  const url = await getDownloadURL(storageRef);

  return {
    url,
    path: fullPath,
  };
};

/**
 * Uploads a base64 encoded image to Firebase Storage
 * @param base64Data - The base64 encoded data
 * @param options - Upload options including tenant/project IDs and path
 * @returns Promise with the download URL and storage path
 */
export const uploadBase64Image = async (
  base64Data: string,
  options?: UploadOptions & { path?: string }
): Promise<UploadResult> => {
  // Extract base64 data
  const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid base64 data");
  }

  const contentType = matches[1];
  const base64 = matches[2];
  const byteCharacters = atob(base64);
  const byteArrays = [];

  for (let i = 0; i < byteCharacters.length; i += 512) {
    const slice = byteCharacters.slice(i, i + 512);
    const byteNumbers = new Array(slice.length);
    for (let j = 0; j < slice.length; j++) {
      byteNumbers[j] = slice.charCodeAt(j);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: contentType });
  const fileExtension = contentType.split("/")[1];
  const fileName = `${uuidv4()}.${fileExtension}`;

  // Build the storage path with tenant and project info if available
  let basePath = options?.path || "images";
  if (options?.tenantId) {
    basePath = `tenants/${options.tenantId}/${basePath}`;

    if (options?.projectId) {
      basePath = `tenants/${options.tenantId}/projects/${options.projectId}/${basePath}`;
    }
  }

  const fullPath = `${basePath}/${fileName}`;

  // Create a storage reference
  const storageRef = ref(storage, fullPath);

  // Upload the blob
  await uploadBytes(storageRef, blob, { contentType });

  // Get the download URL
  const url = await getDownloadURL(storageRef);

  return {
    url,
    path: fullPath,
  };
};
