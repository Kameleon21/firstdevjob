"use client";

import { useEffect, useMemo } from "react";
import { SignIn, useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";

const DEFAULT_REDIRECT_URL = "/dashboard";

function sanitizeRedirectUrl(value: string | null): string {
  if (!value) {
    return DEFAULT_REDIRECT_URL;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return DEFAULT_REDIRECT_URL;
  }

  return value;
}

export default function LoginPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirectUrl = useMemo(
    () => sanitizeRedirectUrl(searchParams.get("redirect_url")),
    [searchParams],
  );

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace(redirectUrl);
    }
  }, [isLoaded, isSignedIn, redirectUrl, router]);

  if (isLoaded && isSignedIn) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10">
      <SignIn
        path="/auth/login"
        routing="path"
        forceRedirectUrl={redirectUrl}
        fallbackRedirectUrl={redirectUrl}
      />
    </main>
  );
}
