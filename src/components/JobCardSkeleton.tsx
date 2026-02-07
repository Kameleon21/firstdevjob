"use client";

export default function JobCardSkeleton() {
  return (
    <div className="bg-background border border-border rounded-xl p-6 shadow-lg animate-pulse">
      <div className="flex justify-between items-start mb-6">
        <div className="h-6 bg-muted rounded w-2/3" />
        <div className="h-5 w-5 bg-muted rounded" />
      </div>

      <div className="space-y-4 mb-6">
        <div className="h-4 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded w-1/3" />
        <div className="h-4 bg-muted rounded w-1/4" />
      </div>

      <div className="flex gap-2 mb-6">
        <div className="h-6 w-16 bg-muted rounded-full" />
        <div className="h-6 w-20 bg-muted rounded-full" />
      </div>

      <div className="h-10 bg-muted rounded-lg w-32" />
    </div>
  );
}
