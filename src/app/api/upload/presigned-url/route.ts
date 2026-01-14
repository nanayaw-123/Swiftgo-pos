import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import {
  getDefaultR2Client,
  getPresignedUploadUrl,
  generateFileKey,
  getPublicUrl,
} from '@/lib/cloudflare/r2-client'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface PresignedUrlRequest {
  filename: string
  contentType?: string
  prefix?: string
  userId?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PresignedUrlRequest = await request.json()
    const { filename, contentType, prefix = 'uploads', userId } = body

    if (!filename) {
      return NextResponse.json(
        { error: 'Filename is required' },
        { status: 400 }
      )
    }

    // Validate file extension for security
    const allowedExtensions = [
      'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', // Images
      'pdf', // Documents
      'csv', 'xlsx', // Spreadsheets
    ]
    
    const ext = filename.split('.').pop()?.toLowerCase()
    if (!ext || !allowedExtensions.includes(ext)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      )
    }

    // Get R2 client
    const r2Client = getDefaultR2Client()
    const bucketName = process.env.R2_BUCKET_NAME || 'swiftpos-storage'

    // Generate unique key
    const key = generateFileKey(prefix, filename, userId)

    // Generate presigned URL
    const presignedUrl = await getPresignedUploadUrl(
      r2Client,
      bucketName,
      key,
      contentType,
      3600 // 1 hour expiry
    )

    // Get public URL for the file
    const fileUrl = getPublicUrl(key)

    return NextResponse.json({
      presignedUrl,
      key,
      fileUrl,
      expiresIn: 3600,
    })
  } catch (error) {
    console.error('Presigned URL generation failed:', error)
    
    if (error instanceof Error && error.message.includes('environment variables')) {
      return NextResponse.json(
        { error: 'Cloudflare R2 is not configured. Please check environment variables.' },
        { status: 503 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    )
  }
}
