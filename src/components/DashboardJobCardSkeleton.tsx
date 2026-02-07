"use client";

export default function DashboardJobCardSkeleton() {
  return (
    <div className="bg-background border border-border rounded-xl p-6 shadow-lg animate-pulse">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2 w-2/3">
          <div className="h-5 bg-muted rounded w-full" />
          <div className="h-4 bg-muted rounded w-2/3" />
        </div>
        <div className="h-8 w-24 bg-muted rounded-full" />
      </div>

      <div className="space-y-3 mb-4">
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-1/4" />
      </div>

      <div className="h-16 bg-muted rounded mb-4" />

      <div className="flex justify-between items-center">
        <div className="h-4 bg-muted rounded w-32" />
        <div className="h-9 bg-muted rounded-lg w-36" />
      </div>
    </div>
  );
}
