'use client'

import { Search, X } from 'lucide-react'

interface JobSearchProps {
  searchQuery: string
  selectedTags: string[]
  allTags: string[]
  onSearchChange: (query: string) => void
  onTagToggle: (tag: string) => void
  onClearFilters: () => void
}

export default function JobSearch({
  searchQuery,
  selectedTags,
  allTags,
  onSearchChange,
  onTagToggle,
  onClearFilters
}: JobSearchProps) {
  return (
    <div className="bg-background rounded-xl shadow-lg border border-border p-6">
      <div className="space-y-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            size={20}
          />
          <input
            type="text"
            placeholder="Search jobs, companies, or locations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-muted border border-border text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent placeholder-muted-foreground"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-muted-foreground py-2">
            Filter by tags:
          </span>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagToggle(tag)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                selectedTags.includes(tag)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {tag}
            </button>
          ))}
          {selectedTags.length > 0 && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-error-background/20 text-error border border-error/50 rounded-full hover:bg-error-background/30 hover:border-error transition-colors"
            >
              <X size={14} />
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  )
} 