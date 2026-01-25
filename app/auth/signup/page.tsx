import { Suspense } from 'react'
import SignupForm from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SignupForm />
    </Suspense>
  )
}
