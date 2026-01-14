import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { Upload } from '@aws-sdk/lib-storage'

interface R2Config {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
}

/**
 * Create an S3-compatible client for Cloudflare R2
 */
export function createR2Client(config: R2Config): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })
}

/**
 * Get a presigned URL for uploading a file directly from the client
 */
export async function getPresignedUploadUrl(
  client: S3Client,
  bucketName: string,
  key: string,
  contentType?: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(client, command, { expiresIn })
}

/**
 * Get a presigned URL for downloading a file
 */
export async function getPresignedDownloadUrl(
  client: S3Client,
  bucketName: string,
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  })

  return getSignedUrl(client, command, { expiresIn })
}

/**
 * Upload a file directly from server-side code
 */
export async function uploadObject(
  client: S3Client,
  bucketName: string,
  key: string,
  body: Buffer | Uint8Array | string,
  contentType?: string,
  metadata?: Record<string, string>
) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
  })

  return client.send(command)
}

/**
 * Upload large files with multipart upload
 */
export async function uploadLargeObject(
  client: S3Client,
  bucketName: string,
  key: string,
  body: Buffer | Uint8Array | ReadableStream,
  contentType?: string,
  onProgress?: (progress: number) => void
) {
  const upload = new Upload({
    client,
    params: {
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    },
  })

  if (onProgress) {
    upload.on('httpUploadProgress', (progress) => {
      if (progress.loaded && progress.total) {
        const percentage = (progress.loaded / progress.total) * 100
        onProgress(percentage)
      }
    })
  }

  return upload.done()
}

/**
 * Get an object from R2
 */
export async function getObject(
  client: S3Client,
  bucketName: string,
  key: string
) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  })

  return client.send(command)
}

/**
 * Delete an object from R2
 */
export async function deleteObject(
  client: S3Client,
  bucketName: string,
  key: string
) {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  })

  return client.send(command)
}

/**
 * List objects in a bucket with optional prefix
 */
export async function listObjects(
  client: S3Client,
  bucketName: string,
  prefix?: string,
  maxKeys?: number
) {
  const command = new ListObjectsV2Command({
    Bucket: bucketName,
    Prefix: prefix,
    MaxKeys: maxKeys,
  })

  return client.send(command)
}

/**
 * Get the default R2 client instance using environment variables
 */
export function getDefaultR2Client(): S3Client {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'Missing required Cloudflare R2 environment variables: CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY'
    )
  }

  return createR2Client({
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName: process.env.R2_BUCKET_NAME || 'swiftpos-storage',
  })
}

/**
 * Helper to generate a unique file key
 */
export function generateFileKey(
  prefix: string,
  filename: string,
  userId?: string
): string {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  const ext = filename.split('.').pop()
  const sanitizedName = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
  
  const parts = [prefix, timestamp, randomId]
  if (userId) parts.push(userId)
  
  return `${parts.join('/')}.${ext}`
}

/**
 * Get the public URL for an R2 object
 */
export function getPublicUrl(key: string): string {
  const publicUrl = process.env.R2_PUBLIC_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_URL
  
  if (!publicUrl) {
    console.warn('R2_PUBLIC_URL not set, returning key only')
    return key
  }
  
  return `${publicUrl}/${key}`
}
