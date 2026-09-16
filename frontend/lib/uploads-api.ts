import apiClient from "./api-client";

/**
 * Client-side in-browser image compression using HTML Canvas.
 * Dramatically reduces upload payload size and bandwidth before sending over network.
 */
export async function compressImageClient(
  file: File,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
    outputType?: "image/webp" | "image/jpeg";
  } = {},
): Promise<File> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    outputType = "image/webp",
  } = options;

  // Don't attempt to compress SVGs or non-images
  if (!file.type.startsWith("image/") || file.type.includes("svg")) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Check if downscaling is needed
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // Return original if compression did not reduce size
              resolve(file);
              return;
            }

            const extension = outputType === "image/webp" ? "webp" : "jpg";
            const originalBase = file.name.substring(0, file.name.lastIndexOf(".")) || file.name;
            const compressedFile = new File(
              [blob],
              `${originalBase}.${extension}`,
              { type: outputType, lastModified: Date.now() },
            );
            resolve(compressedFile);
          },
          outputType,
          quality,
        );
      };

      img.onerror = () => resolve(file);
    };

    reader.onerror = () => resolve(file);
  });
}

/**
 * Upload student user avatar.
 * Pre-compresses image to max 800x800 square and sends to backend Cloudinary endpoint.
 */
export async function uploadUserAvatar(
  file: File,
): Promise<{ message: string; avatar_url: string; is_profile_completed: boolean }> {
  // Compress in browser first for maximum speed
  const compressed = await compressImageClient(file, {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.85,
    outputType: "image/webp",
  });

  const formData = new FormData();
  formData.append("file", compressed);

  const response = await apiClient.post<{
    message: string;
    avatar_url: string;
    is_profile_completed: boolean;
  }>("/me/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 60000,
  });

  return response.data;
}

/**
 * Remove student user avatar.
 */
export async function removeUserAvatar(): Promise<{ message: string; avatar_url: null }> {
  const response = await apiClient.delete<{ message: string; avatar_url: null }>(
    "/me/avatar",
  );
  return response.data;
}

/**
 * Upload hackathon event banner image.
 * If eventId is provided, uploads and updates the event banner directly.
 * If eventId is omitted, uploads standalone banner for draft/new event creation.
 */
export async function uploadEventBanner(
  file: File,
  eventId?: string,
): Promise<{ message: string; banner_url: string; event_id?: string }> {
  // Compress in browser first (max 1600px width, 0.84 quality)
  const compressed = await compressImageClient(file, {
    maxWidth: 1600,
    maxHeight: 1200,
    quality: 0.84,
    outputType: "image/webp",
  });

  const formData = new FormData();
  formData.append("file", compressed);

  const url = eventId
    ? `/admin/events/${eventId}/banner`
    : "/admin/events/upload-banner";

  const response = await apiClient.post<{
    message: string;
    banner_url: string;
    event_id?: string;
  }>(url, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    timeout: 60000,
  });

  return response.data;
}
