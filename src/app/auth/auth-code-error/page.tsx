import Link from "next/link";

export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl shadow-xl p-8 max-w-md mx-auto text-center">
        <div className="mb-6">
          <svg className="w-16 h-16 text-error mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-4">
          Authentication Error
        </h1>
        <p className="text-muted-foreground mb-6">
          Sorry, we couldn&apos;t complete your sign-in. This might be due to an expired or invalid authentication code.
        </p>
        <Link
          href="/"
          className="inline-flex px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
} 