/**
 * Exports group chat messages to CSV
 */
export function exportGroupChatToCSV(
  messages: any[],
  groupName: string
) {
  // CSV headers
  const headers = ['Timestamp', 'Sender', 'Type', 'Message', 'Tokens']

  // Convert messages to CSV rows
  const rows = messages.map((msg) => [
    new Date(msg.created_at).toLocaleString(),
    msg.sender_name,
    msg.sender_type === 'ai' ? 'AI (oStaran)' : 'User',
    `"${msg.content.replace(/"/g, '""')}"`, // Escape quotes
    msg.token_count || estimateTokens(msg.content),
  ])

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n')

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${groupName.replace(/[^a-z0-9]/gi, '_')}_chat_${Date.now()}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}
