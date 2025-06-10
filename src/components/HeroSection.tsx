'use client'

export default function HeroSection() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12 bg-gradient-to-br from-gray-900 via-black to-black rounded-2xl border border-gray-800">
        <h1 className="text-4xl font-bold text-white mb-4">
          Find Your <span className="text-purple-600">Tech</span> Job in <span className="text-purple-600">Ireland</span>
        </h1>
        <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
          No matter if you&apos;re a student searching for an internship, a recent graduate, or a junior developer starting out—FirstDevJob is here to support you. Explore new job opportunities and keep track of your applications as you move forward in your tech career.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => console.log('Post a Job clicked')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Post a Job
          </button>
          <button
            onClick={() => console.log('Sign Up to Track Jobs clicked')}
            className="px-6 py-3 border border-purple-600 text-purple-400 rounded-lg hover:bg-purple-900 transition-colors"
          >
            Sign Up to Track Jobs
          </button>
        </div>
      </div>
    </div>
  );
} 