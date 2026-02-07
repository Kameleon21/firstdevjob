'use client'

import { Search, X } from 'lucide-react'

type RoleLevel = 'intern' | 'graduate' | 'earlyCareer'

interface JobSearchProps {
  searchQuery: string
  selectedRoleLevel: RoleLevel | ''
  selectedLocation: string
  locationOptions: string[]
  onSearchChange: (query: string) => void
  onRoleLevelChange: (roleLevel: RoleLevel | '') => void
  onLocationChange: (location: string) => void
  onClearFilters: () => void
}

const roleLevelOptions: Array<{ value: RoleLevel; label: string }> = [
  { value: 'intern', label: 'Intern' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'earlyCareer', label: 'Early Career' },
]

export default function JobSearch({
  searchQuery,
  selectedRoleLevel,
  selectedLocation,
  locationOptions,
  onSearchChange,
  onRoleLevelChange,
  onLocationChange,
  onClearFilters
}: JobSearchProps) {
  const hasFilterSelection = selectedRoleLevel !== '' || selectedLocation !== ''

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Position Level
            </label>
            <select
              value={selectedRoleLevel}
              onChange={(e) => onRoleLevelChange(e.target.value as RoleLevel | '')}
              className="w-full px-3 py-3 bg-muted border border-border text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="">All levels</option>
              {roleLevelOptions.map((roleLevelOption) => (
                <option key={roleLevelOption.value} value={roleLevelOption.value}>
                  {roleLevelOption.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => onLocationChange(e.target.value)}
              className="w-full px-3 py-3 bg-muted border border-border text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
            >
              <option value="">All locations</option>
              {locationOptions.map((locationOption) => (
                <option key={locationOption} value={locationOption}>
                  {locationOption}
                </option>
              ))}
            </select>
          </div>
        </div>

        {hasFilterSelection && (
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
  )
}
