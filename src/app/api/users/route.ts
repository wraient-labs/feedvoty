import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type UserInsert = Database['public']['Tables']['feedvoty_users']['Insert']

// ──────────────────────────────────────────────
// GET /api/users
// Query params:
//   ?workspace_id=xxx  — filter by workspace (required)
// ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    const { searchParams } = new URL(request.url)

    const workspaceId = searchParams.get('workspace_id')

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspace_id query parameter is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('feedvoty_users')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ users: data || [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ──────────────────────────────────────────────
// POST /api/users
// Body: { workspace_id, email, display_name?, role? }
// ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    const body = await request.json()

    const { workspace_id, email, display_name, role } = body as {
      workspace_id: string
      email: string
      display_name?: string
      role?: string
    }

    if (!workspace_id || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: workspace_id, email' },
        { status: 400 }
      )
    }

    const userData: UserInsert = {
      workspace_id,
      email,
      display_name: display_name ?? email.split('@')[0],
      role: (role as 'owner' | 'member') ?? 'member',
    }

    const { data, error } = await supabase
      .from('feedvoty_users')
      .insert(userData)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ user: data }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
