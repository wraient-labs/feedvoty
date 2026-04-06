import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseClient } from '@/lib/supabase'

// ──────────────────────────────────────────────
// POST /api/webhooks/slack
// Receives Slack events (e.g. feedback submitted via slash command or button)
// Also used to POST notifications TO Slack (outgoing).
//
// For incoming Slack events (Event API verification):
//   { "type": "url_verification", "challenge": "xxx" }
//
// For outgoing notifications (internal helper):
//   { "workspace_id": "xxx", "title": "xxx", "body": "xxx" }
// ──────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // ── Slack URL verification challenge ─────
    if (body.type === 'url_verification') {
      return NextResponse.json({ challenge: body.challenge })
    }

    // ── Outgoing notification helper ─────────
    // Internal call to post a message to a Slack webhook URL stored on the workspace
    const { workspace_id, title, body: messageBody } = body as {
      workspace_id?: string
      title?: string
      body?: string
    }

    if (workspace_id) {
      await notifySlack(workspace_id, title || 'New Feedback', messageBody || '')
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ──────────────────────────────────────────────
// Send a message to a Slack incoming webhook URL
// ──────────────────────────────────────────────
async function notifySlack(workspaceId: string, title: string, body: string) {
  const supabase = createSupabaseClient()

  const { data: workspace } = await supabase
    .from('feedvoty_workspaces')
    .select('slack_webhook_url')
    .eq('id', workspaceId)
    .single()

  if (!workspace?.slack_webhook_url) return

  await fetch(workspace.slack_webhook_url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: `🗳️ ${title}`, emoji: true },
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: body || '' },
        },
      ],
    }),
  })
}
