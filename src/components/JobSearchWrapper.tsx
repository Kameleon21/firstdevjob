"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "convex/react";
import type { Id } from "../../convex/_generated/dataModel";
import { api } from "../../convex/_generated/api";
import JobSearch from "./JobSearch";
import JobCard from "./JobCard";
import JobCardSkeleton from "./JobCardSkeleton";

type RoleLevel = "intern" | "graduate" | "earlyCareer";
type ApprovedJob = {
  _id: Id<"jobs">;
  _creationTime: number;
  title: string;
  company: string;
  location?: string;
  url?: string;
  status: "pending" | "approved" | "rejected" | "outdated";
  tags?: string[];
  roleLevel?: RoleLevel;
  isBookmarked: boolean;
};

export default function JobSearchWrapper() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedRoleLevel, setSelectedRoleLevel] = useState<RoleLevel | "">(
    "",
  );
  const [selectedLocation, setSelectedLocation] = useState("");

  // Debounce search query for better performance
  const DEBOUNCE_DELAY_MS = 300;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, DEBOUNCE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filterOptions = useQuery(api.jobs.getApprovedJobFilterOptions, {});
  const locationOptions = useMemo(
    () => filterOptions?.locations ?? [],
    [filterOptions?.locations],
  );

  const jobs = useQuery(api.jobs.listApprovedJobs, {
    searchTerm: debouncedSearchQuery.trim() || undefined,
    roleLevel: selectedRoleLevel || undefined,
    location: selectedLocation || undefined,
  });

  const lastResolvedJobsRef = useRef<ApprovedJob[] | null>(null);
  if (jobs !== undefined) {
    lastResolvedJobsRef.current = jobs as ApprovedJob[];
  }

  const isLoading = jobs === undefined;
  const isInitialLoading = isLoading && !lastResolvedJobsRef.current;
  const isRefreshing = isLoading && !!lastResolvedJobsRef.current;
  const error = null as Error | null;
  const filteredJobs =
    (jobs as ApprovedJob[] | undefined) ?? lastResolvedJobsRef.current ?? [];

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedRoleLevel("");
    setSelectedLocation("");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedRoleLevel !== "" ||
    selectedLocation !== "";
  const isSearching = searchQuery !== debouncedSearchQuery || isRefreshing;

  return (
    <div className="space-y-12">
      <JobSearch
        searchQuery={searchQuery}
        selectedRoleLevel={selectedRoleLevel}
        selectedLocation={selectedLocation}
        locationOptions={locationOptions}
        onSearchChange={handleSearchChange}
        onRoleLevelChange={setSelectedRoleLevel}
        onLocationChange={setSelectedLocation}
        onClearFilters={handleClearFilters}
      />

      {/* Results */}
      <div className="relative">
        {/* Subtle loading indicator for search */}
        {(isSearching || isLoading) && (
          <div className="absolute top-0 right-0 z-10">
            <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs flex items-center gap-2">
              <svg
                className="animate-spin h-3 w-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              {isLoading ? "Loading..." : "Searching..."}
            </div>
          </div>
        )}

        {/* Job Count and Filter Status */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-semibold text-foreground">
                {hasActiveFilters ? "Search Results" : "Latest Jobs"}
              </h2>
              <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                {isInitialLoading
                  ? "Loading..."
                  : `${filteredJobs.length} job${filteredJobs.length !== 1 ? "s" : ""}`}
              </span>
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-accent hover:opacity-80 text-sm font-medium transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="text-center py-16">
            <div className="bg-error-background border border-error rounded-2xl shadow-xl p-12 max-w-md mx-auto">
              <div className="mb-6">
                <svg
                  className="w-16 h-16 text-error mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.665-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                Search Error
              </h3>
              <p className="text-muted-foreground text-base mb-6">
                Unable to search jobs. Please try again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex px-6 py-3 bg-error text-error-foreground rounded-lg hover:bg-error/90 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Jobs Grid */}
        {!error && isInitialLoading ? (
          <div
            data-testid="job-skeleton-grid"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8"
          >
            {Array.from({ length: 6 }).map((_, index) => (
              <JobCardSkeleton key={`job-skeleton-${index}`} />
            ))}
          </div>
        ) : !error && filteredJobs.length === 0 ? (
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-foreground mb-4">
                {hasActiveFilters ? "No jobs found" : "No jobs available"}
              </h3>
              <p className="text-muted-foreground text-base mb-6">
                {hasActiveFilters
                  ? "Try adjusting your search terms, role level, or location filters to find more opportunities."
                  : "There are currently no approved jobs available. Check back later for new opportunities!"}
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="inline-flex px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        ) : (
          !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  searchQuery={debouncedSearchQuery}
                  isBookmarked={job.isBookmarked}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
