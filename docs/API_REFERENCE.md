# API Reference - FirstDevJob 📚

This document provides comprehensive documentation for all server actions, database interactions, and API patterns used in FirstDevJob.

## 🏗️ Architecture Overview

FirstDevJob uses **Next.js Server Actions** instead of traditional REST API routes. This provides:
- **Type safety** between client and server
- **Automatic form handling** with progressive enhancement
- **Built-in revalidation** for data consistency
- **Simplified error handling** and loading states

### Data Flow Pattern
```
Client Component → Server Action → Supabase Client → RLS Policy → Database
```

## 🔐 Authentication Actions

### Location: `src/app/auth/actions.ts`

#### `emailLogin(formData: FormData)`
Authenticates user with email and password.

**Parameters:**
- `formData.email` (string) - User's email address
- `formData.password` (string) - User's password

**Returns:** Redirects to home page or auth error

**Usage:**
```tsx
import { emailLogin } from '@/app/auth/actions'

<form action={emailLogin}>
  <input name="email" type="email" required />
  <input name="password" type="password" required />
  <button type="submit">Sign In</button>
</form>
```

#### `emailSignup(formData: FormData)`
Creates new user account with email and password.

**Parameters:**
- `formData.email` (string) - New user's email
- `formData.password` (string) - New user's password

**Returns:** Redirects to email confirmation page

**Usage:**
```tsx
import { emailSignup } from '@/app/auth/actions'

<form action={emailSignup}>
  <input name="email" type="email" required />
  <input name="password" type="password" minLength={6} required />
  <button type="submit">Sign Up</button>
</form>
```

#### `oauthSignIn(provider: 'google' | 'github')`
Initiates OAuth authentication flow.

**Parameters:**
- `provider` ('google' | 'github') - OAuth provider

**Returns:** Redirects to OAuth provider

**Usage:**
```tsx
import { oauthSignIn } from '@/app/auth/actions'

<button onClick={() => oauthSignIn('google')}>
  Sign in with Google
</button>
```

#### `resetPassword(formData: FormData)`
Sends password reset email to user.

**Parameters:**
- `formData.email` (string) - User's email for reset

**Returns:** Redirects with success/error message

#### `signOut()`
Signs out current user and redirects to home page.

**Usage:**
```tsx
import { signOut } from '@/app/auth/actions'

<button onClick={signOut}>Sign Out</button>
```

## 📋 Job Management Actions

### Location: `src/app/actions/jobs.ts`

#### `postJob(formData: PostJobData)`
Submits new job posting for admin approval.

**Interface:**
```typescript
interface PostJobData {
  title: string
  company: string
  location: string
  url: string
  selectedTags: string[]
}
```

**Parameters:**
- `title` (string) - Job title
- `company` (string) - Company name
- `location` (string) - Job location
- `url` (string) - Application URL
- `selectedTags` (string[]) - Array of tag names

**Returns:**
```typescript
{ 
  success: true, 
  message: string 
}
```

**Validation:**
- All fields required and non-empty
- URL must be valid format
- Tags are optional

**Usage:**
```tsx
import { postJob } from '@/app/actions/jobs'

const handleSubmit = async (formData: PostJobData) => {
  try {
    const result = await postJob(formData)
    console.log(result.message)
  } catch (error) {
    console.error('Job posting failed:', error)
  }
}
```

## 🔍 Search Actions

### Location: `src/app/actions/search.ts`

#### `searchJobs(searchQuery?: string, selectedTags?: string[])`
Searches for approved jobs with optional filtering.

**Parameters:**
- `searchQuery` (string, optional) - Text search across title, company, location
- `selectedTags` (string[], optional) - Filter by tag names

**Returns:**
```typescript
Job[] // Array of job objects
```

**Job Interface:**
```typescript
interface Job {
  id: number
  created_at: string
  title: string
  company: string
  location: string
  url: string
  status: 'pending' | 'approved' | 'rejected'
  tags: { id: number; name: string }[]
}
```

**Usage:**
```tsx
import { searchJobs } from '@/app/actions/search'

// Search by text
const jobsWithReact = await searchJobs('React developer')

// Filter by tags
const frontendJobs = await searchJobs('', ['React', 'TypeScript'])

// Combined search
const jobs = await searchJobs('Senior', ['JavaScript'])
```

#### `getAllTags()`
Retrieves all available job tags.

**Returns:**
```typescript
string[] // Array of tag names
```

**Usage:**
```tsx
import { getAllTags } from '@/app/actions/search'

const tags = await getAllTags()
// ['React', 'TypeScript', 'Node.js', ...]
```

## 📊 Bookmark Actions

### Location: `src/app/actions/bookmarks.ts`

#### `toggleBookmark(jobId: number)`
Adds or removes job bookmark for current user.

