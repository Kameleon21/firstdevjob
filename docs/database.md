# **FirstDevJob - Backend & Database Design Documentation**

**Date:** 6/11/2025
**Author:** T3 Chat
**Project:** FirstDevJob
**Technology Stack:** Next.js, Supabase (PostgreSQL), Tailwind CSS

## 1. Overview

This document outlines the database schema, security model, and data interaction patterns for the FirstDevJob application. The architecture is designed to be secure, scalable, and efficient, leveraging modern database principles and Supabase's features.

The core requirements are:
- Publicly viewable, approved job listings.
- A job submission system with an approval workflow.
- A multi-tiered user role system (User, Moderator, Admin).
- Private, user-specific dashboards for tracking job applications.
- A flexible tagging system for filtering jobs.

## 2. Core Architectural Principles

The design is founded on the following software engineering principles:

-   **Database Normalization:** The schema is designed to reduce data redundancy and improve data integrity. This is most evident in the implementation of a many-to-many relationship for `jobs` and `tags`.
-   **Role-Based Access Control (RBAC):** A formal system of roles (`user`, `moderator`, `admin`) is defined to manage user permissions throughout the application.
-   **Row Level Security (RLS):** RLS is enabled on all tables, enforcing a "default deny" policy. Data access is explicitly granted via security policies, ensuring that users can only access the data they are permitted to see.
-   **Principle of Least Privilege:** Each role is granted only the permissions necessary to perform its functions. For example, moderators can approve jobs but cannot delete them.

## 3. Role-Based Access Control (RBAC) System

A custom PostgreSQL `ENUM` type is used to define the application roles, ensuring data integrity.

```sql
CREATE TYPE app_role AS ENUM ('user', 'moderator', 'admin');
```

-   **`user`**: The default role for any signed-up user. Can view approved jobs, submit new jobs (as pending), and manage their own tracked applications.
-   **`moderator`**: Can do everything a `user` can, plus view pending jobs and approve them.
-   **`admin`**: Has full administrative access. Can manage all jobs, users, and roles.

## 4. Database Schema

The following tables were created to model the application's data.

### 4.1. `profiles` Table
Stores public user data and the user's assigned role. It has a one-to-one relationship with the `auth.users` table.

**SQL Definition:**
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role app_role DEFAULT 'user' NOT NULL
);
```

### 4.2. `jobs` Table
Stores all job listings. A `status` column manages the approval workflow.

**SQL Definition:**
```sql
CREATE TYPE job_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.jobs (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  title TEXT NOT NULL,
  company_name TEXT NOT NULL,
  location TEXT DEFAULT 'Ireland',
  description TEXT,
  apply_url TEXT,
  status job_status DEFAULT 'pending' NOT NULL,
  submitted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);
```

### 4.3. `tags` Table
A lookup table containing all unique tags. This acts as the single source of truth for tags.

**SQL Definition:**
```sql
CREATE TABLE public.tags (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT UNIQUE NOT NULL
);
```

### 4.4. `job_tags` Table
A "join table" that creates the many-to-many relationship between `jobs` and `tags`.

**SQL Definition:**
```sql
CREATE TABLE public.job_tags (
  job_id BIGINT REFERENCES jobs(id) ON DELETE CASCADE,
  tag_id INT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (job_id, tag_id)
);
```

### 4.5. `tracked_applications` Table
Stores user-specific information about jobs they are tracking.

**SQL Definition:**
```sql
CREATE TYPE application_status AS ENUM (
  'saved', 'applied', 'interviewing', 'offer', 'rejected', 'accepted'
);

