import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type PostInsert = Database['public']['Tables']['feedvoty_posts']['Insert']

// ──────────────────────────────────────────────
// GET /api/posts
// Query params:
//   ?workspace_id=xxx — required filter
//   ?status=xxx       — filter by status
//   ?category=xxx     — filter by category
//   ?sort=votes|recent (default: votes)
// ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    const { searchParams } = new URL(request.url)

    const workspaceId = searchParams.get('workspace_id')
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const sort = searchParams.get('sort') || 'votes'

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id query parameter is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('feedvoty_posts')
      .select(`
        *,
        votes:feedvoty_votes(count)
      `)
      .eq('workspace_id', workspaceId)

    if (status) {
      query = query.eq('status', status)
    }
    if (category) {
      query = query.eq('category', category)
    }

    if (sort === 'recent') {
      query = query.order('created_at', { ascending: false })
    } else {
      // Default: sort by vote count descending
      query = query.order('created_at', { ascending: false })
    }

    const { data, error } = await query

    if (error) throw error

    // Transform to include vote count
    const posts = (data || []).map((post) => ({
      ...post,
      vote_count: post.votes?.[0]?.count ?? 0,
      votes: undefined, // remove nested votes array
    }))

    // If sorting by votes, sort client-side since PostgREST can't order by count()
    if (sort === 'votes') {
      posts.sort((a, b) => (b.vote_count as number) - (a.vote_count as number))
    }

    return NextResponse.json({ posts })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ──────────────────────────────────────────────
// POST /api/posts
// Body: { workspace_id, title, description?, status?, category? }
// ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    const body = await request.json()

    const { workspace_id, title, description, status, category } = body as {
      workspace_id: string
      title: string
      description?: string | null
      status?: string
      category?: string | null
    }

    if (!workspace_id || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: workspace_id, title' },
        { status: 400 }
      )
    }

    // Validate status if provided
    if (status && !['open', 'planned', 'in_progress', 'complete', 'closed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: open, planned, in_progress, complete, closed' },
        { status: 400 }
      )
    }

    const postData: PostInsert = {
      workspace_id,
      title,
      description: description ?? null,
      status: (status as typeof status) ?? 'open',
      category: category ?? null,
    }

    const { data, error } = await supabase
      .from('feedvoty_posts')
      .insert(postData)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ post: data }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
