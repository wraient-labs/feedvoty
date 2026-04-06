'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'

export default function WorkspaceSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.id as string

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [slackWebhook, setSlackWebhook] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/workspaces/${workspaceId}`)
      .then(r => r.json())
      .then(data => {
        if (data.workspace) {
          setName(data.workspace.name)
          setSlug(data.workspace.slug)
          setCustomDomain(data.workspace.custom_domain || '')
          setSlackWebhook(data.workspace.slack_webhook_url || '')
        }
      })
  }, [workspaceId])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'PUT',
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
        throw new Error(json.error || 'Failed to update')
      }

      setMessage('Settings saved!')
      setTimeout(() => setMessage(''), 3000)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure? This will delete all posts, votes, and comments. This cannot be undone.')) return

    setLoading(true)
    try {
      const res = await fetch(`/api/workspaces/${workspaceId}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to delete')
      }

      router.push('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setLoading(false)
    }
  }

  const embedSnippet = `<script src="${process.env.NEXT_PUBLIC_APP_URL || ''}/api/embed/widget.js" data-workspace-id="${workspaceId}"></script>`

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link href={`/dashboard/${workspaceId}`} className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to Workspace
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

        {message && (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-4 mb-6 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <div className="flex items-center">
              <span className="px-3 py-2 bg-gray-100 border border-r-0 border-gray-300 rounded-l-lg text-sm text-gray-500">/board/</span>
              <input
                value={slug}
                onChange={e => setSlug(e.target.value)}
                pattern="[a-z0-9-]+"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Domain</label>
            <input
              value={customDomain}
              onChange={e => setCustomDomain(e.target.value)}
              placeholder="feedback.example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slack Webhook</label>
            <input
              value={slackWebhook}
              onChange={e => setSlackWebhook(e.target.value)}
              placeholder="https://hooks.slack.com/services/..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        {/* Embed Code */}
        <div className="mt-10 pt-8 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Embed Code</h2>
          <code className="block bg-gray-900 text-green-400 rounded-lg p-4 text-sm font-mono overflow-x-auto select-all">
            {embedSnippet}
          </code>
        </div>

        {/* Danger Zone */}
        <div className="mt-10 pt-8 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-red-600 mb-3">Danger Zone</h2>
          <p className="text-sm text-gray-500 mb-4">
            Deleting this workspace will remove all posts, votes, comments, and changelog entries.
          </p>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete Workspace'}
          </button>
        </div>
      </main>
    </div>
  )
}
