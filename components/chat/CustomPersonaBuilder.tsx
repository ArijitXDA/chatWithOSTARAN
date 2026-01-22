"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Slider } from '@/components/ui/Slider'
import { CustomPersona } from '@/types'
import toast from 'react-hot-toast'

interface CustomPersonaBuilderProps {
  onSave: (persona: Omit<CustomPersona, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => void
  onCancel: () => void
  initialData?: CustomPersona
}

export function CustomPersonaBuilder({ onSave, onCancel, initialData }: CustomPersonaBuilderProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    icon: initialData?.icon || '🎭',
    description: initialData?.description || '',
    system_prompt: initialData?.system_prompt || '',

    // Advanced tuning
    temperature_default: initialData?.temperature_default || 0.7,
    max_tokens: initialData?.max_tokens || 4000,
    top_p: initialData?.top_p || 1.0,
    frequency_penalty: initialData?.frequency_penalty || 0.0,
    presence_penalty: initialData?.presence_penalty || 0.0,

    // Behavioral traits
    creativity_level: initialData?.creativity_level || 'balanced',
    formality_level: initialData?.formality_level || 'balanced',
    verbosity_level: initialData?.verbosity_level || 'balanced',

    // Response style
    use_emojis: initialData?.use_emojis ?? false,
    use_markdown: initialData?.use_markdown ?? true,
    use_code_blocks: initialData?.use_code_blocks ?? true,
    citation_style: initialData?.citation_style || 'none',

    // Knowledge settings
    expertise_domains: initialData?.expertise_domains?.join(', ') || '',
    language_style: initialData?.language_style || 'standard',
    reasoning_style: initialData?.reasoning_style || 'balanced',

    is_active: initialData?.is_active ?? true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Please provide a persona name')
      return
    }

    if (!formData.system_prompt.trim()) {
      toast.error('Please provide a system prompt')
      return
    }

    const personaData = {
      ...formData,
      expertise_domains: formData.expertise_domains
        ? formData.expertise_domains.split(',').map(d => d.trim()).filter(Boolean)
        : null,
      citation_style: formData.citation_style === 'none' ? null : formData.citation_style,
    }

