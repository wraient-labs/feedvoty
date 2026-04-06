import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type PostUpdate = Database['public']['Tables']['feedvoty_posts']['Update']

// ──────────────────────────────────────────────
// GET /api/posts/[id]
// Get a single post with vote count and comments
// ──────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('feedvoty_posts')
      .select(`
        *,
        votes:feedvoty_votes(count)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({
      post: {
        ...data,
        vote_count: data.votes?.[0]?.count ?? 0,
        votes: undefined,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ──────────────────────────────────────────────
// PATCH /api/posts/[id]
// Body: { title?, description?, status?, category? }
// ──────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseClient()
    const body = await request.json()

    const { title, description, status, category } = body as {
      title?: string
      description?: string | null
      status?: string
      category?: string | null
    }

    if (!title && description === undefined && !status && category === undefined) {
      return NextResponse.json(
        { error: 'No fields to update' },
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

    const updateData: PostUpdate = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status !== undefined) updateData.status = status as PostUpdate['status']
    if (category !== undefined) updateData.category = category

    const { data, error } = await supabase
      .from('feedvoty_posts')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ post: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ──────────────────────────────────────────────
// DELETE /api/posts/[id]
// Cascade-delete votes and comments for this post
// ──────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseClient()

    // Delete related votes and comments
    await supabase.from('feedvoty_votes').delete().eq('post_id', params.id)
    await supabase.from('feedvoty_comments').delete().eq('post_id', params.id)

    const { error } = await supabase
      .from('feedvoty_posts')
      .delete()
      .eq('id', params.id)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ message: 'Post deleted' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
