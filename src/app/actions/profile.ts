'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function getUserProfile() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  try {
    // Query the profiles table to get the user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      return { error: 'Failed to fetch profile' }
    }

    return {
      id: user.id,
      email: user.email,
      full_name: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name,
      role: profile?.role,
    }
  } catch (error) {
    console.error('Error getting user profile:', error)
    return { error: 'Failed to get user profile' }
  }
}

export async function updateUserName(formData: FormData) {
  const supabase = await createClient()
  
  const fullName = formData.get('full_name') as string
  
  if (!fullName || fullName.trim() === '') {
    return { error: 'Name is required' }
  }

  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  try {
    // Update the profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert(
        { id: user.id, full_name: fullName.trim() },
        { onConflict: 'id' }
      )

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return { error: 'Failed to update profile' }
    }

    revalidatePath('/profile')
    return { success: true }
  } catch (error) {
    console.error('Error updating user name:', error)
    return { error: 'Failed to update name' }
  }
}

export async function changePassword(formData: FormData) {
  const supabase = await createClient()
  
  const newPassword = formData.get('new_password') as string
  const confirmPassword = formData.get('confirm_password') as string
  
  if (!newPassword || newPassword.length < 6) {
    return { error: 'Password must be at least 6 characters long' }
  }
  
  if (newPassword !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    })

    if (error) {
      console.error('Error changing password:', error)
      return { error: 'Failed to change password' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error changing password:', error)
    return { error: 'Failed to change password' }
  }
}

export async function deleteAccount() {
  const supabase = await createClient()
  const supabaseService = createServiceClient()
  
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return { error: 'Not authenticated' }
    }

    // Use service role client to delete the user
    // This will cascade delete all related data (profiles, tracked_applications)
    const { error: deleteError } = await supabaseService.auth.admin.deleteUser(user.id)
    
    if (deleteError) {
      console.error('Error deleting account:', deleteError)
      return { error: 'Failed to delete account. Please try again or contact support.' }
    }

    // Sign out and redirect
    await supabase.auth.signOut()
    redirect('/?message=Account successfully deleted')
  } catch (error) {
    console.error('Error during account deletion:', error)
    return { error: 'Failed to delete account' }
  }
} 