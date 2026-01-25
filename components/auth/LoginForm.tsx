"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get('returnUrl')
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('🔍 Starting login process...')
      console.log('📧 Email:', email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('❌ Login error:', error)
        console.error('Error message:', error.message)
        console.error('Error status:', error.status)
        throw error
      }

      console.log('✅ Login successful!')
      console.log('User ID:', data.user?.id)
      console.log('Session:', data.session ? 'Active' : 'None')

      toast.success('Login successful!')

      // Small delay to ensure session is set
      await new Promise(resolve => setTimeout(resolve, 500))

      // Redirect to returnUrl if provided, otherwise to chat
      const redirectUrl = returnUrl || '/chat'
      router.push(redirectUrl)
      router.refresh()
      
    } catch (error: any) {
      console.error('❌ Caught error:', error)
      console.error('Error type:', typeof error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      
      let errorMessage = 'Failed to login'
      
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.error_description) {
        errorMessage = error.error_description
      } else if (typeof error === 'string') {
        errorMessage = error
      }

      // Specific error messages
      if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password'
      } else if (errorMessage.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email address before logging in'
      } else if (errorMessage.includes('User not found')) {
        errorMessage = 'No account found with this email'
      }

      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">AIwithArijit.com</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your.email@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                Remember me
              </label>
            </div>

            <a href="/auth/reset-password" className="text-sm text-blue-600 hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{' '}
          <a
            href={returnUrl ? `/auth/signup?returnUrl=${encodeURIComponent(returnUrl)}` : '/auth/signup'}
            className="text-blue-600 hover:underline font-medium"
          >
            Sign up
          </a>
        </p>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            💡 <strong>Tip:</strong> After verifying your email, use the same email and password you signed up with to log in.
          </p>
        </div>
      </div>
    </div>
  )
}