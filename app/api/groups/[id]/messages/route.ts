// @ts-nocheck
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getProvider } from '@/lib/llm/factory'
import {
  analyzeConversationForIntervention,
  checkIfOStaranMentioned,
  generateGroupChatSystemPrompt,
} from '@/lib/ai/groupChatAgent'

// GET - Fetch group messages
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: groupId } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a member
    const { data: member } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
    }

    // Fetch messages
    const { data: messages, error } = await supabase
      .from('group_messages')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
    }

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error('Group messages GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Send a message (may trigger AI response)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: groupId } = await params

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { content } = await request.json()

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    // Verify user is a member
    const { data: member } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', groupId)
      .eq('user_id', user.id)
      .single()

    if (!member) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
    }

    // Get user profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single()

    const senderName = profile
      ? `${profile.first_name} ${profile.last_name}`
      : 'User'

    // Check if oStaran was mentioned
    const mentionedOStaran = checkIfOStaranMentioned(content)

    // Get recent messages for context
    const { data: recentMessages } = await supabase
      .from('group_messages')
      .select('sender_name, sender_type, content, created_at')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Analyze if AI should respond
    const decision = analyzeConversationForIntervention(
      recentMessages || [],
      content,
      mentionedOStaran
    )

    // Save user message
    const { data: userMessage, error: messageError } = await supabase
      .from('group_messages')
      .insert({
        group_id: groupId,
        user_id: user.id,
        sender_name: senderName,
        sender_type: 'user',
        content: content.trim(),
        mentioned_ostaran: mentionedOStaran,
        ai_should_respond: decision.shouldRespond,
      })
      .select()
      .single()

    if (messageError) {
      console.error('Error saving message:', messageError)
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
    }

    // Update conversation context
    await supabase
      .from('group_conversation_context')
      .update({
        detected_tone: decision.detectedTone,
        detected_topics: decision.detectedTopics,
        message_count: (recentMessages?.length || 0) + 1,
      })
      .eq('group_id', groupId)

    // If AI should respond, generate response
    let aiMessage = null
    if (decision.shouldRespond) {
      console.log('[Group Chat AI] Decision to respond:', {
        shouldRespond: decision.shouldRespond,
        reason: decision.reason,
        tone: decision.detectedTone,
        topics: decision.detectedTopics
      })
      try {
        // Use service client for AI message to bypass RLS
        const serviceClient = createServiceClient()
        aiMessage = await generateAIResponse(
          supabase,
          serviceClient,
          groupId,
          content,
          recentMessages || [],
          decision.detectedTone,
          decision.detectedTopics
        )
        console.log('[Group Chat AI] AI message created:', {
          id: aiMessage?.id,
          sender_name: aiMessage?.sender_name,
          sender_type: aiMessage?.sender_type,
          content_preview: aiMessage?.content?.substring(0, 50)
        })
      } catch (aiError) {
        console.error('[Group Chat AI] Error generating response:', aiError)
        // Don't fail the request if AI fails - user message was saved
      }
    } else {
      console.log('[Group Chat AI] Not responding. Reason:', decision.reason)
    }

    return NextResponse.json({
      userMessage,
      aiMessage,
      aiResponded: !!aiMessage,
      reason: decision.reason,
    })
  } catch (error: any) {
    console.error('Group message POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Helper function to generate AI response
async function generateAIResponse(
  supabase: any,
  serviceClient: any,
  groupId: string,
  userMessage: string,
  recentMessages: any[],
  tone: string,
  topics: string[]
) {
  // Get group members (use regular client for reading)
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId)

  const memberIds = members?.map((m: any) => m.user_id) || []

  // Get member names
  const { data: profiles } = await supabase
    .from('profiles')
    .select('first_name, last_name')
    .in('id', memberIds)

  const memberNames = profiles?.map((p: any) => p.first_name) || []

  // Generate system prompt
  const systemPrompt = generateGroupChatSystemPrompt(tone, topics, memberNames)

  // Prepare conversation history for AI
  const conversationHistory = [...recentMessages]
    .reverse()
    .slice(-5) // Last 5 messages for context
    .map((msg: any) => ({
      role: msg.sender_type === 'ai' ? 'assistant' : 'user',
      content: `${msg.sender_name}: ${msg.content}`,
    }))

  // Add current message
  conversationHistory.push({
    role: 'user',
    content: userMessage,
  })

  // Get AI provider (use OpenAI/GPT-4 for group chat)
  const provider = getProvider('openai')

  // Generate response with 100-word limit
  const response = await provider.chat({
    messages: [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
    ],
    temperature: 0.7,
    max_tokens: 200, // Allow up to ~100 words
  })

  let aiContent = response.content.trim()

  // Enforce 100-word limit
  const words = aiContent.split(/\s+/)
  if (words.length > 100) {
    aiContent = words.slice(0, 100).join(' ') + '...'
  }

  // Save AI message (use service client to bypass RLS)
  const { data: aiMessage, error: aiInsertError } = await serviceClient
    .from('group_messages')
    .insert({
      group_id: groupId,
      user_id: null,
      sender_name: 'oStaran',
      sender_type: 'ai',
      content: aiContent,
      mentioned_ostaran: false,
      ai_should_respond: false,
    })
    .select()
    .single()

  if (aiInsertError) {
    console.error('Error inserting AI message:', aiInsertError)
    throw new Error(`Failed to save AI message: ${aiInsertError.message}`)
  }

  // Update last AI message timestamp (use service client)
  await serviceClient
    .from('group_conversation_context')
    .update({
      last_ai_message_at: new Date().toISOString(),
    })
    .eq('group_id', groupId)

  return aiMessage
}
