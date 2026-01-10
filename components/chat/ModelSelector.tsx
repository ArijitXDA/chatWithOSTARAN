"use client"

import { useEffect, useState } from 'react'
import { Select } from '@/components/ui/Select'
import { ModelType } from '@/types'

interface ModelSelectorProps {
  value: ModelType
  onChange: (model: ModelType) => void
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [models, setModels] = useState<Array<{
    id: ModelType
    name: string
    available: boolean
  }>>([])

  useEffect(() => {
    fetch('/api/models/available')
      .then(res => res.json())
      .then(data => setModels(data.models))
      .catch(err => console.error('Failed to load models:', err))
  }, [])

  const options = models.map(model => ({
    value: model.id,
    label: model.available ? model.name : `${model.name} (Not configured)`,
    disabled: !model.available,
  }))

  return (
    <Select
      label="AI Model"
      value={value}
      onChange={(e) => onChange(e.target.value as ModelType)}
      options={options}
    />
  )
}
