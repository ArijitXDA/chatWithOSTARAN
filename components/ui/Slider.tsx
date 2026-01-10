import React from 'react'

interface SliderProps {
  label?: string
  min: number
  max: number
  step: number
  value: number
  onChange: (value: number) => void
  showValue?: boolean
}

export function Slider({ 
  label, 
  min, 
  max, 
  step, 
  value, 
  onChange, 
  showValue = true 
}: SliderProps) {
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-center mb-2">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          {showValue && (
            <span className="text-sm text-gray-600">{value.toFixed(1)}</span>
          )}
        </div>
      )}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
