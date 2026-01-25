"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Persona {
  id: string
  name: string
  icon: string
  description: string
  user_name?: string
}

interface GroupSettingsModalProps {
  groupId: string
  groupName: string
  onClose: () => void
}

export function GroupSettingsModal({
  groupId,
  groupName,
  onClose,
}: GroupSettingsModalProps) {
  const router = useRouter()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [currentPersonaId, setCurrentPersonaId] = useState<string | null>(null)
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [groupId])

  const fetchSettings = async () => {
    try {
      setLoading(true)

      // Fetch group details to get current persona
      const groupRes = await fetch(`/api/groups/${groupId}`)
      if (groupRes.ok) {
        const { group } = await groupRes.json()
        setCurrentPersonaId(group.group_persona_id)
        setSelectedPersonaId(group.group_persona_id)
      }

      // Fetch all personas from group members
      const personasRes = await fetch(`/api/groups/${groupId}/personas`)
      if (personasRes.ok) {
        const { personas: fetchedPersonas } = await personasRes.json()
        setPersonas(fetchedPersonas)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      toast.error('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)

    try {
      console.log('[GroupSettings] Saving with persona ID:', selectedPersonaId)

      const response = await fetch(`/api/groups/${groupId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_persona_id: selectedPersonaId }),
      })

      console.log('[GroupSettings] Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('[GroupSettings] Error response:', errorData)
        throw new Error(errorData.error || 'Failed to update settings')
      }

      const result = await response.json()
      console.log('[GroupSettings] Success:', result)

      toast.success('Group settings updated')
      onClose()
    } catch (error: any) {
      console.error('[GroupSettings] Failed to save settings:', error)
      toast.error(error.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleCreatePersona = () => {
    router.push('/chat?showPersonaBuilder=true')
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">Group Settings</h2>
              <p className="text-sm text-gray-600">{groupName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading...</div>
          ) : (
            <div className="space-y-6">
              {/* oStaran Persona Section */}
              <div>
                <h3 className="text-lg font-semibold mb-2">🤖 oStaran Persona</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select how oStaran should behave in this group. Any member can create and select personas.
                </p>

                {/* Persona Selection */}
                <div className="space-y-2">
                  {/* Default/None Option */}
                  <label className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="persona"
                      checked={selectedPersonaId === null}
                      onChange={() => setSelectedPersonaId(null)}
                      className="mt-1 mr-3"
                    />
                    <div>
                      <p className="font-medium">🎭 Default Behavior</p>
                      <p className="text-sm text-gray-600">
                        Standard oStaran - adapts tone automatically, 100-word limit
                      </p>
                    </div>
                  </label>

                  {/* Available Personas */}
                  {personas.map((persona) => (
                    <label
                      key={persona.id}
                      className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name="persona"
                        checked={selectedPersonaId === persona.id}
                        onChange={() => setSelectedPersonaId(persona.id)}
                        className="mt-1 mr-3"
                      />
                      <div className="flex-1">
                        <p className="font-medium">
                          {persona.icon} {persona.name}
                          {persona.user_name && (
                            <span className="text-xs text-gray-500 ml-2">
                              by {persona.user_name}
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-gray-600">{persona.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Create New Persona Button */}
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-3">
                    💡 Want oStaran to behave differently in this group?
                  </p>
                  <Button onClick={handleCreatePersona} size="sm" variant="secondary">
                    ➕ Create Custom Persona
                  </Button>
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
            onClick={handleSave}
            disabled={saving || selectedPersonaId === currentPersonaId}
            className="flex-1"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  )
}