    onSave(personaData as any)
  }

  const popularIcons = ['🎭', '🤖', '🧠', '💡', '🎨', '⚡', '🔮', '🦾', '👾', '🌟']

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 z-10">
          <h2 className="text-2xl font-bold">
            {initialData ? 'Edit Custom Persona' : 'Create Custom Persona'}
          </h2>
          <p className="text-gray-600 mt-1">
            Build an AI assistant tailored to your specific needs with advanced tuning options
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>📝</span> Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Persona Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Code Reviewer, Creative Writer"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon
                </label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {popularIcons.map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`w-10 h-10 text-2xl rounded border-2 transition-all ${
                        formData.icon === icon
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="Or enter custom emoji"
                  maxLength={4}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this persona's purpose"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  System Prompt <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  placeholder="Define the persona's behavior, tone, expertise, and response style..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] font-mono text-sm"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  This is the core instruction that defines how the AI will behave
                </p>
              </div>
            </div>
          </section>

          {/* Advanced Tuning Parameters */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>⚙️</span> Advanced Tuning Parameters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Slider
                  label="Default Temperature"
                  min={0}
                  max={2}
                  step={0.1}
                  value={formData.temperature_default}
                  onChange={(value) => setFormData({ ...formData, temperature_default: value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Higher = more creative/random, Lower = more focused/deterministic
                </p>
              </div>

              <div>
                <Slider
                  label="Top P (Nucleus Sampling)"
                  min={0}
                  max={1}
                  step={0.05}
                  value={formData.top_p}
                  onChange={(value) => setFormData({ ...formData, top_p: value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Controls diversity via nucleus sampling (0.9 recommended)
                </p>
              </div>

              <div>
                <Slider
                  label="Frequency Penalty"
                  min={-2}
                  max={2}
                  step={0.1}
                  value={formData.frequency_penalty}
                  onChange={(value) => setFormData({ ...formData, frequency_penalty: value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Reduces repetition of token sequences (positive = less repetition)
                </p>
              </div>

              <div>
                <Slider
                  label="Presence Penalty"
                  min={-2}
                  max={2}
                  step={0.1}
                  value={formData.presence_penalty}
                  onChange={(value) => setFormData({ ...formData, presence_penalty: value })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Encourages new topics (positive = more topic diversity)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Tokens per Response
                </label>
                <Input
                  type="number"
                  min={100}
                  max={32000}
                  step={100}
                  value={formData.max_tokens}
                  onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum length of responses (4000 recommended)
                </p>
              </div>
            </div>
          </section>

          {/* Behavioral Traits */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🎨</span> Behavioral Traits
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Creativity Level"
                value={formData.creativity_level}
                onChange={(e) => setFormData({ ...formData, creativity_level: e.target.value as any })}
                options={[
                  { value: 'conservative', label: 'Conservative' },
                  { value: 'balanced', label: 'Balanced' },
                  { value: 'creative', label: 'Creative' },
                  { value: 'experimental', label: 'Experimental' },
                ]}
              />

              <Select
                label="Formality Level"
                value={formData.formality_level}
                onChange={(e) => setFormData({ ...formData, formality_level: e.target.value as any })}
                options={[
                  { value: 'casual', label: 'Casual' },
                  { value: 'balanced', label: 'Balanced' },
                  { value: 'formal', label: 'Formal' },
                  { value: 'academic', label: 'Academic' },
                ]}
              />

              <Select
                label="Verbosity Level"
                value={formData.verbosity_level}
                onChange={(e) => setFormData({ ...formData, verbosity_level: e.target.value as any })}
                options={[
                  { value: 'concise', label: 'Concise' },
                  { value: 'balanced', label: 'Balanced' },
                  { value: 'detailed', label: 'Detailed' },
                  { value: 'comprehensive', label: 'Comprehensive' },
                ]}
              />

              <Select
                label="Language Style"
                value={formData.language_style}
                onChange={(e) => setFormData({ ...formData, language_style: e.target.value as any })}
                options={[
                  { value: 'standard', label: 'Standard' },
                  { value: 'technical', label: 'Technical' },
                  { value: 'simplified', label: 'Simplified' },
                  { value: 'storytelling', label: 'Storytelling' },
                ]}
              />

              <Select
                label="Reasoning Style"
                value={formData.reasoning_style}
                onChange={(e) => setFormData({ ...formData, reasoning_style: e.target.value as any })}
                options={[
                  { value: 'intuitive', label: 'Intuitive' },
                  { value: 'balanced', label: 'Balanced' },
                  { value: 'analytical', label: 'Analytical' },
                  { value: 'step_by_step', label: 'Step-by-Step' },
                ]}
              />

              <Select
                label="Citation Style"
                value={formData.citation_style || 'none'}
                onChange={(e) => setFormData({ ...formData, citation_style: e.target.value as any })}
                options={[
                  { value: 'none', label: 'None' },
                  { value: 'inline', label: 'Inline' },
                  { value: 'footnotes', label: 'Footnotes' },
                  { value: 'academic', label: 'Academic' },
                ]}
              />
            </div>
          </section>

          {/* Response Style Preferences */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>✨</span> Response Style Preferences
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.use_emojis}
                  onChange={(e) => setFormData({ ...formData, use_emojis: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <span className="font-medium">Use Emojis</span>
                  <p className="text-sm text-gray-600">Include emojis in responses for visual appeal</p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.use_markdown}
                  onChange={(e) => setFormData({ ...formData, use_markdown: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <span className="font-medium">Use Markdown Formatting</span>
                  <p className="text-sm text-gray-600">Format responses with markdown (bold, italic, lists, etc.)</p>
                </div>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.use_code_blocks}
                  onChange={(e) => setFormData({ ...formData, use_code_blocks: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <span className="font-medium">Use Code Blocks</span>
                  <p className="text-sm text-gray-600">Format code snippets with syntax highlighting</p>
                </div>
              </label>
            </div>
          </section>

          {/* Knowledge & Expertise */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span>🎓</span> Knowledge & Expertise
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expertise Domains (comma-separated)
              </label>
              <Input
                value={formData.expertise_domains}
                onChange={(e) => setFormData({ ...formData, expertise_domains: e.target.value })}
                placeholder="e.g., Python, Machine Learning, Web Development, Finance"
              />
              <p className="text-xs text-gray-500 mt-1">
                Specify areas of expertise to help the AI focus its knowledge
              </p>
            </div>
          </section>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {initialData ? 'Update Persona' : 'Create Persona'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
