"use client"

import { Slider } from '@/components/ui/Slider'

interface TemperatureControlProps {
  value: number
  onChange: (value: number) => void
}

export function TemperatureControl({ value, onChange }: TemperatureControlProps) {
  return (
    <div>
      <Slider
        label="Temperature"
        min={0}
        max={2}
        step={0.1}
        value={value}
        onChange={onChange}
      />
      <p className="text-xs text-gray-500 mt-1">
        Higher values make output more random, lower values more focused
      </p>
    </div>
  )
}
