'use client'

import React, { useState, useEffect } from 'react'
import { User as UserIcon, Mail, Edit3, Save, Shield, Trash2, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getUserProfile, updateUserName, changePassword, deleteAccount } from '@/app/actions/profile'
import Toast from './Toast'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: string
}

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({ full_name: '' })
  const [passwordData, setPasswordData] = useState({
    new_password: '',
    confirm_password: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    new: false,
    confirm: false
  })
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const result = await getUserProfile()
      if (result.error) {
        setError(result.error)
      } else {
        setProfile(result as UserProfile)
        setFormData({ full_name: result.full_name || '' })
      }
    } catch {
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const formDataObj = new FormData()
    formDataObj.append('full_name', formData.full_name)
    
    const result = await updateUserName(formDataObj)
    
    if (result.error) {
      setToast({ message: result.error, type: 'error' })
    } else {
      setToast({ message: 'Name updated successfully', type: 'success' })
      setIsEditing(false)
      loadProfile() // Reload profile to get updated data
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const formDataObj = new FormData()
    formDataObj.append('new_password', passwordData.new_password)
    formDataObj.append('confirm_password', passwordData.confirm_password)
    
    const result = await changePassword(formDataObj)
    
    if (result.error) {
      setToast({ message: result.error, type: 'error' })
    } else {
      setToast({ message: 'Password changed successfully', type: 'success' })
      setPasswordData({ new_password: '', confirm_password: '' })
    }
  }

  const handleDeleteAccount = async () => {
    const result = await deleteAccount()
    
    if (result?.error) {
      setToast({ message: result.error, type: 'error' })
    }
    // If successful, the action will redirect to home page
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-gray-800 rounded w-1/4 mb-6 sm:mb-8"></div>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
              <div className="h-5 sm:h-6 bg-gray-800 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-800 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="bg-red-900 border border-red-700 rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-red-300 mb-2">Error</h2>
            <p className="text-sm sm:text-base text-red-200">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!profile) return null

  const profileTabContent = (
    <div className="space-y-4 sm:space-y-6">
      {/* Profile Header */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-purple-600 rounded-full flex items-center justify-center mx-auto sm:mx-0 flex-shrink-0">
              <UserIcon size={24} className="sm:size-8 text-white" />
            </div>
            <div className="text-center sm:text-left sm:ml-6 md:ml-4 lg:ml-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
                {profile.full_name || 'No name set'}
              </h2>
              <div className="flex items-center justify-center sm:justify-start text-gray-400 mt-1">
                <Mail size={14} className="sm:size-4 mr-2" />
                <span className="text-sm sm:text-base break-all">{profile.email}</span>
              </div>
              <div className="mt-2 flex justify-center sm:justify-start">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900 text-purple-300">
                  {profile.role}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 bg-purple-600 text-white text-sm sm:text-base rounded-lg hover:bg-purple-700 transition-colors w-full sm:w-auto"
          >
            <Edit3 size={16} className="mr-2" />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Edit Profile</h3>
          <form onSubmit={handleUpdateName}>
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full px-3 py-2 sm:py-3 bg-gray-800 border border-gray-700 text-white text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                type="submit"
                className="flex items-center justify-center px-4 py-2 sm:px-6 sm:py-2 bg-purple-600 text-white text-sm sm:text-base rounded-lg hover:bg-purple-700 transition-colors w-full sm:w-auto"
              >
                <Save size={16} className="mr-2" />
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setFormData({ full_name: profile.full_name || '' })
                }}
                className="px-4 py-2 sm:px-6 sm:py-2 border border-gray-600 text-gray-300 text-sm sm:text-base rounded-lg hover:bg-gray-800 transition-colors w-full sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )

  const securityTabContent = (
    <div className="space-y-4 sm:space-y-6">
      {/* Change Password */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold text-white mb-4 sm:mb-6">Change Password</h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                className="w-full px-3 py-2 sm:py-3 pr-10 bg-gray-800 border border-gray-700 text-white text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter new password"
                minLength={6}
                aria-label="New password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
              >
                {showPasswords.new ? <EyeOff size={18} className="sm:size-5" /> : <Eye size={18} className="sm:size-5" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirm_password}
                onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                className="w-full px-3 py-2 sm:py-3 pr-10 bg-gray-800 border border-gray-700 text-white text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Confirm new password"
                minLength={6}
                aria-label="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
              >
                {showPasswords.confirm ? <EyeOff size={18} className="sm:size-5" /> : <Eye size={18} className="sm:size-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            className="flex items-center justify-center px-4 py-2 sm:px-6 sm:py-2 bg-purple-600 text-white text-sm sm:text-base rounded-lg hover:bg-purple-700 transition-colors w-full sm:w-auto"
          >
            <Shield size={16} className="mr-2" />
            Change Password
          </button>
        </form>
      </div>

      {/* Delete Account */}
      <div className="bg-red-900 border border-red-700 rounded-xl p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold text-red-300 mb-4">Danger Zone</h3>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 p-4 bg-red-800 rounded-lg">
          <div className="text-center sm:text-left">
            <h4 className="text-red-200 font-medium text-sm sm:text-base">Delete Account</h4>
            <p className="text-red-300 text-xs sm:text-sm mt-1">
              Permanently delete your account, profile, and all tracked job applications
            </p>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 bg-red-600 text-white text-sm sm:text-base rounded-lg hover:bg-red-700 transition-colors w-full sm:w-auto"
          >
            <Trash2 size={16} className="mr-2" />
            Delete Account
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 sm:p-6 max-w-md w-full">
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-4">Confirm Account Deletion</h3>
            <p className="text-gray-300 text-sm sm:text-base mb-4 sm:mb-6">
              Are you sure you want to delete your account? This action cannot be undone and will permanently delete:
            </p>
            <ul className="text-gray-300 text-sm sm:text-base mb-4 sm:mb-6 list-disc list-inside space-y-1">
              <li>Your profile information</li>
              <li>All tracked job applications</li>
              <li>Your account credentials</li>
              <li>Any other associated data</li>
            </ul>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={handleDeleteAccount}
                className="flex-1 px-4 py-2 bg-red-600 text-white text-sm sm:text-base rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Delete Account
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 text-sm sm:text-base rounded-lg hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="space-y-6 sm:space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link
                href="/"
                className="flex items-center justify-center w-10 h-10 bg-gray-800 bg-opacity-50 hover:bg-opacity-70 rounded-full transition-all duration-200 text-gray-400 hover:text-white"
                title="Back to Jobs"
              >
                <ArrowLeft size={18} className="sm:size-5" />
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Profile Settings</h1>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-gray-800">
            <nav className="flex space-x-6 sm:space-x-8">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'profile'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <UserIcon size={16} className="inline mr-2" />
                Profile
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'security'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
              >
                <Shield size={16} className="inline mr-2" />
                Security
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'profile' && profileTabContent}
          {activeTab === 'security' && securityTabContent}
        </div>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          isVisible={!!toast}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default ProfilePage 