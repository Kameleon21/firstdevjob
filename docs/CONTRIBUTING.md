# Contributing to FirstDevJob 🤝

Thank you for your interest in contributing to FirstDevJob! This guide will help you understand our development process, coding standards, and how to make meaningful contributions to the project.

## 🚀 Quick Start for Contributors

### 1. Development Environment Setup

Follow the main [README.md](../README.md) setup instructions, then:

```bash
# Clone your fork
git clone https://github.com/yourusername/firstdevjob.git
cd firstdevjob

# Add upstream remote
git remote add upstream https://github.com/originalowner/firstdevjob.git

# Create development branch
git checkout -b feature/your-feature-name
```

### 2. Understanding the Codebase

#### **Key Architectural Patterns**

- **Server Actions** - Replace traditional API routes for data mutations
- **Row Level Security (RLS)** - Database-level security and access control
- **Component Composition** - Modular, reusable React components
- **Type Safety** - Comprehensive TypeScript coverage

#### **Data Flow**

1. **Client** → Server Action → **Supabase** → RLS Policy Check → Database
2. **Database** → Real-time subscription → **Client** update
3. **Authentication** → Middleware → Route protection → Component access

## 📋 Development Workflow

### Branch Strategy

- **`main`** - Production-ready code
- **`develop`** - Integration branch for features
- **`feature/*`** - New features and enhancements
- **`fix/*`** - Bug fixes
- **`docs/*`** - Documentation updates

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

**Examples:**

```bash
feat(auth): add OAuth login with GitHub
fix(search): resolve tag filtering bug
docs(api): update server actions documentation
refactor(components): extract common loading state
```

### Pull Request Process

1. **Before Starting**
   - Check existing issues and PRs to avoid duplication
   - Create or comment on an issue to discuss major changes
   - Ensure you understand the requirements

2. **During Development**
   - Keep commits atomic and well-documented
   - Test your changes thoroughly
   - Update documentation as needed
   - Follow coding standards

3. **Before Submitting**

   ```bash
   # Run linting
   npm run lint

   # Type check
   npx tsc --noEmit

   # Build to check for errors
   npm run build
   ```

4. **PR Template**

   ```markdown
   ## Description

   Brief description of changes

   ## Type of Change

   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing

   - [ ] Tested locally
   - [ ] Added/updated tests
   - [ ] Verified security implications

   ## Checklist

   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Documentation updated
   - [ ] No new linting errors
   ```

## 🏗️ Code Standards

### TypeScript Guidelines

#### **Type Definitions**

```typescript
// ✅ Good - Explicit interfaces
interface Job {
  id: number;
  title: string;
  company: string;
  tags: Tag[];
}

// ❌ Bad - Implicit any
function processJob(job: any) {}

// ✅ Good - Proper typing
function processJob(job: Job): Promise<void> {}
```

#### **Server Actions**

```typescript
// ✅ Good - Proper server action structure
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createJob(formData: FormData) {
  // Input validation
  const title = formData.get("title") as string;
  if (!title?.trim()) {
    throw new Error("Title is required");
  }

  // Database operation
  const supabase = await createClient();
  const { error } = await supabase.from("jobs").insert({ title: title.trim() });

  if (error) throw error;

  // Revalidation
  revalidatePath("/");
  return { success: true };
}
```

#### **Component Patterns**

```typescript
// ✅ Good - Component structure
interface JobCardProps {
  job: Job
  onBookmark?: (id: number) => void
}

export default function JobCard({ job, onBookmark }: JobCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleBookmark = async () => {
    setIsLoading(true)
    try {
      await onBookmark?.(job.id)
    } catch (error) {
      console.error('Bookmark error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="job-card">
      {/* Component JSX */}
    </div>
  )
}
```

### React Best Practices

#### **Hooks Usage**

```typescript
// ✅ Good - Custom hook for auth
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading, isAuthenticated: !!user };
}
```

#### **Error Handling**

```typescript
// ✅ Good - Comprehensive error handling
try {
  const result = await postJob(formData);
  setMessage({ type: "success", text: "Job posted successfully!" });
} catch (error) {
  console.error("Job posting error:", error);
  setMessage({
    type: "error",
    text: error instanceof Error ? error.message : "Unknown error",
  });
}
```

### CSS/Styling Guidelines

#### **Tailwind CSS Patterns**

```tsx
// ✅ Good - Consistent utility patterns
<div className="bg-gray-900 border border-gray-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-200">

// ✅ Good - Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">

// ✅ Good - Component variants
const variants = {
  primary: "bg-purple-600 hover:bg-purple-700 text-white",
  secondary: "bg-gray-800 hover:bg-gray-700 text-gray-300"
}
```

#### **Accessibility Requirements**

