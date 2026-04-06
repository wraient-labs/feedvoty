import { createSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function WorkspaceDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createSupabaseClient()

  const { data: workspace } = await supabase
    .from('feedvoty_workspaces')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!workspace) notFound()

  const { data: posts } = await supabase
    .from('feedvoty_posts')
    .select('*')
    .eq('workspace_id', params.id)
    .order('vote_count', { ascending: false })
    .limit(50)

  const { data: changelog } = await supabase
    .from('feedvoty_changelog')
    .select('*')
    .eq('workspace_id', params.id)
    .order('published_at', { ascending: false })
    .limit(10)

  const embedSnippet = `<script src="${process.env.NEXT_PUBLIC_APP_URL || ''}/api/embed/widget.js" data-workspace-id="${workspace.id}"></script>`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm">
              ← Dashboard
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="text-lg font-bold text-gray-900">{workspace.name}</h1>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/board/${workspace.slug}`}
              target="_blank"
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              View Board ↗
            </Link>
            <Link
              href={`/dashboard/${workspace.id}/settings`}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Settings
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Embed snippet */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5 mb-8">
          <h3 className="font-semibold text-indigo-900 mb-2">Embed Widget</h3>
          <p className="text-sm text-indigo-700 mb-3">Add this to any website:</p>
          <code className="block bg-white rounded-lg p-3 text-xs font-mono text-gray-800 overflow-x-auto select-all">
            {embedSnippet}
          </code>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Posts */}
          <div className="col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Feedback ({posts?.length || 0})
            </h2>
            {!posts || posts.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <p className="text-gray-500">No feedback yet.</p>
                <p className="text-sm text-gray-400 mt-1">Share your embed code to start collecting.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-200 transition"
                  >
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center gap-1">
                        <div className="bg-indigo-50 text-indigo-600 font-bold rounded-lg px-3 py-2 text-sm">
                          {post.vote_count || 0}
                        </div>
                        <span className="text-xs text-gray-400">votes</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{post.title}</h3>
                          {post.status && post.status !== 'open' && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              post.status === 'planned' ? 'bg-yellow-100 text-yellow-700' :
                              post.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                              post.status === 'complete' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {post.status.replace('_', ' ')}
                            </span>
                          )}
                          {post.category && (
                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                              {post.category}
                            </span>
                          )}
                        </div>
                        {post.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">{post.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(post.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Workspace info */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Workspace</h3>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-500">Slug</dt>
                  <dd className="font-mono text-gray-900">/{workspace.slug}</dd>
                </div>
                {workspace.custom_domain && (
                  <div>
                    <dt className="text-gray-500">Domain</dt>
                    <dd className="font-mono text-gray-900">{workspace.custom_domain}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-gray-500">Created</dt>
                  <dd className="text-gray-900">{new Date(workspace.created_at).toLocaleDateString()}</dd>
                </div>
              </dl>
            </div>

            {/* Changelog */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">
                Changelog ({changelog?.length || 0})
              </h3>
              {!changelog || changelog.length === 0 ? (
                <p className="text-sm text-gray-400">No entries yet.</p>
              ) : (
                <div className="space-y-3">
                  {changelog.map((entry) => (
                    <div key={entry.id} className="border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                      <p className="text-sm font-medium text-gray-900">{entry.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(entry.published_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Slack */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Integrations</h3>
              {workspace.slack_webhook_url ? (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <span>✓</span> Slack connected
                </div>
              ) : (
                <p className="text-sm text-gray-400">No integrations configured.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
