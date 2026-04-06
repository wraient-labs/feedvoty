import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type CommentInsert = Database['public']['Tables']['feedvoty_comments']['Insert']

// ──────────────────────────────────────────────
// GET /api/posts/[id]/comments
// List all comments for a post
// ──────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('feedvoty_comments')
      .select('*')
      .eq('post_id', params.id)
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ comments: data || [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ──────────────────────────────────────────────
// POST /api/posts/[id]/comments
// Body: { user_id, body }
// ──────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseClient()
    const body = await request.json()

    const { user_id, body: commentBody } = body as {
      user_id: string
      body: string
    }

    if (!user_id || !commentBody) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, body' },
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

    const commentData: CommentInsert = {
      post_id: params.id,
      user_id,
      body: commentBody,
    }

    const { data, error } = await supabase
      .from('feedvoty_comments')
      .insert(commentData)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ comment: data }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
