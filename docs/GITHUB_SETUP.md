# GitHub Repository Setup for CI/CD

## 🔧 Quick Setup Checklist

### 1. Enable GitHub Actions
- Go to **Settings** → **Actions** → **General**
- Select **"Allow all actions and reusable workflows"**

### 2. Set Up Branch Protection Rules
- Go to **Settings** → **Branches** → **Add rule**
- Branch name pattern: `main`
- Enable these settings:
  - ✅ **Require status checks to pass before merging**
  - ✅ **Require branches to be up to date before merging**
  - ✅ **Require pull request reviews before merging**
  - ✅ **Dismiss stale PR approvals when new commits are pushed**
  - ✅ **Include administrators**

### 3. Required Status Checks
Add these status checks (they'll appear after your first PR):
- `Run Tests (ubuntu-latest, 20.x)`
- `Build Check`
- `All Checks Complete`
- `Code Quality Checks`
- `TypeScript Type Check`
- `Unit Tests`
- `Build Verification`

### 4. Required Secrets
Add these in **Settings** → **Secrets and variables** → **Actions**:

```bash
# Supabase (Database)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Deployment (if using Vercel)
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id

# Optional: Code coverage
CODECOV_TOKEN=your_codecov_token
```

## 🚀 How It Works

### When a new branch is created and PR is opened:
1. **CI Pipeline** (`ci.yml`) runs automatically
2. **PR Checks** (`pr-checks.yml`) run comprehensive quality gates
3. **Tests must pass** before merge is allowed
4. **Code review** is required
5. **Merge triggers** production deployment

### What gets tested:
- ✅ ESLint code quality
- ✅ TypeScript type checking  
- ✅ Unit tests with coverage
- ✅ Build verification
- ✅ Bundle size analysis
- ✅ Security audit
- ✅ Dependency review

## 🧪 Testing Your Setup

### 1. Create a test branch:
```bash
git checkout -b test/ci-setup
echo "# Test CI" >> test-file.md
git add test-file.md
git commit -m "test: verify CI pipeline"
git push origin test/ci-setup
```

### 2. Open a PR and verify:
- GitHub Actions start automatically
- All quality gates run
- Status checks appear on PR
- Merge is blocked until all checks pass

### 3. Check the Actions tab:
- Go to **Actions** tab in your repo
- You should see workflows running
- Green checkmarks = success
- Red X = failed (needs fixing)

## 🔍 Troubleshooting

### Common Issues:
1. **Actions not running**: Check if GitHub Actions are enabled
2. **Missing secrets**: Add required environment variables
3. **Tests failing**: Run `npm test` locally first
4. **Build failing**: Run `npm run build` locally first
5. **Linting errors**: Run `npm run lint:fix` locally

### Debug Commands:
```bash
# Run tests locally
npm test

# Run linting
npm run lint

# Run type checking
npx tsc --noEmit

# Run build
npm run build
```

## 📈 Monitoring

### View pipeline results:
- **Actions tab**: See all workflow runs
- **PR checks**: Status displayed on each PR
- **Branch protection**: Prevents merging if tests fail
- **Notifications**: Get email alerts for failed builds

Your CI/CD pipeline is now configured to run automatically when:
- ✅ New branches are created and PRs opened
- ✅ Commits are pushed to existing PRs
- ✅ Code is merged to main (triggers deployment) 