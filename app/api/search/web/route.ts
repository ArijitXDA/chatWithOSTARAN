// @ts-nocheck
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { searchWeb, formatSearchResultsForLLM } from '@/lib/tools/webSearch'

// POST - Perform web search
export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { query } = await request.json()

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    console.log('[WebSearch] Searching for:', query)

    // Perform search
    const results = await searchWeb(query.trim(), 5)

    console.log('[WebSearch] Found', results.results.length, 'results')

    // Format for display
    const formattedResults = formatSearchResultsForLLM(results)

    return NextResponse.json({
      query: results.query,
      answer: results.answer,
      results: results.results,
      formatted: formattedResults,
    })
  } catch (error: any) {
    console.error('Web search error:', error)
    return NextResponse.json({
      error: error.message || 'Failed to perform web search',
    }, { status: 500 })
  }
}