```tsx
// ✅ Required - ARIA labels and keyboard navigation
<button
  onClick={handleSubmit}
  disabled={isLoading}
  aria-label="Submit job application"
  className="btn-primary"
>
  {isLoading ? 'Submitting...' : 'Submit'}
</button>

// ✅ Required - Form accessibility
<label htmlFor="job-title" className="block text-sm font-medium">
  Job Title
</label>
<input
  id="job-title"
  type="text"
  required
  aria-describedby="title-help"
  className="form-input"
/>
<p id="title-help" className="text-sm text-gray-500">
  Enter a descriptive job title
</p>
```

## 🗄️ Database Development

### Working with Supabase

#### **RLS Policy Development**

```sql
-- ✅ Good - Specific, secure policies
CREATE POLICY "Users can view their own applications"
ON tracked_applications
FOR SELECT
USING (auth.uid() = user_id);

-- ✅ Good - Role-based access
CREATE POLICY "Moderators can approve jobs"
ON jobs
FOR UPDATE
USING (get_user_role() IN ('moderator', 'admin'))
WITH CHECK (status IN ('approved', 'rejected'));
```

#### **Schema Changes**

- **Always test locally first**
- **Document changes in `docs/database.md`**
- **Consider backward compatibility**
- **Test RLS policies thoroughly**

#### **Query Optimization**

```typescript
// ✅ Good - Efficient query with proper relations
const { data: jobs } = await supabase
  .from("jobs")
  .select(
    `
    id,
    title,
    company,
    location,
    job_tags (
      tags ( id, name )
    )
  `,
  )
  .eq("status", "approved")
  .order("created_at", { ascending: false })
  .limit(20);
```

## 🎯 Feature Development Areas

### High Priority

1. **Search Enhancements**
   - Fuzzy search implementation
   - Saved search functionality
   - Advanced filters (salary, remote, etc.)

2. **Notification System**
   - Email alerts for new jobs
   - Application status updates
   - Admin notification preferences

### Medium Priority

1. **Analytics & Insights**
   - Job view tracking
   - User engagement metrics
   - Application success rates

2. **Company Features**
   - Company profiles
   - Verification system
   - Bulk job posting

3. **User Experience**
   - Dark/light theme toggle
   - Customizable dashboard
   - Export functionality

### Future Enhancements

1. **Integration Features**
   - Calendar integration
   - Resume parsing
   - Social media sharing

2. **Advanced Functionality**
   - AI-powered job matching
   - Interview scheduling
   - Skills assessment

## 🧪 Testing Guidelines

### Manual Testing Checklist

- [ ] **Authentication Flow**
  - Sign up/login with email
  - OAuth providers (Google/GitHub)
  - Password reset functionality
  - Session persistence

- [ ] **Job Management**
  - Job posting submission
  - Admin approval workflow
  - Job search and filtering
  - Bookmark functionality

- [ ] **User Dashboard**
  - Application tracking
  - Status updates
  - Notes functionality
  - Profile management

- [ ] **Responsive Design**
  - Mobile viewport testing
  - Tablet layout verification
  - Desktop experience
  - Touch interactions

### Security Testing

- [ ] **Authorization**
  - RLS policies enforced
  - Role-based access working
  - Data isolation verified
  - Admin functions protected

- [ ] **Input Validation**
  - XSS prevention
  - SQL injection protection
  - File upload security
  - Form validation

## 🚨 Common Pitfalls

### Database Issues

- **Bypassing RLS**: Never use service client for user operations
- **Missing Policies**: Ensure all tables have appropriate RLS policies
- **Query Performance**: Watch for N+1 queries and missing indexes

### Authentication Problems

- **Client/Server Mismatch**: Use correct Supabase client for context
- **Session Handling**: Properly handle auth state changes
- **Middleware Issues**: Ensure middleware doesn't block necessary routes

### UI/UX Concerns

- **Loading States**: Always provide feedback during async operations
- **Error Handling**: Show meaningful error messages to users
- **Accessibility**: Test with keyboard navigation and screen readers

## 📞 Getting Help

### Before Asking for Help

1. **Read existing documentation** thoroughly
2. **Search closed issues** for similar problems
3. **Check Supabase docs** for database/auth questions
4. **Review existing code** for patterns and examples

### Where to Get Help

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - Questions and general discussion
- **Code Comments** - Inline documentation and examples
- **Database Documentation** - `docs/database.md` for schema questions

### Providing Context

When asking for help, include:

- **Clear problem description**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Relevant code snippets**
- **Environment details** (Node version, browser, etc.)

---

## 🎉 Recognition

Contributors will be recognized through:

- **GitHub contributors list**
- **Release notes mentions**
- **Community showcases**
- **Maintainer recommendations**

Thank you for contributing to FirstDevJob and helping developers find their first opportunities in tech! 🚀
