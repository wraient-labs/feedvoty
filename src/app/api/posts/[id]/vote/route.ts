import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type VoteInsert = Database['public']['Tables']['feedvoty_votes']['Insert']

// ──────────────────────────────────────────────
// POST /api/posts/[id]/vote
// Body: { user_id }
// Upserts a vote (safe to call multiple times)
// ──────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseClient()
    const body = await request.json()

    const { user_id } = body as { user_id: string }

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing required field: user_id' },
        { status: 400 }
      )
    }

    // Check if the post exists
    const { data: post } = await supabase
      .from('feedvoty_posts')
      .select('id')
      .eq('id', params.id)
      .single()

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Upsert the vote (prevents duplicates via unique constraint)
    const voteData: VoteInsert = {
      post_id: params.id,
      user_id,
    }

    const { data, error } = await supabase
      .from('feedvoty_votes')
      .upsert(voteData, { onConflict: 'post_id,user_id' })
      .select()
      .single()

    if (error) throw error

    // Get the updated vote count
    const { data: votes } = await supabase
      .from('feedvoty_votes')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', params.id)

    return NextResponse.json({
      vote: data,
      vote_count: votes?.length ?? 0,
    }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ──────────────────────────────────────────────
// DELETE /api/posts/[id]/vote
// Body: { user_id }
// Remove a vote
// ──────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseClient()
    const body = await request.json()

    const { user_id } = body as { user_id: string }

    if (!user_id) {
      return NextResponse.json(
        { error: 'Missing required field: user_id' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('feedvoty_votes')
      .delete()
      .eq('post_id', params.id)
      .eq('user_id', user_id)

    if (error) throw error

    // Get the updated vote count
    const { data: votes } = await supabase
      .from('feedvoty_votes')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', params.id)

    return NextResponse.json({
      message: 'Vote removed',
      vote_count: votes?.length ?? 0,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ──────────────────────────────────────────────
// GET /api/posts/[id]/vote
// Check if a user has voted
// Query params: ?user_id=xxx
// ──────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseClient()
    const { searchParams } = new URL(request.url)

    const user_id = searchParams.get('user_id')

    // If user_id provided, check that specific vote
    if (user_id) {
      const { data, error } = await supabase
        .from('feedvoty_votes')
        .select('*')
        .eq('post_id', params.id)
        .eq('user_id', user_id)
        .maybeSingle()

      if (error) throw error

      return NextResponse.json({ has_voted: !!data, vote: data })
    }

    // Otherwise return total vote count and list of user_ids
    const { data, error } = await supabase
      .from('feedvoty_votes')
      .select('user_id')
      .eq('post_id', params.id)

    if (error) throw error

    return NextResponse.json({
      vote_count: data?.length ?? 0,
      user_ids: data?.map((v) => v.user_id) ?? [],
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
