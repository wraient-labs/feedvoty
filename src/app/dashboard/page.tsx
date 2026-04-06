import { createSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'
import type { Database } from '@/lib/supabase'

type Workspace = Database['public']['Tables']['feedvoty_workspaces']['Row']

export default async function DashboardPage() {
  const supabase = createSupabaseClient()

  const { data: workspaces } = await supabase
    .from('feedvoty_workspaces')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <p className="text-sm text-gray-500">Workspaces</p>
            <p className="text-3xl font-bold text-gray-900">{workspaces?.length || 0}</p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <p className="text-sm text-gray-500">Total Posts</p>
            <p className="text-3xl font-bold text-gray-900">
              {workspaces?.reduce((sum, w) => sum + (w.post_count || 0), 0) || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <p className="text-sm text-gray-500">Custom Domains</p>
            <p className="text-3xl font-bold text-gray-900">
              {workspaces?.filter((w) => w.custom_domain).length || 0}
            </p>
          </div>
        </div>

        {/* Workspace list */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Workspaces</h2>
          <Link
            href="/dashboard/new"
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition"
          >
            + New Workspace
          </Link>
        </div>

        {!workspaces || workspaces.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500 mb-4">No workspaces yet.</p>
            <Link
              href="/dashboard/new"
              className="text-indigo-600 font-medium hover:underline"
            >
              Create your first workspace →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {workspaces.map((ws: Workspace) => (
              <Link
                key={ws.id}
                href={`/dashboard/${ws.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-300 hover:shadow-sm transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">{ws.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {ws.slug && `/${ws.slug}`}
                      {ws.custom_domain && ` · ${ws.custom_domain}`}
                    </p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>{ws.post_count || 0} posts</p>
                    {ws.slack_webhook_url && (
                      <p className="text-green-600">Slack ✓</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Embed code helper */}
        <div className="mt-8 bg-indigo-50 rounded-xl border border-indigo-100 p-6">
          <h3 className="font-semibold text-indigo-900 mb-2">
            💡 Embed your widget
          </h3>
          <p className="text-sm text-indigo-700 mb-3">
            Add this script tag to any website to show the feedback widget:
          </p>
          <code className="block bg-white rounded-lg p-3 text-xs text-gray-800 font-mono overflow-x-auto">
            {'<script src="https://feedback.yourdomain.com/api/embed/widget.js" data-workspace-id="YOUR_ID"></script>'}
          </code>
        </div>
      </main>
    </div>
  )
}
