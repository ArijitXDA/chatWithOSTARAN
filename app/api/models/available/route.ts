import { NextResponse } from 'next/server'
import { getAvailableModels } from '@/lib/llm/factory'

export async function GET() {
  try {
    const models = getAvailableModels()
    return NextResponse.json({ models })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch available models' },
      { status: 500 }
    )
  }
}
