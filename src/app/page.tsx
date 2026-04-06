import { createSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'

export default async function HomePage() {
  const supabase = createSupabaseClient()

  // Show recent public posts across all workspaces (optional landing page feature)
  const { data: recentPosts } = await supabase
    .from('feedvoty_posts')
    .select('*, feedvoty_workspaces(name, slug)')
    .order('created_at', { ascending: false })
    .limit(10)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Feedback made simple
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Collect, prioritise, and act on user feedback. Embeddable widget,
            Slack notifications, and a clean dashboard — all in one.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              Open Dashboard
            </Link>
            <a
              href="#features"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Learn More
            </a>
          </div>
        </div>
      </header>

      {/* Features */}
      <section id="features" className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
          Everything you need
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: '💬',
              title: 'Embeddable Widget',
              desc: 'One line of JS. Collect feedback from any site.',
            },
            {
              icon: '🗳️',
              title: 'Voting',
              desc: 'Let users upvote what matters most to them.',
            },
            {
              icon: '🔔',
              title: 'Slack Alerts',
              desc: 'Get notified in real-time when feedback arrives.',
            },
            {
              icon: '📊',
              title: 'Dashboard',
              desc: 'Triage, status, categories — stay organised.',
            },
            {
              icon: '🌐',
              title: 'Custom Domains',
              desc: 'Your feedback board, your brand.',
            },
            {
              icon: '🔓',
              title: 'Open Source',
              desc: 'Self-hostable. No vendor lock-in.',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-xl p-6 border border-gray-200"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-gray-600 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent feedback */}
      {recentPosts && recentPosts.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 pb-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Recent Feedback
          </h2>
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white rounded-lg p-4 border border-gray-200 flex items-center gap-4"
              >
                <div className="bg-indigo-50 text-indigo-600 font-bold rounded-lg px-3 py-1 text-sm">
                  {post.vote_count}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{post.title}</p>
                  <p className="text-sm text-gray-500">
                    {post.feedvoty_workspaces?.name} · {new Date(post.created_at).toLocaleDateString()}
                  </p>
                </div>
                {post.status && (
                  <span className="text-xs uppercase tracking-wide bg-gray-100 text-gray-600 px-2 py-1 rounded">
                    {post.status.replace('_', ' ')}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-8 text-center text-sm text-gray-500">
          Feedvoty — open-source feedback platform
        </div>
      </footer>
    </div>
  )
}