**Parameters:**
- `jobId` (number) - Job ID to bookmark/unbookmark

**Returns:**
```typescript
{ bookmarked: boolean }
```

**Authentication:** Required - redirects to login if not authenticated

**Usage:**
```tsx
import { toggleBookmark } from '@/app/actions/bookmarks'

const handleBookmark = async (jobId: number) => {
  try {
    const result = await toggleBookmark(jobId)
    setIsBookmarked(result.bookmarked)
  } catch (error) {
    console.error('Bookmark toggle failed:', error)
  }
}
```

#### `getBookmarkStatus(jobId: number)`
Checks if job is bookmarked by current user.

**Parameters:**
- `jobId` (number) - Job ID to check

**Returns:**
```typescript
{ bookmarked: boolean }
```

#### `updateBookmarkStatus(bookmarkId: number, status: string, notes?: string)`
Updates application tracking status and notes.

**Parameters:**
- `bookmarkId` (number) - Bookmark ID
- `status` (string) - New application status
- `notes` (string, optional) - Application notes

**Status Options:**
- `'saved'` - Job saved for later
- `'applied'` - Application submitted
- `'interviewing'` - In interview process
- `'offer'` - Received job offer
- `'rejected'` - Application rejected
- `'accepted'` - Offer accepted

**Returns:**
```typescript
{ success: true }
```

#### `getUserBookmarks()`
Retrieves all bookmarks for current user with job details.

**Returns:**
```typescript
interface Bookmark {
  id: number
  status: string
  notes: string | null
  job: {
    id: number
    title: string
    company: string
    location: string
    url: string
    created_at: string
    tags: { id: number; name: string }[]
  }
}[]
```

## 👑 Admin Actions

### Location: `src/app/actions/admin.ts`

#### `checkUserRole()`
Checks current user's role and permissions.

**Returns:**
```typescript
{
  isAdmin: boolean
  isModerator: boolean
  userEmail?: string
  role?: string
}
```

**Usage:**
```tsx
import { checkUserRole } from '@/app/actions/admin'

const userRole = await checkUserRole()
if (userRole.isModerator) {
  // Show admin interface
}
```

#### `getPendingJobs()`
Retrieves jobs pending admin approval.

**Authorization:** Requires moderator or admin role

**Returns:**
```typescript
PendingJob[] // Same as Job interface
```

**Throws:** Error if user lacks permissions

#### `getPendingJobsCount()`
Gets count of jobs awaiting approval.

**Authorization:** Requires moderator or admin role

**Returns:**
```typescript
number // Count of pending jobs
```

#### `updateJobStatus(jobId: number, status: 'approved' | 'rejected')`
Updates job approval status.

**Parameters:**
- `jobId` (number) - Job ID to update
- `status` ('approved' | 'rejected') - New status

**Authorization:** Requires moderator or admin role

**Returns:**
```typescript
{ success: true }
```

**Side Effects:** Revalidates home page and dashboard

## 👤 Profile Actions

### Location: `src/app/actions/profile.ts`

#### `getUserProfile()`
Retrieves current user's profile information.

**Returns:**
```typescript
{
  id: string
  email: string
  full_name: string | null
  role: string
} | { error: string }
```

#### `updateUserName(formData: FormData)`
Updates user's full name.

**Parameters:**
- `formData.full_name` (string) - New full name

**Returns:**
```typescript
{ success: true } | { error: string }
```

#### `changePassword(formData: FormData)`
Changes user's password.

**Parameters:**
- `formData.new_password` (string) - New password (min 6 chars)
- `formData.confirm_password` (string) - Password confirmation

**Returns:**
```typescript
{ success: true } | { error: string }
```

**Validation:**
- Password must be at least 6 characters
- Passwords must match

#### `deleteAccount()`
Permanently deletes user account and all associated data.

**Returns:** Redirects to home page on success

**Side Effects:**
- Deletes user from auth system
- Cascades to delete profile and tracked applications
- Signs out user

## 🗄️ Database Schema Reference

### Core Tables

