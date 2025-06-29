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
    <div className="bg-gray-900 rounded-xl shadow-lg border border-gray-800 p-6">
      <div className="space-y-4">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Search jobs, companies, or locations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400"
          />
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-300 py-2">
            Filter by tags:
          </span>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => onTagToggle(tag)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                selectedTags.includes(tag)
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {tag}
            </button>
          ))}
          {selectedTags.length > 0 && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-red-900/20 text-red-400 border border-red-700/50 rounded-full hover:bg-red-900/30 hover:border-red-600 transition-colors"
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