CREATE TABLE public.tracked_applications (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id BIGINT NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  status application_status DEFAULT 'saved' NOT NULL,
  notes TEXT,
  UNIQUE (user_id, job_id)
);
```

## 5. Security Model: Row Level Security (RLS)

RLS is enabled on all tables. The following helper function and policies enforce the business logic at the database level.

### 5.1. Helper Function: `get_user_role()`
This function retrieves the role of the currently authenticated user, simplifying policy definitions.

```sql
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS app_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;
```

### 5.2. RLS Policies

**`profiles` Table Policies:**
-   **Policy:** "Users can manage their own profile"
    -   **Description:** Allows users to view and edit their own profile information.
    -   **SQL:** `CREATE POLICY "Users can manage their own profile" ON public.profiles FOR ALL USING (auth.uid() = id);`
-   **Policy:** "Admins can manage all profiles"
    -   **Description:** Allows admins to view and edit any user's profile.
    -   **SQL:** `CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL USING (get_user_role() = 'admin');`

**`jobs` Table Policies:**
-   **Policy:** "Public can view approved jobs"
    -   **Description:** Allows anyone (logged in or not) to view jobs with the 'approved' status.
    -   **SQL:** `CREATE POLICY "Public can view approved jobs" ON public.jobs FOR SELECT USING (status = 'approved');`
-   **Policy:** "Anyone can submit a new job"
    -   **Description:** Allows anyone to insert a new job. The job will default to 'pending' status.
    -   **SQL:** `CREATE POLICY "Anyone can submit a new job" ON public.jobs FOR INSERT WITH CHECK (true);`
-   **Policy:** "Mods and Admins can view pending jobs"
    -   **Description:** Allows users with the 'moderator' or 'admin' role to see jobs that are awaiting approval.
    -   **SQL:** `CREATE POLICY "Mods and Admins can view pending jobs" ON public.jobs FOR SELECT USING (get_user_role() IN ('moderator', 'admin'));`
-   **Policy:** "Admins can update or delete any job"
    -   **Description:** Grants full control over all job entries to admins.
    -   **SQL:** `CREATE POLICY "Admins can update or delete any job" ON public.jobs FOR ALL USING (get_user_role() = 'admin');`

**`tracked_applications` Table Policies:**
-   **Policy:** "Users can manage their own tracked applications"
    -   **Description:** Ensures that a user can only view, create, update, or delete their own application tracking entries. This data is completely private.
    -   **SQL:** `CREATE POLICY "Users can manage their own tracked applications" ON public.tracked_applications FOR ALL USING (auth.uid() = user_id);`

**`tags` & `job_tags` Table Policies:**
-   **Policy:** "Tags are publicly viewable"
    -   **Description:** Allows anyone to read the list of tags and their relationships to jobs.
    -   **SQL:** `CREATE POLICY "Tags are publicly viewable" ON public.tags FOR SELECT USING (true);`
    -   **SQL:** `CREATE POLICY "Job tags are publicly viewable" ON public.job_tags FOR SELECT USING (true);`

## 6. Data Interaction Patterns

### 6.1. Adding Tags to a Job
To associate tags with a job, a client-side script first ensures the tags exist in the `tags` table (using `upsert`) and then inserts the links into the `job_tags` table.

**Client-Side JavaScript Example:**
```javascript
async function addTagsToJob(jobId, tagNames) {
  // 1. Upsert tags to ensure they exist and get their IDs
  const { data: tagData } = await supabase
    .from("tags")
    .upsert(tagNames.map((name) => ({ name })))
    .select("id, name");

  // 2. Prepare the links for the join table
  const jobTagLinks = tagData.map((tag) => ({
    job_id: jobId,
    tag_id: tag.id,
  }));

  // 3. Insert the links
  await supabase.from("job_tags").insert(jobTagLinks);
}
```

### 6.2. Fetching Jobs with Their Associated Tags
To display jobs with their tags, a single query is made using Supabase's relational query syntax. This is efficient and returns a perfectly nested JSON object.

**Client-Side JavaScript Example:**
```javascript
async function getApprovedJobsWithTags() {
  const { data, error } = await supabase
    .from("jobs")
    .select(
      `
      id,
      title,
      company_name,
      tags ( id, name )
    `
    )
    .eq("status", "approved");

  return data;
}
```

**Example JSON Response:**
```json
[
  {
    "id": 1,
    "title": "Frontend Developer",
    "company_name": "Tech Corp",
    "tags": [
      { "id": 1, "name": "React" },
      { "id": 2, "name": "TypeScript" }
    ]
  }
]
```