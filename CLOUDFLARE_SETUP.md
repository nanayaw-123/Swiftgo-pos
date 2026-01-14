# Cloudflare Integration Setup Guide

This guide explains how to set up and use Cloudflare services with SwiftPOS.

## 🚀 Features Integrated

- ✅ **R2 Storage** - Object storage for receipts, product images, reports
- ✅ **Turnstile** - Bot protection for contact forms and registrations
- ✅ **Image Optimization** - Automatic image resizing and compression
- ✅ **CDN** - Global content delivery network
- ✅ **DDoS Protection** - Automatic protection against attacks

## 📋 Prerequisites

1. **Cloudflare Account** - Sign up at [cloudflare.com](https://cloudflare.com)
2. **Domain** - Add your domain to Cloudflare (optional for Pages)
3. **Payment Method** - R2 requires a payment method (free tier available)

## 🔧 Setup Instructions

### 1. Cloudflare R2 Storage Setup

#### Step 1: Create R2 Bucket
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **R2** in the sidebar
3. Click **Create Bucket**
4. Name it `swiftpos-storage` (or your preferred name)
5. Choose location (automatic is recommended)
6. Click **Create Bucket**

#### Step 2: Generate R2 API Tokens
1. In R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API Token**
3. Name it `SwiftPOS R2 Access`
4. Permissions: **Object Read & Write**
5. Apply to specific bucket: `swiftpos-storage`
6. Click **Create API Token**
7. **SAVE THESE CREDENTIALS** (shown only once):
   - `Access Key ID`
   - `Secret Access Key`
   - `Account ID` (shown in dashboard)

#### Step 3: Configure Public Access (Optional)
If you want public URLs for uploaded images:
1. Go to **R2 → Your Bucket → Settings**
2. Click **Connect Domain**
3. Enter subdomain: `cdn.yourdomain.com`
4. Follow DNS setup instructions
5. Or use R2.dev domain (free): Enable in settings

#### Step 4: Add Environment Variables
Add to `.env.local`:
```env
# Cloudflare R2 Storage
CLOUDFLARE_ACCOUNT_ID=your-account-id-here
R2_ACCESS_KEY_ID=your-access-key-id
R2_SECRET_ACCESS_KEY=your-secret-access-key
R2_BUCKET_NAME=swiftpos-storage
R2_PUBLIC_URL=https://cdn.yourdomain.com  # Or your-bucket.r2.dev
NEXT_PUBLIC_R2_PUBLIC_URL=https://cdn.yourdomain.com
```

### 2. Turnstile Bot Protection Setup

#### Step 1: Create Turnstile Site
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Turnstile** in the sidebar
3. Click **Add Site**
4. Configure:
   - **Site Name**: SwiftPOS
   - **Domain**: `yourdomain.com` (or `localhost` for testing)
   - **Widget Mode**: Managed (recommended)
5. Click **Add**
6. **SAVE THESE KEYS**:
   - `Site Key` (public - goes in NEXT_PUBLIC_*)
   - `Secret Key` (private - server-side only)

#### Step 2: Add Environment Variables
Add to `.env.local`:
```env
# Turnstile Bot Protection
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key-here
TURNSTILE_SECRET_KEY=your-secret-key-here
```

### 3. Image Optimization Setup

#### Already Configured! ✅
The `imageLoader.ts` file is already configured. Images served through Next.js `<Image>` component will automatically be optimized via Cloudflare CDN when deployed.

**Usage:**
```tsx
import Image from 'next/image'

<Image 
  src="/products/phone.jpg"
  alt="Product"
  width={400}
  height={300}
  quality={85}
/>
```

This will automatically generate:
```
/cdn-cgi/image/width=400,quality=85/products/phone.jpg
```

### 4. Deployment Options

#### Option A: Cloudflare Pages (Recommended for Static Sites)
1. Connect GitHub repository
2. Configure build:
   - **Build command**: `npm run build`
   - **Build output**: `.next`
   - **Environment**: Node 18.x
3. Add environment variables in Pages UI
4. Deploy!

#### Option B: Cloudflare Workers (For Full-Stack)
```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Configure wrangler.jsonc (already done!)

# Set secrets
wrangler secret put R2_ACCESS_KEY_ID
wrangler secret put R2_SECRET_ACCESS_KEY
wrangler secret put TURNSTILE_SECRET_KEY

# Deploy
npm run build
wrangler deploy
```

## 💻 Usage Examples

### Upload Files to R2

```tsx
'use client'

import { uploadFileToR2, validateFile } from '@/lib/upload-file'
import { useState } from 'react'

export function ImageUploader() {
  const [uploading, setUploading] = useState(false)
  
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file
    const validation = validateFile(file, {
      maxSizeMB: 5,
      allowedTypes: ['image/jpeg', 'image/png']
    })
    
    if (!validation.valid) {
      alert(validation.error)
      return
    }
    
    setUploading(true)
    try {
      const result = await uploadFileToR2(file, {
        prefix: 'products',
        userId: 'user123'
      })
      
      if (result.success) {
        console.log('File uploaded:', result.fileUrl)
        // Save result.fileUrl to database
      } else {
        alert(result.error)
      }
    } finally {
      setUploading(false)
    }
  }
  
  return (
    <input 
      type="file" 
      onChange={handleUpload}
      disabled={uploading}
    />
  )
}
```

### Add Turnstile to Forms

```tsx
'use client'

import { TurnstileWidget } from '@/components/TurnstileWidget'
import { useState } from 'react'

export function ContactForm() {
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!token) {
      setError('Please complete the verification')
      return
    }
    
    // Verify token server-side
    const res = await fetch('/api/verify-turnstile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    })
    
    if (res.ok) {
      // Process form...
      console.log('Verified!')
    } else {
      const data = await res.json()
      setError(data.error)
    }
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <textarea name="message" required />
      
      <TurnstileWidget 
        onSuccess={setToken}
        onError={setError}
        theme="auto"
      />
      
      {error && <p className="text-red-500">{error}</p>}
      
      <button type="submit" disabled={!token}>
        Send Message
      </button>
    </form>
  )
}
```

## 🔒 Security Best Practices

1. **Never commit secrets** - Use `.env.local` (gitignored)
2. **Use Wrangler secrets** for production:
   ```bash
   wrangler secret put SECRET_NAME
   ```
3. **Validate file uploads** - Always check size and type
4. **Verify Turnstile tokens** - Server-side verification is mandatory
5. **Set CORS policies** on R2 buckets if needed

## 📊 Monitoring & Analytics

### R2 Storage Metrics
- Dashboard → R2 → Your Bucket → Metrics
- View: Storage usage, operations count, bandwidth

### Turnstile Analytics
- Dashboard → Turnstile → Your Site → Analytics
- View: Challenge solve rate, threats blocked

### Cloudflare Analytics
- Dashboard → Analytics & Logs
- View: Traffic, performance, security events

## 💰 Pricing

### R2 Storage (Pay-as-you-go)
- **Storage**: $0.015 per GB/month
- **Class A Operations**: $4.50 per million (writes)
- **Class B Operations**: $0.36 per million (reads)
- **Free Tier**: 10GB storage, 1M Class A, 10M Class B monthly

### Turnstile
- **Free** - Unlimited verifications

### Image Optimization
- **Included** with Cloudflare CDN (no extra cost)

## 🆘 Troubleshooting

### R2 Upload Fails
- **Check credentials** - Verify `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY`
- **Bucket name** - Ensure `R2_BUCKET_NAME` matches actual bucket
- **File size** - R2 has 5TB max file size (adjust validation as needed)

### Turnstile Not Loading
- **Check site key** - Verify `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is correct
- **Domain mismatch** - Ensure current domain matches Turnstile site config
- **Script blocked** - Check browser console for CSP issues

### Images Not Optimizing
- **Deployment** - Image optimization only works in production (Cloudflare CDN)
- **Image path** - Must be served through Next.js routes
- **Format** - Cloudflare supports: JPEG, PNG, GIF, WebP, SVG

## 🔗 Useful Links

- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [Turnstile Docs](https://developers.cloudflare.com/turnstile/)
- [Workers Deployment Guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/commands/)

## 📝 Next Steps

1. ✅ Complete environment variables setup
2. ✅ Test file uploads locally
3. ✅ Add Turnstile to contact/register forms
4. ✅ Deploy to Cloudflare Pages or Workers
5. ✅ Configure custom domain for R2 (optional)
6. ✅ Set up monitoring alerts

---

For more help, refer to the [Cloudflare Documentation](https://developers.cloudflare.com/) or contact support.
