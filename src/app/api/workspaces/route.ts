import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type WorkspaceInsert = Database['public']['Tables']['feedvoty_workspaces']['Insert']

// ──────────────────────────────────────────────
// GET /api/workspaces
// Query params:
//   ?user_id=xxx  — filter workspaces the user belongs to
//   ?slug=xxx     — look up by slug
// ──────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    const { searchParams } = new URL(request.url)

    const userId = searchParams.get('user_id')
    const slug = searchParams.get('slug')

    // If slug is provided, return a single workspace
    if (slug) {
      const { data, error } = await supabase
        .from('feedvoty_workspaces')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return NextResponse.json({ workspace: null }, { status: 404 })
        }
        throw error
      }

      return NextResponse.json({ workspace: data })
    }

    // If user_id is provided, filter via the users table
    if (userId) {
      const { data, error } = await supabase
        .from('feedvoty_users')
        .select('workspace:feedvoty_workspaces(*)')
        .eq('id', userId)

      if (error) throw error

      // Flatten nested workspace objects
      const workspaces = data
        .filter((u) => u.workspace)
        .map((u) => u.workspace)

      return NextResponse.json({ workspaces })
    }

    // No filter — list all workspaces
    const { data, error } = await supabase
      .from('feedvoty_workspaces')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ workspaces: data || [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ──────────────────────────────────────────────
// POST /api/workspaces
// Body: { name, slug, owner_email?, owner_display_name? }
// ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    const body = await request.json()

    const {
      name,
      slug,
      custom_domain,
      owner_email,
      owner_display_name,
    } = body as {
      name: string
      slug: string
      custom_domain?: string | null
      owner_email?: string
      owner_display_name?: string
    }

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug' },
        { status: 400 }
      )
    }

    // Create the workspace
    const workspaceData: WorkspaceInsert = {
      name,
      slug,
      custom_domain: custom_domain ?? null,
    }

    const { data: workspace, error: wsError } = await supabase
      .from('feedvoty_workspaces')
      .insert(workspaceData)
      .select()
      .single()

    if (wsError) throw wsError

    // Optionally create the owner user record
    if (owner_email) {
      const { error: userError } = await supabase
        .from('feedvoty_users')
        .insert({
          email: owner_email,
          display_name: owner_display_name ?? owner_email.split('@')[0],
          workspace_id: workspace.id,
          role: 'owner',
        })

      if (userError) {
        // Don't fail the whole request, just warn
        console.error('Failed to create owner user:', userError)
      }
    }

    return NextResponse.json({ workspace }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
