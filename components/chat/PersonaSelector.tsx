"use client"

import { useState, useEffect } from 'react'
import { Select } from '@/components/ui/Select'
import { PersonaType, CustomPersona } from '@/types'
import { getAllPersonas } from '@/lib/personas/definitions'
import { CustomPersonaBuilder } from './CustomPersonaBuilder'

interface PersonaSelectorProps {
  value: PersonaType
  customPersonaId?: string | null
  onChange: (persona: PersonaType, customPersonaId?: string | null) => void
  onPersonasChange?: () => void
}

export function PersonaSelector({ value, customPersonaId, onChange, onPersonasChange }: PersonaSelectorProps) {
  const [showBuilder, setShowBuilder] = useState(false)
  const [editingPersona, setEditingPersona] = useState<CustomPersona | undefined>()
  const [customPersonas, setCustomPersonas] = useState<CustomPersona[]>([])
  const [loading, setLoading] = useState(true)

  const builtInPersonas = getAllPersonas()

  // Fetch custom personas
  useEffect(() => {
    fetchCustomPersonas()
  }, [])

  const fetchCustomPersonas = async () => {
    try {
      const response = await fetch('/api/personas/custom')
      if (response.ok) {
        const { personas } = await response.json()
        setCustomPersonas(personas || [])
      }
    } catch (error) {
      console.error('Failed to fetch custom personas:', error)
    } finally {
      setLoading(false)
    }
  }

  // Build options for dropdown
  const options = [
    // Built-in personas
    ...builtInPersonas.map(persona => ({
      value: persona.id,
      label: `${persona.icon} ${persona.name}`,
    })),
    // Custom personas
    ...customPersonas.map(persona => ({
      value: `custom:${persona.id}`,
      label: `${persona.icon} ${persona.name}`,
    })),
    // Create new option
    {
      value: 'create_new',
      label: '➕ Create New Persona',
    },
  ]

  // Current selected value for dropdown
  const currentValue = value === 'custom' && customPersonaId
    ? `custom:${customPersonaId}`
    : value

  const handlePersonaChange = (newValue: string) => {
    if (newValue === 'create_new') {
      setEditingPersona(undefined)
      setShowBuilder(true)
    } else if (newValue.startsWith('custom:')) {
      const personaId = newValue.replace('custom:', '')
      onChange('custom', personaId)
    } else {
      onChange(newValue as PersonaType, null)
    }
  }

  const handleEditPersona = () => {
    if (customPersonaId) {
      const persona = customPersonas.find(p => p.id === customPersonaId)
      if (persona) {
        setEditingPersona(persona)
        setShowBuilder(true)
      }
    }
  }

  const handleSaveCustomPersona = async (personaData: any) => {
    try {
      let response

      if (editingPersona) {
        // Update existing persona
        response = await fetch(`/api/personas/custom/${editingPersona.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(personaData),
        })
      } else {
        // Create new persona
        response = await fetch('/api/personas/custom', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(personaData),
        })
      }

      if (!response.ok) throw new Error('Failed to save custom persona')

      const { persona } = await response.json()

      setShowBuilder(false)
      setEditingPersona(undefined)

      // Refresh custom personas list
      await fetchCustomPersonas()

      // Select the newly created/updated persona
      onChange('custom', persona.id)
      onPersonasChange?.()

      // Show success toast
      if (typeof window !== 'undefined') {
        const toast = (await import('react-hot-toast')).default
        toast.success(editingPersona ? 'Persona updated!' : 'Persona created!')
      }
    } catch (error) {
      console.error('Failed to save custom persona:', error)
      if (typeof window !== 'undefined') {
        const toast = (await import('react-hot-toast')).default
        toast.error('Failed to save persona')
      }
    }
  }

  const handleDeletePersona = async () => {
    if (!customPersonaId) return

    if (!confirm('Are you sure you want to delete this custom persona?')) return

    try {
      const response = await fetch(`/api/personas/custom/${customPersonaId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete persona')

      // Switch to default persona
      onChange('default', null)

      // Refresh list
      await fetchCustomPersonas()
      onPersonasChange?.()

      if (typeof window !== 'undefined') {
        const toast = (await import('react-hot-toast')).default
        toast.success('Persona deleted')
      }
    } catch (error) {
      console.error('Failed to delete persona:', error)
      if (typeof window !== 'undefined') {
        const toast = (await import('react-hot-toast')).default
        toast.error('Failed to delete persona')
      }
    }
  }

  return (
    <div className="relative">
      <Select
        label="Persona"
        value={currentValue}
        onChange={(e) => handlePersonaChange(e.target.value)}
        options={options}
        disabled={loading}
      />

      {value === 'custom' && customPersonaId && (
        <div className="flex gap-1 mt-1">
          <button
            type="button"
            onClick={handleEditPersona}
            className="text-xs text-blue-600 hover:text-blue-700"
            title="Edit persona"
          >
            ⚙️ Edit
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={handleDeletePersona}
            className="text-xs text-red-600 hover:text-red-700"
            title="Delete persona"
          >
            🗑️ Delete
          </button>
        </div>
      )}

      {showBuilder && (
        <CustomPersonaBuilder
          initialData={editingPersona}
          onSave={handleSaveCustomPersona}
          onCancel={() => {
            setShowBuilder(false)
            setEditingPersona(undefined)
          }}
        />
      )}
    </div>
  )
}
