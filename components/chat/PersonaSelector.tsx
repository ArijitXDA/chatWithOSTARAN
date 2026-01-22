"use client"

import { useState } from 'react'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { PersonaType } from '@/types'
import { getAllPersonas } from '@/lib/personas/definitions'
import { CustomPersonaBuilder } from './CustomPersonaBuilder'

interface PersonaSelectorProps {
  value: PersonaType
  onChange: (persona: PersonaType) => void
  onCustomPersonaCreate?: () => void
}

export function PersonaSelector({ value, onChange, onCustomPersonaCreate }: PersonaSelectorProps) {
  const [showBuilder, setShowBuilder] = useState(false)
  const personas = getAllPersonas()

  const options = [
    ...personas.map(persona => ({
      value: persona.id,
      label: `${persona.icon} ${persona.name}`,
    })),
    {
      value: 'custom',
      label: '🎭 Custom Persona',
    },
  ]

  const handlePersonaChange = (newValue: PersonaType) => {
    if (newValue === 'custom') {
      setShowBuilder(true)
    } else {
      onChange(newValue)
    }
  }

  const handleSaveCustomPersona = async (personaData: any) => {
    try {
      const response = await fetch('/api/personas/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(personaData),
      })

      if (!response.ok) throw new Error('Failed to create custom persona')

      const { persona } = await response.json()

      setShowBuilder(false)
      onChange('custom')
      onCustomPersonaCreate?.()

      // You might want to show a success toast here
      if (typeof window !== 'undefined') {
        const toast = (await import('react-hot-toast')).default
        toast.success('Custom persona created successfully!')
      }
    } catch (error) {
      console.error('Failed to save custom persona:', error)
      if (typeof window !== 'undefined') {
        const toast = (await import('react-hot-toast')).default
        toast.error('Failed to create custom persona')
      }
    }
  }

  return (
    <div className="relative">
      <Select
        label="Persona"
        value={value}
        onChange={(e) => handlePersonaChange(e.target.value as PersonaType)}
        options={options}
      />

      {value === 'custom' && (
        <button
          type="button"
          onClick={() => setShowBuilder(true)}
          className="absolute right-2 top-8 text-xs text-blue-600 hover:text-blue-700"
          title="Edit custom persona"
        >
          ⚙️ Edit
        </button>
      )}

      {showBuilder && (
        <CustomPersonaBuilder
          onSave={handleSaveCustomPersona}
          onCancel={() => {
            setShowBuilder(false)
            if (value === 'custom') {
              onChange('default')
            }
          }}
        />
      )}
    </div>
  )
}
