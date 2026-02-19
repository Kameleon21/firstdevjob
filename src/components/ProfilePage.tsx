"use client";
import React, { useState, useEffect } from "react";
import {
  Mail,
  Edit3,
  Save,
  Shield,
  Trash2,
  Eye,
  EyeOff,
  ArrowLeft,
  Bell,
  User as UserIcon,
  AlertTriangle,
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

type RoleLevel = "intern" | "graduate" | "earlyCareer";

const ROLE_LABELS: Record<RoleLevel, string> = {
  intern: "Intern",
  graduate: "Graduate",
  earlyCareer: "Early Career",
};

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications">("profile");
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
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [roleFilters, setRoleFilters] = useState<RoleLevel[]>([]);
  const [isUpdatingNotifications, setIsUpdatingNotifications] = useState(false);
  const profileResult = useQuery(api.profiles.getUserProfile);
  const notificationSubscription = useQuery(api.emailSubscriptions.getMySubscription);
  const updateUserName = useMutation(api.profiles.updateUserName);
  const deleteAccount = useMutation(api.profiles.deleteAccount);
  const subscribeToNotifications = useMutation(api.emailSubscriptions.subscribe);
  const updateNotificationRoleFilters = useMutation(api.emailSubscriptions.updateRoleFilters);
  const unsubscribeFromNotifications = useMutation(api.emailSubscriptions.unsubscribeFromProfile);
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

  useEffect(() => {
    if (notificationSubscription === undefined) {
      return;
    }

    if (notificationSubscription === null) {
      setNotificationEnabled(false);
      setRoleFilters([]);
      return;
    }

    setNotificationEnabled(notificationSubscription.isActive);
    setRoleFilters(notificationSubscription.roleFilters as RoleLevel[]);
  }, [notificationSubscription]);

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
        message: err instanceof Error ? err.message : "Failed to change password",
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
        message: err instanceof Error ? err.message : "Failed to delete account data",
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
        message: err instanceof Error ? err.message : "Failed to delete account",
        type: "error",
      });
      setIsDeletingAccount(false);
    }
  };

  const handleNotificationsToggle = async (enabled: boolean) => {
    if (isUpdatingNotifications) {
      return;
    }

    setIsUpdatingNotifications(true);

    try {
      if (enabled) {
        await subscribeToNotifications({ roleFilters });
        setNotificationEnabled(true);
        setToast({
          message: "Job email notifications enabled",
          type: "success",
        });
      } else {
        await unsubscribeFromNotifications({});
        setNotificationEnabled(false);
        setToast({
          message: "Job email notifications disabled",
          type: "success",
        });
      }
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to update notification preferences",
        type: "error",
      });
    } finally {
      setIsUpdatingNotifications(false);
    }
  };

  const handleRoleFilterChange = async (role: RoleLevel) => {
    const nextRoleFilters = roleFilters.includes(role)
      ? roleFilters.filter((value) => value !== role)
      : [...roleFilters, role];

    setRoleFilters(nextRoleFilters);

    if (!notificationEnabled) {
      return;
    }

    try {
      await updateNotificationRoleFilters({ roleFilters: nextRoleFilters });
    } catch (err) {
      setRoleFilters(roleFilters);
      setToast({
        message: err instanceof Error ? err.message : "Failed to update role notification filters",
        type: "error",
      });
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
            <h2 className="text-lg sm:text-xl font-semibold text-error mb-2">Error</h2>
            <p className="text-sm sm:text-base text-error">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const initials = getInitials(profile.fullName);

  const tabs = [
    { key: "profile" as const, label: "Profile", icon: UserIcon },
    { key: "security" as const, label: "Security", icon: Shield },
    { key: "notifications" as const, label: "Notifications", icon: Bell },
  ];

  const profileTabContent = (
    <div className="profile-fade-in space-y-4 sm:space-y-6">
      {/* Profile header card with gradient */}
      <div className="relative overflow-hidden rounded-xl border border-border bg-linear-to-br from-primary/5 via-background to-accent/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--primary)_0.6px,transparent_0.6px)] bg-[length:24px_24px] opacity-[0.03]" />
        <div className="relative p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto sm:mx-0 flex-shrink-0 bg-linear-to-br from-primary to-accent text-white font-bold text-xl sm:text-2xl shadow-lg shadow-primary/20">
                {initials}
              </div>
              <div className="text-center sm:text-left sm:ml-6 md:ml-4 lg:ml-4">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
                  {profile.fullName || "No name set"}
                </h2>
                <div className="flex items-center justify-center sm:justify-start text-muted-foreground mt-1">
                  <Mail size={14} className="sm:size-4 mr-2" />
                  <span className="text-sm sm:text-base break-all">{profile.email}</span>
                </div>
                <div className="mt-2 flex justify-center sm:justify-start">
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
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
      </div>

      {/* Edit profile card */}
      {isEditing && (
        <div className="profile-fade-in rounded-xl border border-border bg-background overflow-hidden">
          <div className="h-1 bg-linear-to-r from-primary via-accent to-primary" />
          <div className="p-4 sm:p-6">
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
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 sm:py-3 bg-muted border border-border text-foreground text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary transition-shadow"
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
        </div>
      )}
    </div>
  );

  const securityTabContent = (
    <div className="profile-fade-in space-y-4 sm:space-y-6">
      {/* Change password card */}
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="h-1 bg-linear-to-r from-primary via-accent to-primary" />
        <div className="p-4 sm:p-6">
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
                  className="w-full px-3 py-2 sm:py-3 pr-10 bg-muted border border-border text-foreground text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary transition-shadow"
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
                  className="w-full px-3 py-2 sm:py-3 pr-10 bg-muted border border-border text-foreground text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary transition-shadow"
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
                  className="w-full px-3 py-2 sm:py-3 pr-10 bg-muted border border-border text-foreground text-sm sm:text-base rounded-lg focus:ring-2 focus:ring-primary/40 focus:border-primary transition-shadow"
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
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-error/30 bg-error/[0.03] overflow-hidden">
        <div className="border-l-4 border-error p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-error mb-2">Delete Account</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This action is irreversible. All your data, including tracked applications and profile
            information, will be permanently deleted.
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
    </div>
  );

  const notificationsTabContent = (
    <div className="profile-fade-in space-y-4 sm:space-y-6">
      <div className="rounded-xl border border-border bg-background overflow-hidden">
        <div className="h-1 bg-linear-to-r from-primary via-accent to-primary" />
        <div className="p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
            Job Email Notifications
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Get notified when new jobs are approved.
          </p>

          {/* Toggle switch */}
          <label className="flex items-center justify-between rounded-lg border border-border bg-muted/50 px-4 py-3 gap-4 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-foreground">Enable notifications</p>
              <p className="text-xs text-muted-foreground">
                Receive alerts for new approved roles that match your filters.
              </p>
            </div>
            <span className="relative inline-flex h-6 w-11 flex-shrink-0">
              <input
                type="checkbox"
                checked={notificationEnabled}
                disabled={isUpdatingNotifications || notificationSubscription === undefined}
                onChange={(e) => handleNotificationsToggle(e.target.checked)}
                className="peer sr-only"
              />
              <span className="absolute inset-0 rounded-full bg-border transition-colors duration-200 peer-checked:bg-primary peer-disabled:opacity-50" />
              <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-5" />
            </span>
          </label>

          {/* Role filter chips */}
          {notificationEnabled && (
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-foreground mb-3">Role filters</h4>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(ROLE_LABELS) as RoleLevel[]).map((role) => {
                  const isActive = roleFilters.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleFilterChange(role)}
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                        isActive
                          ? "bg-accent/15 border-accent/40 text-accent"
                          : "bg-muted/50 border-border text-muted-foreground hover:border-accent/30 hover:text-foreground"
                      }`}
                    >
                      {ROLE_LABELS[role]}
                    </button>
                  );
                })}
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Leave all unchecked to receive notifications for all job types.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const deleteConfirmationModal = (
    <div className="profile-modal-in fixed inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="profile-fade-in bg-background rounded-2xl border border-border w-full max-w-md mx-auto p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-error/10">
            <AlertTriangle size={20} className="text-error" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Are you absolutely sure?</h2>
        </div>
        <p className="text-muted-foreground mb-6">
          This action cannot be undone. This will permanently delete your account and all associated
          data.
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
    <>
      <style>{`
        .profile-fade-in {
          animation: profile-fade-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes profile-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .profile-modal-in {
          animation: profile-modal-in 0.2s ease-out both;
        }
        @keyframes profile-modal-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <div className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="mb-4 sm:mb-8">
            <Link href="/" className="flex items-center text-sm text-accent hover:underline mb-4">
              <ArrowLeft size={16} className="mr-1" />
              Back to Jobs
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Profile Settings</h1>
          </div>

          {/* Segmented tab navigation */}
          <div className="inline-flex bg-muted rounded-lg p-1 mb-4 sm:mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base font-medium rounded-md transition-all ${
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon size={16} className="mr-1.5 inline-block" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === "profile"
            ? profileTabContent
            : activeTab === "security"
              ? securityTabContent
              : notificationsTabContent}
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
    </>
  );
};

export default ProfilePage;
