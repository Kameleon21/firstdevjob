import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfilePage from '@/components/ProfilePage'

export default async function Profile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return <ProfilePage />
} 