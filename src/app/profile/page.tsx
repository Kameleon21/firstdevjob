import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import ProfilePage from '@/components/ProfilePage'

export default async function Profile() {
  const { userId } = await auth()

  if (!userId) {
    redirect('/auth/login?redirect_url=%2Fprofile')
  }

  return <ProfilePage />
}
