'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NewWorkspacePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [workspaceId, setWorkspaceId] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const name = formData.get('name') as string
    const slug = formData.get('slug') as string
    const customDomain = formData.get('custom_domain') as string
    const slackWebhook = formData.get('slack_webhook_url') as string

    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          custom_domain: customDomain || null,
          slack_webhook_url: slackWebhook || null,
        }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to create workspace')
      }

      const json = await res.json()
      setWorkspaceId(json.workspace.id)
      router.push(`/dashboard/${json.workspace.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (workspaceId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center">
          <p className="text-4xl mb-3">🎉</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Workspace Created!</h2>
          <p className="text-gray-500 text-sm mb-6">
            Redirecting to your dashboard...
          </p>
          <Link
            href={`/dashboard/${workspaceId}`}
            className="text-indigo-600 font-medium hover:underline"
          >
            Go now →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">New Workspace</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Workspace Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              placeholder="My Product Feedback"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
          </div>

          {/* Slug */}
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
              URL Slug *
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-500">
                /board/
              </span>
              <input
                id="slug"
                name="slug"
                type="text"
                required
                placeholder="my-product"
                pattern="[a-z0-9-]+"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Lowercase letters, numbers, and hyphens only.</p>
          </div>

          {/* Custom Domain (optional) */}
          <div>
            <label htmlFor="custom_domain" className="block text-sm font-medium text-gray-700 mb-1">
              Custom Domain <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="custom_domain"
              name="custom_domain"
              type="text"
              placeholder="feedback.myproduct.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
          </div>

          {/* Slack Webhook (optional) */}
          <div>
            <label htmlFor="slack_webhook_url" className="block text-sm font-medium text-gray-700 mb-1">
              Slack Webhook URL <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <input
              id="slack_webhook_url"
              name="slack_webhook_url"
              type="url"
              placeholder="https://hooks.slack.com/services/T00/B00/xxx"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            />
            <p className="text-xs text-gray-400 mt-1">
              Get this from Slack → Settings → Manage → Incoming Webhooks.
            </p>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Workspace'}
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
