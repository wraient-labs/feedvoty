import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type ChangelogInsert = Database['public']['Tables']['feedvoty_changelog']['Insert']

// ──────────────────────────────────────────────
// GET /api/workspaces/[id]/changelog
// Get all changelog entries for a workspace
// ──────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('feedvoty_changelog')
      .select('*')
      .eq('workspace_id', params.id)
      .order('published_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ changelog: data || [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ──────────────────────────────────────────────
// POST /api/workspaces/[id]/changelog
// Body: { title, content, published_at? }
// ──────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseClient()
    const body = await request.json()

    const { title, content, published_at } = body as {
      title: string
      content: string
      published_at?: string
    }

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content' },
        { status: 400 }
      )
    }

    const changelogData: ChangelogInsert = {
      workspace_id: params.id,
      title,
      content,
      published_at: published_at ?? new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('feedvoty_changelog')
      .insert(changelogData)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ changelog: data }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
