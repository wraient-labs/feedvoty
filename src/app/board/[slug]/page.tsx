import { createSupabaseClient } from '@/lib/supabase'
import { notFound } from 'next/navigation'

// ──────────────────────────────────────────────
// Public-facing feedback board
// Accessible at /board/[slug] — this is the page
// users see when they visit a workspace's public URL.
// Supports voting and viewing posts.
// ──────────────────────────────────────────────

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: { slug: string }
  searchParams: { sort?: string }
}) {
  const supabase = createSupabaseClient()

  const { data: workspace } = await supabase
    .from('feedvoty_workspaces')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!workspace) notFound()

  const sort = searchParams.sort || 'votes'
  const { data: posts } = await supabase
    .from('feedvoty_posts')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order(sort === 'newest' ? 'created_at' : 'vote_count', { ascending: false })
    .limit(50)

  const { data: changelog } = await supabase
    .from('feedvoty_changelog')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('published_at', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-6 py-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">{workspace.name}</h1>
          <p className="text-gray-500 mt-2">
            Vote on features, share feedback, and see what&apos;s coming next.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Sort tabs */}
        <div className="flex gap-2 mb-6">
          <a
            href={`/board/${workspace.slug}?sort=votes`}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition ${
              sort === 'votes'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Most Voted
          </a>
          <a
            href={`/board/${workspace.slug}?sort=newest`}
            className={`px-4 py-2 text-sm rounded-lg font-medium transition ${
              sort === 'newest'
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Newest
          </a>
        </div>

        {/* Posts */}
        <div className="space-y-3">
          {!posts || posts.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
              <p className="text-4xl mb-3">🗳️</p>
              <p className="text-gray-500 font-medium">No feedback yet</p>
              <p className="text-sm text-gray-400 mt-1">Be the first to submit an idea!</p>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-indigo-200 transition"
              >
                <div className="flex gap-4">
                  {/* Vote button */}
                  <div className="flex flex-col items-center gap-1">
                    <button
                      className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold rounded-lg px-3 py-2 text-sm transition cursor-pointer"
                      data-post-id={post.id}
                    >
                      ▲
                    </button>
                    <span className="font-bold text-gray-900 text-sm">
                      {post.vote_count || 0}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-medium text-gray-900">{post.title}</h3>
                      {post.status && post.status !== 'open' && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            post.status === 'planned'
                              ? 'bg-yellow-100 text-yellow-700'
                              : post.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-700'
                              : post.status === 'complete'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
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
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {post.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Changelog */}
        {changelog && changelog.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              What&apos;s New
            </h2>
            <div className="space-y-4">
              {changelog.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-white rounded-xl border border-gray-200 p-5"
                >
                  <h3 className="font-medium text-gray-900">{entry.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{entry.content}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(entry.published_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Powered by */}
        <footer className="mt-16 pb-8 text-center text-sm text-gray-400">
          Powered by{' '}
          <a
            href="/"
            className="text-indigo-500 hover:underline"
          >
            Feedvoty
          </a>
        </footer>
      </main>

      {/* Client-side voting script (inline, no JS framework needed) */}
      <script dangerouslySetInnerHTML={{
        __html: `
          document.querySelectorAll('[data-post-id]').forEach(btn => {
            btn.addEventListener('click', async () => {
              const postId = btn.dataset.postId;
              try {
                const res = await fetch('/api/posts/' + postId + '/vote', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                });
                if (res.ok) {
                  const data = await res.json();
                  btn.nextElementSibling.textContent = data.vote_count;
                }
              } catch (e) { console.error('Vote failed', e); }
            });
          });
        `,
      }} />
    </div>
  )
}