#### `profiles`
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role app_role DEFAULT 'user' NOT NULL
);
```

#### `jobs`
```sql
CREATE TABLE public.jobs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT NOT NULL,
  url TEXT NOT NULL,
  status job_status DEFAULT 'pending' NOT NULL
);
```

#### `tags`
```sql
CREATE TABLE public.tags (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT UNIQUE NOT NULL
);
```

#### `job_tags`
```sql
CREATE TABLE public.job_tags (
  job_id BIGINT REFERENCES jobs(id) ON DELETE CASCADE,
  tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (job_id, tag_id)
);
```

#### `tracked_applications`
```sql
CREATE TABLE public.tracked_applications (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id BIGINT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status application_status DEFAULT 'saved' NOT NULL,
  notes TEXT,
  UNIQUE (user_id, job_id)
);
```

### Custom Types

#### `app_role`
```sql
CREATE TYPE app_role AS ENUM ('user', 'moderator', 'admin');
```

#### `job_status`
```sql
CREATE TYPE job_status AS ENUM ('pending', 'approved', 'rejected');
```

#### `application_status`
```sql
CREATE TYPE application_status AS ENUM (
  'saved', 'applied', 'interviewing', 'offer', 'rejected', 'accepted'
);
```

## 🔒 Row Level Security (RLS) Policies

### Key Security Rules

1. **Users can only access their own data** by default
2. **Public can view approved jobs** without authentication
3. **Moderators/Admins can manage pending jobs**
4. **Admins have full system access**

### Policy Examples

#### Public Job Access
```sql
CREATE POLICY "Public can view approved jobs" 
ON jobs FOR SELECT 
USING (status = 'approved');
```

#### User Data Isolation
```sql
CREATE POLICY "Users can manage their own tracked applications" 
ON tracked_applications FOR ALL 
USING (auth.uid() = user_id);
```

#### Role-based Access
```sql
CREATE POLICY "Moderators can view pending jobs" 
ON jobs FOR SELECT 
USING (get_user_role() IN ('moderator', 'admin'));
```

## 🚀 Performance Considerations

### Query Optimization

#### Efficient Job Fetching
```typescript
// ✅ Good - Single query with joins
const { data: jobs } = await supabase
  .from('jobs')
  .select(`
    id, title, company, location, url, created_at,
    job_tags ( tags ( id, name ) )
  `)
  .eq('status', 'approved')
  .order('created_at', { ascending: false })
  .limit(20)
```

#### Avoid N+1 Queries
```typescript
// ❌ Bad - Multiple queries
const jobs = await getJobs()
for (const job of jobs) {
  const tags = await getJobTags(job.id) // N+1 problem
}

// ✅ Good - Single query with relations
const jobsWithTags = await getJobsWithTags()
```

### Caching Strategy

#### Revalidation Patterns
```typescript
// Revalidate specific paths after mutations
await postJob(formData)
revalidatePath('/')          // Home page
revalidatePath('/dashboard') // User dashboard
```

#### Static Generation
- **Job listings** are statically generated with ISR
- **Search results** are client-side filtered for performance
- **User data** is dynamically fetched per request

## 🧪 Testing Patterns

### Server Action Testing
```typescript
// Mock Supabase client for testing
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(),
      select: jest.fn(),
      update: jest.fn(),
    }))
  }))
}))

// Test server action
describe('postJob', () => {
  it('should validate required fields', async () => {
    const formData = new FormData()
    await expect(postJob(formData)).rejects.toThrow('Title is required')
  })
})
```

### RLS Policy Testing
```sql
-- Test user isolation
SELECT * FROM tracked_applications; -- Should only return current user's data

-- Test role-based access
SELECT * FROM jobs WHERE status = 'pending'; -- Should require moderator role
```

## 🚨 Error Handling

### Common Error Patterns

#### Database Errors
```typescript
try {
  const { data, error } = await supabase.from('jobs').insert(jobData)
  if (error) throw error
  return { success: true }
} catch (error) {
  console.error('Database error:', error)
  throw new Error('Failed to create job')
}
```

#### Authentication Errors
```typescript
const { data: { user }, error } = await supabase.auth.getUser()
if (error || !user) {
  redirect('/auth/login?message=Please sign in')
}
```

#### Validation Errors
```typescript
if (!title?.trim()) {
  throw new Error('Title is required')
}

try {
  new URL(url)
} catch {
  throw new Error('Please enter a valid URL')
}
```

### Error Response Format
```typescript
// Success response
{ success: true, data?: any, message?: string }

// Error response (thrown)
throw new Error('Descriptive error message')
```

## 📱 Client Integration

### React Hook Patterns
```tsx
function useJobs(searchQuery: string, tags: string[]) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    searchJobs(searchQuery, tags)
      .then(setJobs)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [searchQuery, tags])

  return { jobs, loading }
}
```

### Form Handling
```tsx
function JobForm() {
  const [pending, setPending] = useState(false)

  return (
    <form action={async (formData) => {
      setPending(true)
      try {
        await postJob(formData)
        // Handle success
      } catch (error) {
        // Handle error
      } finally {
        setPending(false)
      }
    }}>
      <input name="title" required />
      <button type="submit" disabled={pending}>
        {pending ? 'Submitting...' : 'Submit Job'}
      </button>
    </form>
  )
}
```

---

This API reference provides the foundation for understanding and contributing to FirstDevJob's server-side functionality. All actions are type-safe, secure, and follow consistent patterns for maintainability and developer experience. 