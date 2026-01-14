/**
 * Client-side file upload utilities for Cloudflare R2
 */

interface UploadResult {
  success: boolean
  fileUrl?: string
  key?: string
  error?: string
}

interface PresignedUrlResponse {
  presignedUrl: string
  key: string
  fileUrl: string
  expiresIn: number
}

/**
 * Upload a file to Cloudflare R2 using presigned URL
 */
export async function uploadFileToR2(
  file: File,
  options?: {
    prefix?: string
    userId?: string
    onProgress?: (progress: number) => void
  }
): Promise<UploadResult> {
  try {
    // Step 1: Get presigned URL from server
    const response = await fetch('/api/upload/presigned-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        prefix: options?.prefix,
        userId: options?.userId,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        success: false,
        error: error.error || 'Failed to get upload URL',
      }
    }

    const data: PresignedUrlResponse = await response.json()

    // Step 2: Upload directly to R2 using presigned URL
    const uploadResponse = await fetch(data.presignedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    })

    if (!uploadResponse.ok) {
      return {
        success: false,
        error: 'Upload to storage failed',
      }
    }

    return {
      success: true,
      fileUrl: data.fileUrl,
      key: data.key,
    }
  } catch (error) {
    console.error('File upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    }
  }
}

/**
 * Upload multiple files to R2
 */
export async function uploadMultipleFiles(
  files: File[],
  options?: {
    prefix?: string
    userId?: string
    onProgress?: (fileIndex: number, progress: number) => void
  }
): Promise<UploadResult[]> {
  const results = await Promise.all(
    files.map((file, index) =>
      uploadFileToR2(file, {
        ...options,
        onProgress: (progress) => options?.onProgress?.(index, progress),
      })
    )
  )

  return results
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File,
  options?: {
    maxSizeMB?: number
    allowedTypes?: string[]
  }
): { valid: boolean; error?: string } {
  const maxSizeMB = options?.maxSizeMB || 10
  const allowedTypes = options?.allowedTypes || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ]

  // Check file size
  const fileSizeMB = file.size / (1024 * 1024)
  if (fileSizeMB > maxSizeMB) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    }
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not allowed',
    }
  }

  return { valid: true }
}
