"use client"

import { Select } from '@/components/ui/Select'
import { PersonaType } from '@/types'
import { getAllPersonas } from '@/lib/personas/definitions'

interface PersonaSelectorProps {
  value: PersonaType
  onChange: (persona: PersonaType) => void
}

export function PersonaSelector({ value, onChange }: PersonaSelectorProps) {
  const personas = getAllPersonas()

  const options = personas.map(persona => ({
    value: persona.id,
    label: `${persona.icon} ${persona.name}`,
  }))

  return (
    <Select
      label="Persona"
      value={value}
      onChange={(e) => onChange(e.target.value as PersonaType)}
      options={options}
    />
  )
}
