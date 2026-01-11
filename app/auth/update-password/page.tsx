"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({
      password,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push("/auth/login")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md p-6 border border-gray-700 rounded-lg"
      >
        <h1 className="text-2xl font-bold mb-4">Set new password</h1>

        <input
          type="password"
          required
          minLength={6}
          placeholder="New password"
          className="w-full mb-4 px-3 py-2 rounded bg-gray-900 border border-gray-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

        <button
          disabled={loading}
          className="w-full bg-yellow-500 text-black py-2 rounded font-semibold"
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  )
}
