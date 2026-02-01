"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import Header from "@/components/Header";
import DashboardJobCard from "@/components/DashboardJobCard";
import AdminSection from "@/components/AdminSection";
import PostJobModal from "@/components/PostJobModal";
import Toast from "@/components/Toast";
import { api } from "../../../convex/_generated/api";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const data = useQuery(api.dashboard.getDashboardData);
  const isLoading = authLoading || data === undefined;

  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const handleOpenPostJobModal = () => {
    setIsPostJobModalOpen(true);
  };

  const handleClosePostJobModal = () => {
    setIsPostJobModalOpen(false);
  };

  const handleJobPostSuccess = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/auth/login?message=Please sign in to view your dashboard");
    }
  }, [authLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mb-4"></div>
            <div className="h-4 bg-muted rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="h-64 bg-muted rounded-xl"></div>
              <div className="h-64 bg-muted rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  const { bookmarks, userRole, pendingJobs, allTags } = data;

  return (
    <div className="min-h-screen bg-background">
      <Header onPostJobClick={handleOpenPostJobModal} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Your Dashboard
          </h1>
          <p className="text-muted-foreground">
            Track your job applications and update their status as you progress
            through the hiring process.
          </p>
        </div>

        {/* Admin Section for moderators/admins */}
        <AdminSection pendingJobs={pendingJobs} userRole={userRole} />

        {bookmarks.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-background border border-border rounded-2xl shadow-xl p-12 max-w-md mx-auto">
              <div className="mb-6">
                <svg
                  className="w-16 h-16 text-accent mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                No Bookmarked Jobs
              </h3>
              <p className="text-muted-foreground text-base mb-6">
                Start bookmarking jobs you&apos;re interested in to track your
                application progress here.
              </p>
              <Link
                href="/"
                className="inline-flex px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
              >
                Browse Jobs
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Tracked Applications
              </h2>
              <p className="text-muted-foreground text-sm">
                You have {bookmarks.length} job
                {bookmarks.length !== 1 ? "s" : ""} in your tracker
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {bookmarks.map((bookmark) => (
                <DashboardJobCard key={bookmark.id} bookmark={bookmark} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Post Job Modal */}
      <PostJobModal
        isOpen={isPostJobModalOpen}
        onClose={handleClosePostJobModal}
        allTags={allTags}
        onSuccess={handleJobPostSuccess}
      />

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        type="success"
        isVisible={showToast}
        onClose={() => setShowToast(false)}
        duration={8000}
      />
    </div>
  );
}
