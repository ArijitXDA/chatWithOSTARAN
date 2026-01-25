"use client"

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownMessageProps {
  content: string
  isAI?: boolean
}

export function MarkdownMessage({ content, isAI = false }: MarkdownMessageProps) {
  return (
    <div className={`prose prose-sm max-w-none ${isAI ? 'prose-green' : ''}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-bold mt-2 mb-1">{children}</h3>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="mb-2 leading-relaxed">{children}</p>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="ml-2">{children}</li>
          ),

          // Bold, Italic, Underline
          strong: ({ children }) => (
            <strong className="font-bold text-gray-900">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic">{children}</em>
          ),

          // Code
          code: ({ inline, children, ...props }: any) =>
            inline ? (
              <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-red-600">
                {children}
              </code>
            ) : (
              <pre className="bg-gray-100 p-3 rounded-lg overflow-x-auto mb-2">
                <code className="text-sm font-mono">{children}</code>
              </pre>
            ),

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              {children} 🔗
            </a>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-2">
              {children}
            </blockquote>
          ),

          // Horizontal Rule
          hr: () => <hr className="my-4 border-gray-300" />,

          // Tables
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="min-w-full border-collapse border border-gray-300">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-gray-300 px-4 py-2 bg-gray-100 font-semibold text-left">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-300 px-4 py-2">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
