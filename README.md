# FirstDevJob 🚀

> **A modern job board platform connecting developers with their first opportunities in tech**

[![Next.js](https://img.shields.io/badge/Next.js-15+-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

FirstDevJob is an open-source job board specifically designed for developers seeking their first role in tech. Built with modern web technologies, it provides a streamlined experience for job seekers to discover opportunities and track their applications, while enabling companies to post entry-level positions.

## ✨ Features

### 🔍 **Job Discovery**
- **Advanced Search**: Search by title, company, location with real-time filtering
- **Tag-based Filtering**: Filter jobs by technology stacks and skills

### 👤 **User Management**
- **Multiple Auth Methods**: Email/password and OAuth (Google, GitHub)
- **Role-based Access**: User, Moderator, and Admin roles
- **Profile Management**: Update personal information and change passwords

### 📊 **Application Tracking**
- **Personal Dashboard**: Private space to track job applications
- **Status Management**: Track application progress (saved, applied, interviewing, etc.)
- **Notes System**: Add personal notes to each tracked job

### 🛡️ **Admin & Moderation**
- **Job Approval Workflow**: All job posts require admin/moderator approval
- **Pending Jobs Dashboard**: Dedicated interface for reviewing submissions
- **User Role Management**: Admin controls for user permissions

### 🏢 **Job Posting**
- **Community-driven**: Anyone can submit job postings
- **Tag Association**: Categorize jobs with relevant technology tags
- **Approval Process**: Quality control through moderation

## 🛠️ Tech Stack

### **Frontend**
- **[Next.js 15+](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - Latest React with concurrent features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe development
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Lucide React](https://lucide.dev/)** - Beautiful, customizable icons

### **Backend & Database**
- **[Supabase](https://supabase.com/)** - PostgreSQL database with real-time features
- **Row Level Security (RLS)** - Database-level access control
- **Supabase Auth** - Authentication and user management
- **Server Actions** - Type-safe server-side operations

### **Development & Deployment**
- **[Vercel](https://vercel.com/)** - Deployment platform
- **ESLint** - Code linting and style enforcement
- **PostCSS** - CSS processing

## 🚀 Getting Started

### Prerequisites

- **Node.js 18+** and npm/yarn/pnpm
- **Supabase account** for database and authentication
- **Git** for version control

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/firstdevjob.git
cd firstdevjob
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Deployment Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_VERCEL_URL=your_vercel_url_if_deploying
```

### 4. Database Setup

The database schema and security policies are documented in [`docs/database.md`](./docs/database.md). You'll need to:

1. **Create a new Supabase project**
2. **Run the SQL commands** from the database documentation to set up:
   - Tables (`profiles`, `jobs`, `tags`, `job_tags`, `tracked_applications`)
   - Custom types (`app_role`, `job_status`, `application_status`)
   - Row Level Security policies
   - Helper functions

3. **Configure Authentication Providers** (optional):
   - Go to Authentication > Providers in your Supabase dashboard
   - Enable Google and/or GitHub OAuth if desired

### 5. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### 6. Default Admin Setup

To create your first admin user:

1. Sign up through the application
2. In your Supabase dashboard, go to Authentication > Users
3. Find your user and note the UUID
4. In the SQL Editor, run:
   ```sql
   INSERT INTO public.profiles (id, full_name, role) 
   VALUES ('your-user-uuid-here', 'Your Name', 'admin')
   ON CONFLICT (id) 
   DO UPDATE SET role = 'admin';
   ```

## 📁 Project Structure

```
firstdevjob/
├── docs/                          # Documentation
│   └── database.md               # Database schema and RLS policies
├── public/                       # Static assets
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── actions/             # Server Actions
│   │   │   ├── admin.ts         # Admin/moderator operations
│   │   │   ├── bookmarks.ts     # Job bookmarking system
│   │   │   ├── jobs.ts          # Job posting operations
│   │   │   ├── profile.ts       # User profile management
│   │   │   └── search.ts        # Job search functionality
│   │   ├── auth/                # Authentication pages
│   │   ├── dashboard/           # User dashboard
│   │   ├── profile/             # Profile management
│   │   └── layout.tsx           # Root layout
│   ├── components/              # React components
│   │   ├── AdminSection.tsx     # Admin job approval interface
│   │   ├── AuthModal.tsx        # Login/signup modal
│   │   ├── JobCard.tsx          # Individual job display
│   │   ├── JobSearch.tsx        # Search and filter interface
│   │   └── ...                  # Other components
│   ├── hooks/                   # Custom React hooks
│   │   └── useAuth.ts           # Authentication hook
│   ├── lib/                     # Utility libraries
│   │   ├── supabase/            # Supabase clients
│   │   │   ├── client.ts        # Browser client
│   │   │   ├── server.ts        # Server client
│   │   │   └── service.ts       # Service role client
│   │   └── textHighlight.ts     # Search highlighting
│   └── middleware.ts            # Next.js middleware for auth
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

## 🎯 Key Components

### **Server Actions** (`src/app/actions/`)
- **Type-safe server operations** replacing traditional API routes
- **Automatic form handling** with progressive enhancement
- **Built-in revalidation** for data consistency

### **Database Integration** (`src/lib/supabase/`)
- **Three client types**:
  - `client.ts` - Browser-side operations
  - `server.ts` - Server-side with auth context
  - `service.ts` - Admin operations bypassing RLS

### **Authentication Flow**
- **Middleware-based auth** handling session management
- **OAuth integration** with Google and GitHub
- **Role-based routing** and component access

### **Real-time Features**
- **Automatic data synchronization** through Supabase
- **Optimistic updates** for better user experience
- **Real-time job status updates** for admins

## 🤝 Contributing

We welcome contributions from developers of all experience levels! Here's how you can help:

### **Getting Started**
1. **Fork the repository** and create a feature branch
2. **Set up your development environment** following the setup guide above
3. **Read the database documentation** in `docs/database.md`
4. **Check existing issues** or create new ones for bugs/features

### **Development Guidelines**

#### **Code Style**
- **TypeScript everywhere** - No implicit `any` types
- **ESLint configuration** - Run `npm run lint` before committing
- **Component structure** - Follow existing patterns for consistency
- **Server Actions** - Prefer over API routes for data mutations

#### **Database Changes**
- **Never modify RLS policies** without discussion
- **Test security policies** thoroughly
- **Document schema changes** in `docs/database.md`
- **Use migrations** for database structure changes

#### **UI/UX Guidelines**
- **Mobile-first design** - Ensure responsive behavior
- **Accessibility** - Include proper ARIA labels and keyboard navigation
- **Consistent styling** - Follow existing Tailwind patterns
- **Loading states** - Provide feedback for async operations

### **Areas Needing Contributions**

#### **🔧 Backend/Database**
- **Advanced search features** (fuzzy search, saved searches)
- **Email notification system** for new jobs
- **Analytics and metrics** for admins
- **API rate limiting** and abuse prevention

#### **🎨 Frontend/UI**
- **Enhanced mobile experience** improvements
- **Dark/light theme** toggle implementation
- **Advanced filtering UI** (salary ranges, remote options)
- **Job application deadlines** and reminders

#### **🚀 Features**
- **Company profiles** and verification system
- **Job alerts** and notification preferences
- **Resume upload** and parsing
- **Interview scheduling** integration

#### **🧪 Testing & Quality**
- **Unit tests** for server actions
- **Integration tests** for auth flows
- **E2E tests** for critical user journeys
- **Performance optimization** and monitoring

### **Submission Process**
1. **Create descriptive commits** with clear messages
2. **Update documentation** if you change functionality
3. **Test your changes** thoroughly
4. **Open a detailed PR** with description of changes
5. **Respond to feedback** promptly and professionally

## 🔐 Security Considerations

### **Row Level Security (RLS)**
- All database access is controlled by **PostgreSQL RLS policies**
- **Users can only access their own data** by default
- **Admins and moderators** have elevated permissions through role-based policies

### **Authentication Security**
- **Server-side session validation** on every request
- **Secure cookie handling** through Supabase Auth
- **OAuth provider security** with proper redirect URL validation

### **Data Privacy**
- **User applications are private** and not shared between users
- **Admin actions are logged** for audit purposes
- **Personal data is encrypted** in transit and at rest

## 🚀 Deployment

### **Vercel (Recommended)**

1. **Connect your GitHub repository** to Vercel
2. **Add environment variables** in the Vercel dashboard:
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   NEXT_PUBLIC_SITE_URL
   ```
3. **Deploy** - Vercel will automatically build and deploy

### **Other Platforms**

The application can be deployed to any platform supporting Next.js:
- **Netlify** with Next.js adapter
- **Railway** for full-stack deployment
- **Docker** using the provided configuration
- **Self-hosted** with Node.js

### **Database Considerations**
- **Supabase handles** database hosting and management
- **Automatic backups** and point-in-time recovery
- **Built-in CDN** for global performance
- **Real-time subscriptions** for live updates

## 📊 Performance

### **Optimization Features**
- **Static generation** for public job listings
- **Incremental Static Regeneration** for dynamic content
- **Image optimization** through Next.js Image component
- **Code splitting** and lazy loading
- **Database query optimization** with proper indexing

### **Monitoring**
- **Vercel Analytics** for performance insights
- **Supabase Dashboard** for database performance
- **Real User Monitoring** through Web Vitals
- **Error tracking** with proper error boundaries

## 🧪 Testing

```bash
# Run linting
npm run lint

# Run type checking
npx tsc --noEmit

# Build for production (tests build process)
npm run build
```

## 📚 Learning Resources

### **For Contributors New to the Stack**
- **[Next.js Documentation](https://nextjs.org/docs)** - Official Next.js guide
- **[Supabase Documentation](https://supabase.com/docs)** - Database and auth
- **[Tailwind CSS Docs](https://tailwindcss.com/docs)** - Styling framework
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)** - Type system

### **Project-Specific Concepts**
- **[Server Actions Guide](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)** - Modern data mutations
- **[Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)** - Database security
- **[React 19 Features](https://react.dev/blog/2024/04/25/react-19)** - Latest React capabilities

## 🆘 Support

### **Getting Help**
- **Issues**: Report bugs or request features via GitHub Issues
- **Discussions**: Ask questions in GitHub Discussions
- **Documentation**: Check `docs/` folder for detailed guides
- **Code Examples**: Look at existing components for patterns

### **Common Issues**
- **Environment Variables**: Ensure all required variables are set
- **Database Connection**: Verify Supabase project URL and keys
- **Authentication**: Check OAuth provider configuration
- **Permissions**: Verify RLS policies for data access issues

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Supabase** for providing an excellent backend-as-a-service platform
- **Vercel** for seamless deployment and hosting
- **Next.js team** for the amazing React framework
- **All contributors** who help make this project better

---

**Ready to contribute?** Check out our [open issues](https://github.com/yourusername/firstdevjob/issues) and join the community of developers helping others find their first tech job! 🚀
