import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type WorkspaceUpdate = Database['public']['Tables']['feedvoty_workspaces']['Update']

// ──────────────────────────────────────────────
// GET /api/workspaces/[id]
// Get workspace by id or slug
// ──────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseClient()
    const idOrSlug = params.id

    // Try by id first, then by slug
    const { data, error } = await supabase
      .from('feedvoty_workspaces')
      .select('*')
      .or(`id.eq.${idOrSlug},slug.eq.${idOrSlug}`)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Workspace not found' },
          { status: 404 }
        )
      }
      throw error
    }

    // Fetch associated users
    const { data: users } = await supabase
      .from('feedvoty_users')
      .select('*')
      .eq('workspace_id', data.id)

    return NextResponse.json({ workspace: data, users: users || [] })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ──────────────────────────────────────────────
// PATCH /api/workspaces/[id]
// Body: { name?, slug?, custom_domain? }
// ──────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseClient()
    const body = await request.json()

    const { name, slug, custom_domain } = body as {
      name?: string
      slug?: string
      custom_domain?: string | null
    }

    if (!name && !slug && custom_domain === undefined) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    const updateData: WorkspaceUpdate = {}
    if (name !== undefined) updateData.name = name
    if (slug !== undefined) updateData.slug = slug
    if (custom_domain !== undefined) updateData.custom_domain = custom_domain

    const { data, error } = await supabase
      .from('feedvoty_workspaces')
      .update(updateData)
      .or(`id.eq.${params.id},slug.eq.${params.id}`)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Workspace not found' },
          { status: 404 }
        )
      }
      throw error
    }

    return NextResponse.json({ workspace: data })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ──────────────────────────────────────────────
// DELETE /api/workspaces/[id]
// Cascade-delete related records
// ──────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createSupabaseClient()

    // First, find the workspace to get its id (in case slug was passed)
    const { data: workspace, error: findError } = await supabase
      .from('feedvoty_workspaces')
      .select('id')
      .or(`id.eq.${params.id},slug.eq.${params.id}`)
      .single()

    if (findError) {
      if (findError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Workspace not found' },
          { status: 404 }
        )
      }
      throw findError
    }

    const wsId = workspace.id

    // Delete related records in order (votes first due to FK)
    // Get all post ids for this workspace
    const { data: posts } = await supabase
      .from('feedvoty_posts')
      .select('id')
      .eq('workspace_id', wsId)

    if (posts && posts.length > 0) {
      const postIds = posts.map((p) => p.id)

      // Delete votes for these posts
      await supabase.from('feedvoty_votes').delete().in('post_id', postIds)

      // Delete comments for these posts
      await supabase
        .from('feedvoty_comments')
        .delete()
        .in('post_id', postIds)

      // Delete posts
      await supabase
        .from('feedvoty_posts')
        .delete()
        .eq('workspace_id', wsId)
    }

    // Delete changelog entries
    await supabase
      .from('feedvoty_changelog')
      .delete()
      .eq('workspace_id', wsId)

    // Delete users
    await supabase
      .from('feedvoty_users')
      .delete()
      .eq('workspace_id', wsId)

    // Finally delete the workspace
    const { error: deleteError } = await supabase
      .from('feedvoty_workspaces')
      .delete()
      .eq('id', wsId)

    if (deleteError) throw deleteError

    return NextResponse.json({ message: 'Workspace deleted' })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
