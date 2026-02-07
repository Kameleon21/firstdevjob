"use client";
import React, { useState, useEffect } from "react";
import {
  User as UserIcon,
  Mail,
  Edit3,
  Save,
  Shield,
  Trash2,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { api } from "../../convex/_generated/api";
import Toast from "./Toast";
import SiteFooter from "./SiteFooter";

interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
}

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ fullName: "" });
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const profileResult = useQuery(api.profiles.getUserProfile);
  const updateUserName = useMutation(api.profiles.updateUserName);
  const deleteAccount = useMutation(api.profiles.deleteAccount);
  const router = useRouter();
  const { user, isLoaded } = useUser();

  useEffect(() => {
    if (!profileResult) {
      return;
    }

    if ("error" in profileResult) {
      setError(profileResult.error ?? "Failed to load profile");
      setLoading(false);
      return;
    }

    setProfile(profileResult as UserProfile);
    setFormData({ fullName: profileResult.fullName || "" });
    setError(null);
    setLoading(false);
  }, [profileResult]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await updateUserName({ fullName: formData.fullName });

    if (result?.error) {
      setToast({ message: result.error, type: "error" });
      return;
    }

    setToast({ message: "Name updated successfully", type: "success" });
    setIsEditing(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isLoaded || !user) {
      setToast({
        message: "Please sign in to update your password",
        type: "error",
      });
      return;
    }

    if (!passwordData.current_password) {
      setToast({ message: "Current password is required", type: "error" });
      return;
    }

    if (!passwordData.new_password || passwordData.new_password.length < 6) {
      setToast({
        message: "Password must be at least 6 characters long",
        type: "error",
      });
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setToast({ message: "Passwords do not match", type: "error" });
      return;
    }

    try {
      await user.updatePassword({
        currentPassword: passwordData.current_password,
        newPassword: passwordData.new_password,
      });
      setToast({ message: "Password changed successfully", type: "success" });
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    } catch (err) {
      setToast({
        message:
          err instanceof Error ? err.message : "Failed to change password",
        type: "error",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!isLoaded || !user) {
      setToast({
        message: "Please sign in to delete your account",
        type: "error",
      });
      return;
    }

    if (isDeletingAccount) {
      return;
    }

    setIsDeletingAccount(true);

    try {
      const result = await deleteAccount();
      if (!result?.success) {
        throw new Error("Failed to delete account data");
      }
    } catch (err) {
      setToast({
        message:
          err instanceof Error ? err.message : "Failed to delete account data",
        type: "error",
      });
      setIsDeletingAccount(false);
      return;
    }

    try {
      await user.delete();
      sessionStorage.setItem(
        "pendingToast",
        JSON.stringify({
          message: "Account successfully deleted",
          type: "success",
        }),
      );
      router.replace("/");
    } catch (err) {
      setToast({
        message:
          err instanceof Error ? err.message : "Failed to delete account",
        type: "error",
      });
      setIsDeletingAccount(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-muted rounded w-1/4 mb-6 sm:mb-8"></div>
            <div className="bg-background border border-border rounded-xl p-4 sm:p-6">
              <div className="h-5 sm:h-6 bg-muted rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="bg-error-background border border-error rounded-xl p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-error mb-2">
              Error
            </h2>
            <p className="text-sm sm:text-base text-error">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const profileTabContent = (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-background border border-border rounded-xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary rounded-full flex items-center justify-center mx-auto sm:mx-0 flex-shrink-0">
              <UserIcon
                size={24}
                className="sm:size-8 text-primary-foreground"
              />
            </div>
            <div className="text-center sm:text-left sm:ml-6 md:ml-4 lg:ml-4">
              <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
                {profile.fullName || "No name set"}
              </h2>
              <div className="flex items-center justify-center sm:justify-start text-muted-foreground mt-1">
                <Mail size={14} className="sm:size-4 mr-2" />
                <span className="text-sm sm:text-base break-all">
                  {profile.email}
                </span>
              </div>
              <div className="mt-2 flex justify-center sm:justify-start">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                  {profile.role}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center justify-center px-3 py-2 sm:px-4 sm:py-2 bg-primary text-primary-foreground text-sm sm:text-base rounded-lg hover:bg-primary-hover transition-colors w-full sm:w-auto"
          >
            <Edit3 size={16} className="mr-2" />
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="bg-background border border-border rounded-xl p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6">
            Edit Profile
          </h3>
          <form onSubmit={handleUpdateName}>
            <div className="mb-4 sm:mb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                className="w-full px-3 py-2 sm:py-3 bg-muted border border-border text-foreground text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                type="submit"
                className="flex items-center justify-center px-4 py-2 sm:px-6 sm:py-2 bg-primary text-primary-foreground text-sm sm:text-base rounded-lg hover:bg-primary-hover transition-colors w-full sm:w-auto"
              >
                <Save size={16} className="mr-2" />
                Save Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setFormData({ fullName: profile.fullName || "" });
                }}
                className="px-4 py-2 sm:px-6 sm:py-2 border border-border text-muted-foreground text-sm sm:text-base rounded-lg hover:bg-muted transition-colors w-full sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );

  const securityTabContent = (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-background border border-border rounded-xl p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4 sm:mb-6">
          Change Password
        </h3>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                value={passwordData.current_password}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    current_password: e.target.value,
                  })
                }
                className="w-full px-3 py-2 sm:py-3 pr-10 bg-muted border border-border text-foreground text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Enter current password"
                aria-label="Current password"
                required
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    current: !showPasswords.current,
                  })
                }
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
              >
                {showPasswords.current ? (
                  <EyeOff size={18} className="sm:size-5" />
                ) : (
                  <Eye size={18} className="sm:size-5" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                value={passwordData.new_password}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    new_password: e.target.value,
                  })
                }
                className="w-full px-3 py-2 sm:py-3 pr-10 bg-muted border border-border text-foreground text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Enter new password"
                minLength={6}
                aria-label="New password"
                required
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    new: !showPasswords.new,
                  })
                }
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
              >
                {showPasswords.new ? (
                  <EyeOff size={18} className="sm:size-5" />
                ) : (
                  <Eye size={18} className="sm:size-5" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                value={passwordData.confirm_password}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirm_password: e.target.value,
                  })
                }
                className="w-full px-3 py-2 sm:py-3 pr-10 bg-muted border border-border text-foreground text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                placeholder="Confirm new password"
                minLength={6}
                aria-label="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords({
                    ...showPasswords,
                    confirm: !showPasswords.confirm,
                  })
                }
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
              >
                {showPasswords.confirm ? (
                  <EyeOff size={18} className="sm:size-5" />
                ) : (
                  <Eye size={18} className="sm:size-5" />
                )}
              </button>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center justify-center px-4 py-2 sm:px-6 sm:py-2 bg-primary text-primary-foreground text-sm sm:text-base rounded-lg hover:bg-primary-hover transition-colors"
            >
              <Save size={16} className="mr-2" />
              Update Password
            </button>
          </div>
        </form>
      </div>

      <div className="bg-background border border-error/30 rounded-xl p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-semibold text-error mb-2">
          Delete Account
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          This action is irreversible. All your data, including tracked
          applications and profile information, will be permanently deleted.
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-4 py-2 bg-error text-error-foreground text-sm rounded-lg hover:bg-error/90 transition-colors"
        >
          <Trash2 size={16} className="mr-2 inline-block" />
          Delete My Account
        </button>
      </div>
    </div>
  );

  const deleteConfirmationModal = (
    <div className="fixed inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl border border-border w-full max-w-md mx-auto p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">
          Are you absolutely sure?
        </h2>
        <p className="text-muted-foreground mb-6">
          This action cannot be undone. This will permanently delete your
          account and all associated data.
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            disabled={isDeletingAccount}
            className="px-6 py-2 border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={isDeletingAccount}
            className="px-6 py-2 bg-error text-error-foreground rounded-lg hover:bg-error/90 transition-colors"
          >
            {isDeletingAccount ? "Deleting..." : "Yes, delete my account"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <Link
            href="/"
            className="flex items-center text-sm text-accent hover:underline mb-4"
          >
            <ArrowLeft size={16} className="mr-1" />
            Back to Jobs
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Profile Settings
          </h1>
        </div>

        <div className="flex border-b border-border mb-4 sm:mb-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base font-medium transition-colors ${
              activeTab === "profile"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <UserIcon size={16} className="mr-2 inline-block" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base font-medium transition-colors ${
              activeTab === "security"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield size={16} className="mr-2 inline-block" />
            Security
          </button>
        </div>

        {activeTab === "profile" ? profileTabContent : securityTabContent}
      </div>
      <SiteFooter />

      <Toast
        message={toast?.message || ""}
        type={toast?.type || "success"}
        isVisible={!!toast}
        onClose={() => setToast(null)}
      />

      {showDeleteConfirm && deleteConfirmationModal}
    </div>
  );
};

export default ProfilePage;
