"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import SiteFooter from "@/components/SiteFooter";

type UnsubscribeStatus = "idle" | "success" | "invalid" | "error";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const unsubscribeByToken = useMutation(api.emailSubscriptions.unsubscribeByToken);
  const [status, setStatus] = useState<UnsubscribeStatus>("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = searchParams.get("token")?.trim() ?? "";

  const handleConfirmUnsubscribe = async () => {
    if (isSubmitting) {
      return;
    }

    if (!token) {
      setStatus("invalid");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await unsubscribeByToken({ token });
      setStatus(result.success ? "success" : "invalid");
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background border border-border rounded-xl p-6 sm:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-3">Confirm Unsubscribe</h1>
      <p className="text-sm sm:text-base text-muted-foreground mb-6">
        Confirm that you want to stop receiving approved job notification emails.
      </p>

      {status === "success" && (
        <p className="text-sm sm:text-base text-success mb-6">
          You&apos;ve been unsubscribed from job notification emails.
        </p>
      )}

      {status === "invalid" && (
        <p className="text-sm sm:text-base text-error mb-6">
          This unsubscribe link is invalid or expired.
        </p>
      )}

      {status === "error" && (
        <p className="text-sm sm:text-base text-error mb-6">
          Something went wrong while processing your request. Please try again.
        </p>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <button
          onClick={handleConfirmUnsubscribe}
          disabled={isSubmitting || status === "success"}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm sm:text-base hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Unsubscribing..." : "Confirm Unsubscribe"}
        </button>
        <Link href="/" className="text-sm sm:text-base text-accent hover:underline">
          Back to home
        </Link>
      </div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <Suspense
          fallback={
            <div className="bg-background border border-border rounded-xl p-6 sm:p-8 animate-pulse">
              <div className="h-8 bg-muted rounded w-2/3 mb-3" />
              <div className="h-4 bg-muted rounded w-full mb-6" />
              <div className="h-10 bg-muted rounded w-40" />
            </div>
          }
        >
          <UnsubscribeContent />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
