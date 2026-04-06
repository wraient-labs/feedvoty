import { createClient } from '@supabase/supabase-js'

// ----------------------------------------------
// TypeScript types for feedvoty tables
// ----------------------------------------------

export type WorkspaceRole = 'owner' | 'admin' | 'member'
export type PostStatus = 'open' | 'planned' | 'in_progress' | 'complete' | 'closed'

export interface FeedvotyWorkspace {
  id: string
  name: string
  slug: string
  custom_domain: string | null
  created_at: string
}

export interface FeedvotyUser {
  id: string
  email: string
  display_name: string
  workspace_id: string
  role: WorkspaceRole
  created_at: string
}

export interface FeedvotyPost {
  id: string
  workspace_id: string
  title: string
  description: string | null
  status: PostStatus
  category: string | null
  created_at: string
  updated_at: string
}

export interface FeedvotyVote {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface FeedvotyComment {
  id: string
  post_id: string
  user_id: string
  body: string
  created_at: string
}

export interface FeedvotyChangelog {
  id: string
  workspace_id: string
  title: string
  content: string
  published_at: string
}

// ----------------------------------------------
// Supabase database schema type (for type-safe queries)
// ----------------------------------------------

export interface Database {
  public: {
    Tables: {
      feedvoty_workspaces: {
        Row: FeedvotyWorkspace
        Insert: Omit<FeedvotyWorkspace, 'id' | 'created_at'>
        Update: Partial<Omit<FeedvotyWorkspace, 'id' | 'created_at'>>
      }
      feedvoty_users: {
        Row: FeedvotyUser
        Insert: Omit<FeedvotyUser, 'id' | 'created_at'>
        Update: Partial<Omit<FeedvotyUser, 'id' | 'created_at'>>
      }
      feedvoty_posts: {
        Row: FeedvotyPost
        Insert: Omit<FeedvotyPost, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<FeedvotyPost, 'id' | 'created_at' | 'updated_at'>>
      }
      feedvoty_votes: {
        Row: FeedvotyVote
        Insert: Omit<FeedvotyVote, 'id' | 'created_at'>
        Update: Partial<Omit<FeedvotyVote, 'id' | 'created_at'>>
      }
      feedvoty_comments: {
        Row: FeedvotyComment
        Insert: Omit<FeedvotyComment, 'id' | 'created_at'>
        Update: Partial<Omit<FeedvotyComment, 'id' | 'created_at'>>
      }
      feedvoty_changelog: {
        Row: FeedvotyChangelog
        Insert: Omit<FeedvotyChangelog, 'id' | 'published_at'>
        Update: Partial<Omit<FeedvotyChangelog, 'id' | 'published_at'>>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}

// ----------------------------------------------
// Environment validation
// ----------------------------------------------

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing environment variable: SUPABASE_URL')
}
if (!supabaseServiceRoleKey) {
  throw new Error('Missing environment variable: SUPABASE_SERVICE_ROLE_KEY')
}

// ----------------------------------------------
// Server client (uses service role key — bypasses RLS)
// Use this in API routes and server components.
// ----------------------------------------------

export const supabaseServer = createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// ----------------------------------------------
// Client helper (for use in client components)
// Returns a function that creates a client with the anon key.
// Pass the access token if the user is authenticated.
// ----------------------------------------------

export function createSupabaseClient(accessToken?: string) {
  if (!supabaseAnonKey) {
    throw new Error('Missing environment variable: SUPABASE_ANON_KEY')
  }

  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
    global: {
      headers: accessToken
        ? { Authorization: `Bearer ${accessToken}` }
        : {},
    },
  })

  return client
}
