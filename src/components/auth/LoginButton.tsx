'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

export function LoginButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return <button className="px-4 py-2 text-gray-500">Loading...</button>
  }

  if (user) {
    return (
      <button 
        onClick={handleSignOut}
        className="px-4 py-2 bg-red-500 text-white rounded text-sm"
      >
        Sign out ({user.email})
      </button>
    )
  }

  return (
    <button 
      onClick={handleSignIn}
      className="px-4 py-2 bg-blue-500 text-white rounded text-sm"
    >
      Sign in with GitHub
    </button>
  )
}