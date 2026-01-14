'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Copy, 
  Check, 
  ExternalLink,
  FileCode,
  Terminal,
  PlayCircle
} from 'lucide-react'

export function MigrationGuide() {
  const [copied, setCopied] = useState(false)

  const migrationFile = 'supabase/migrations/20250101000000_init_swiftpos_schema.sql'
  const supabaseUrl = 'https://supabase.com/dashboard/project/andwiiymdgsjaeikkbpi/editor'

    const copyToClipboard = async (text: string) => {
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text)
          setCopied(true)
          setTimeout(() => setCopied(false), 2000)
        } else {
          throw new Error('Clipboard API not available')
        }
      } catch (err) {
        console.warn('Clipboard API failed, trying fallback:', err)
        try {
          const textArea = document.createElement('textarea')
          textArea.value = text
          textArea.style.position = 'fixed'
          textArea.style.left = '-9999px'
          textArea.style.top = '0'
          document.body.appendChild(textArea)
          textArea.focus()
          textArea.select()
          const successful = document.execCommand('copy')
          document.body.removeChild(textArea)
          if (successful) {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
          }
        } catch (fallbackErr) {
          console.error('Fallback copy failed:', fallbackErr)
        }
      }
    }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl mb-4">
          <FileCode className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
          Run Database Migrations
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Choose your preferred method to set up the database
        </p>
      </div>

      {/* Option A: Supabase Dashboard */}
      <Card className="p-6 border-2 border-primary">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
            A
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Supabase Dashboard
              </h3>
              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                Recommended
              </Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              The easiest way - copy and paste in the browser
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              1
            </div>
            <div className="flex-1">
              <p className="font-medium mb-2">Open Supabase SQL Editor</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(supabaseUrl, '_blank')}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open SQL Editor
              </Button>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              2
            </div>
            <div className="flex-1">
              <p className="font-medium mb-2">Click "New Query"</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                In the SQL Editor, click the "+ New Query" button
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              3
            </div>
            <div className="flex-1">
              <p className="font-medium mb-2">Copy the migration file path</p>
              <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-3 mb-2">
                <div className="flex items-center justify-between">
                  <code className="text-sm text-green-400 font-mono">
                    {migrationFile}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(migrationFile)}
                    className="text-gray-400 hover:text-white"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Open this file in your code editor, copy all contents
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              4
            </div>
            <div className="flex-1">
              <p className="font-medium mb-2">Paste into SQL Editor</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Paste the entire migration SQL into the editor
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
              5
            </div>
            <div className="flex-1">
              <p className="font-medium mb-2">Run the migration</p>
              <div className="flex items-center gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  <PlayCircle className="w-4 h-4" />
                  Click "Run" in Supabase
                </Button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  or press Cmd/Ctrl + Enter
                </span>
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <p className="text-sm text-green-800 dark:text-green-400 font-medium">
              ✓ Success! You should see "Success. No rows returned" or similar message
            </p>
          </div>
        </div>
      </Card>

      {/* Option B: CLI */}
      <Card className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full flex items-center justify-center font-bold flex-shrink-0">
            B
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Using Supabase CLI
              </h3>
              <Badge variant="secondary">Alternative</Badge>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              For developers who prefer command line
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {/* CLI Commands */}
          <div className="bg-gray-900 dark:bg-gray-950 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-xs text-gray-400 mb-1">Install CLI</p>
              <code className="text-sm text-green-400 font-mono">
                npm install -g supabase
              </code>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Login</p>
              <code className="text-sm text-green-400 font-mono">
                supabase login
              </code>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Link project</p>
              <code className="text-sm text-green-400 font-mono">
                supabase link --project-ref andwiiymdgsjaeikkbpi
              </code>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Run migrations</p>
              <code className="text-sm text-green-400 font-mono">
                supabase db push
              </code>
            </div>
          </div>
        </div>
      </Card>

      {/* Next Steps */}
      <Card className="p-6 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
          <Terminal className="w-5 h-5 text-blue-600" />
          After Running Migrations
        </h3>
        <ol className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600">1.</span>
            <span>Return to this page and click "Re-check Status"</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600">2.</span>
            <span>All checks should turn green ✅</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600">3.</span>
            <span>Go to <code className="bg-white dark:bg-gray-800 px-1 rounded">/sign-up</code> to create your account</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600">4.</span>
            <span>Complete onboarding and start using SwiftPOS! 🎉</span>
          </li>
        </ol>
      </Card>
    </div>
  )
}
