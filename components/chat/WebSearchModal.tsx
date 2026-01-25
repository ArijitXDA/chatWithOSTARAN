"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'

interface SearchResult {
  title: string
  url: string
  content: string
  score: number
}

interface WebSearchModalProps {
  onClose: () => void
  onUseResults: (formattedResults: string) => void
}

export function WebSearchModal({ onClose, onUseResults }: WebSearchModalProps) {
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [answer, setAnswer] = useState<string>('')

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a search query')
      return
    }

    setSearching(true)
    try {
      const response = await fetch('/api/search/web', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setResults(data.results || [])
      setAnswer(data.answer || '')
    } catch (error) {
      console.error('Search error:', error)
      toast.error('Failed to search. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const handleUseResults = () => {
    if (results.length === 0) {
      toast.error('No results to include')
      return
    }

    // Format results for LLM context
    let formattedResults = `[Web Search Results for: "${query}"]\n\n`

    if (answer) {
      formattedResults += `Quick Answer: ${answer}\n\n`
    }

    formattedResults += 'Sources:\n'
    results.forEach((result, index) => {
      formattedResults += `${index + 1}. ${result.title}\n`
      formattedResults += `   ${result.content.substring(0, 200)}...\n`
      formattedResults += `   URL: ${result.url}\n\n`
    })

    onUseResults(formattedResults)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">🔍 Web Search</h2>
              <p className="text-sm text-gray-600">Search the web and include results in your message</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="p-6 border-b">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter your search query..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <Button onClick={handleSearch} disabled={searching || !query.trim()}>
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-6">
          {searching && (
            <div className="text-center text-gray-500 py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
              <p>Searching the web...</p>
            </div>
          )}

          {!searching && results.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <p className="text-4xl mb-2">🔎</p>
              <p>Enter a query and click Search to find information from the web</p>
            </div>
          )}

          {!searching && results.length > 0 && (
            <div className="space-y-4">
              {/* Quick Answer */}
              {answer && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900 mb-2">💡 Quick Answer</p>
                  <p className="text-sm text-blue-800">{answer}</p>
                </div>
              )}

              {/* Search Results */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Found {results.length} results:
                </p>
                <div className="space-y-3">
                  {results.map((result, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50">
                      <h3 className="font-semibold text-blue-600 mb-1">
                        {index + 1}. {result.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {result.content.substring(0, 200)}...
                      </p>
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-500 hover:text-blue-600 underline"
                      >
                        {result.url}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex gap-3">
          <Button onClick={onClose} variant="secondary" className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleUseResults}
            disabled={results.length === 0}
            className="flex-1"
          >
            Include Results in Message
          </Button>
        </div>
      </div>
    </div>
  )
}
