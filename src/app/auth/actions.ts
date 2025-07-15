'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Utility function to get the correct site URL with proper fallback logic
function getSiteURL(): string {
  // Helper function to check if a value is valid (not empty or whitespace-only)
  const isValidUrl = (value: string | undefined): boolean => {
    return value != null && value.trim().length > 0
  }
  
  let url =
    (isValidUrl(process?.env?.NEXT_PUBLIC_SITE_URL) ? process.env.NEXT_PUBLIC_SITE_URL : null) ??
    (isValidUrl(process?.env?.NEXT_PUBLIC_VERCEL_URL) ? process.env.NEXT_PUBLIC_VERCEL_URL : null) ??
    'http://localhost:3000/'
  
  // Make sure to include `https://` when not localhost.
  url = url.startsWith('http') ? url : `https://${url}`
  
  // Make sure to include a trailing `/`.
  url = url.endsWith('/') ? url : `${url}/`
  
  return url
}

export async function emailLogin(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/auth/login?message=Could not authenticate user')
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function emailSignup(formData: FormData) {
  const supabase = await createClient()

  // type-casting here for convenience
  // in practice, you should validate your inputs
  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    redirect('/auth/login?message=Error signing up user')
  }

  revalidatePath('/', 'layout')
  redirect('/auth/login?message=Check email to continue sign in process')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteURL()}auth/reset-password`,
  })

  if (error) {
    redirect('/auth/login?message=Error sending reset email')
  }

  redirect('/auth/login?message=Check your email for reset instructions')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function oauthSignIn(provider: 'google' | 'github') {
  const supabase = await createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${getSiteURL()}auth/callback`,
    },
  })

  if (error) {
    redirect('/auth/login?message=Error with OAuth provider')
  }

  if (data.url) {
    redirect(data.url) // use the redirect API for your server framework
  }
} 