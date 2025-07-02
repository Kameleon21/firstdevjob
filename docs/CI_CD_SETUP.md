# CI/CD Setup Guide

This guide explains how to set up Continuous Integration and Continuous Deployment for your FirstDevJob project using GitHub Actions.

## 🚀 Overview

We've set up three main workflows:

1. **CI Pipeline** (`.github/workflows/ci.yml`) - Runs on all PRs and pushes
2. **Production Deployment** (`.github/workflows/deploy.yml`) - Deploys to production
3. **PR Checks** (`.github/workflows/pr-checks.yml`) - Comprehensive PR quality gates

## 📋 Prerequisites

Before setting up CI/CD, ensure you have:

- GitHub repository with admin access
- Node.js project with `package.json` and test suite
- Deployment platform account (Vercel, Netlify, AWS, etc.)

## 🔧 Setup Instructions

### 1. GitHub Repository Settings

#### Enable GitHub Actions
1. Go to your repository settings
2. Navigate to **Actions** → **General**
3. Ensure "Allow all actions and reusable workflows" is selected

#### Set Up Branch Protection Rules
1. Go to **Settings** → **Branches**
2. Click **Add rule** for your main branch
3. Configure these settings:

```yaml
Branch name pattern: main
✅ Require status checks to pass before merging
✅ Require branches to be up to date before merging
Required status checks:
  - Run Tests (ubuntu-latest, 20.x)
  - Build Check
  - All Checks Complete
✅ Require pull request reviews before merging
✅ Require review from code owners
✅ Dismiss stale PR approvals when new commits are pushed
✅ Require linear history
✅ Include administrators
```

### 2. Secrets Configuration

Add these secrets in **Settings** → **Secrets and variables** → **Actions**:

#### For Vercel Deployment:
```bash
VERCEL_TOKEN=your_vercel_token_here
VERCEL_ORG_ID=your_org_id_here  
VERCEL_PROJECT_ID=your_project_id_here
```

#### For Database/Environment Variables:
```bash
DATABASE_URL=your_database_url_here
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=your_production_url_here
# Add any other environment variables your app needs
```

#### For Code Coverage (Optional):
```bash
CODECOV_TOKEN=your_codecov_token_here
```

### 3. Package.json Scripts

Ensure your `package.json` has these scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --coverage --watchAll=false --testResultsProcessor=jest-sonar-reporter",
    "type-check": "tsc --noEmit"
  }
}
```

## 🔄 Workflow Descriptions

### CI Pipeline (`ci.yml`)

**Triggers:** PRs and pushes to `main`/`develop`

**What it does:**
- ✅ Runs tests on Node.js 18.x and 20.x
- ✅ Runs ESLint for code quality
- ✅ Performs TypeScript type checking
- ✅ Runs build verification
- ✅ Security audit
- ✅ Dependency review
- ✅ Uploads test coverage to Codecov

### Production Deployment (`deploy.yml`)

**Triggers:** Pushes to `main` branch

**What it does:**
- ✅ Runs full test suite before deployment
- ✅ Builds application for production
- ✅ Deploys to Vercel (or your chosen platform)
- ✅ Notifies on successful deployment

### PR Checks (`pr-checks.yml`)

**Triggers:** Pull request events

**What it does:**
- ✅ Comprehensive code quality analysis
- ✅ TypeScript type safety verification
- ✅ Unit test execution with reporting
- ✅ Build verification
- ✅ Bundle size analysis
- ✅ Comments on PR with results summary

## 🎯 Quality Gates

Every PR must pass these quality gates:

| Gate | Description | Failure Action |
|------|-------------|----------------|
| **Code Quality** | ESLint checks, formatting | PR blocked until fixed |
| **Type Safety** | TypeScript compilation | PR blocked until fixed |
| **Unit Tests** | All tests must pass | PR blocked until fixed |
| **Build Check** | Production build succeeds | PR blocked until fixed |
| **Bundle Analysis** | Check for size regressions | Warning only |

## 📊 Monitoring & Notifications

### Test Coverage
- Coverage reports uploaded to Codecov
- Coverage thresholds enforced in Jest config
- Failed coverage blocks PR merge

### Build Status
- GitHub status checks show in PR
- Failed builds prevent merging
- Slack/Discord notifications (optional)

### Bundle Size
- Bundle analysis on every PR
- Warns about significant size increases
- Artifacts uploaded for comparison

## 🛠️ Customization Options

### Environment-Specific Deployments

Add staging environment:

```yaml
# In deploy.yml
deploy-staging:
  name: Deploy to Staging
  if: github.ref == 'refs/heads/develop'
  # ... staging deployment steps
```

### Custom Deployment Platforms

Replace Vercel deployment with your platform:

```yaml
- name: Deploy to AWS
  run: |
    aws s3 sync out/ s3://${{ secrets.S3_BUCKET }}
    aws cloudfront create-invalidation --distribution-id ${{ secrets.CLOUDFRONT_ID }}
```

### Additional Quality Checks

Add more checks:

```yaml
- name: Run E2E Tests
  run: npm run test:e2e

- name: Performance Audit
  run: npm run lighthouse

- name: Accessibility Check
  run: npm run test:a11y
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Tests Fail in CI but Pass Locally
```bash
# Ensure CI uses same Node.js version
node --version
npm --version

# Check for timezone/environment differences
TZ=UTC npm test
```

#### 2. Build Fails Due to Memory Issues
```yaml
# In workflow file
- name: Build with more memory
  run: NODE_OPTIONS="--max_old_space_size=4096" npm run build
```

#### 3. Flaky Tests
```yaml
# Retry failed tests
- name: Run tests with retry
  run: npm test -- --testTimeout=10000 --maxWorkers=2
```

### Debug Mode

Enable debug logging:

```yaml
env:
  DEBUG: '*'
  CI_DEBUG: true
```

## 📈 Best Practices

### 1. Test Strategy
- Unit tests for business logic
- Integration tests for API routes
- E2E tests for critical user flows
- Visual regression tests for UI components

### 2. Performance
- Cache dependencies between runs
- Use matrix builds for multiple Node versions
- Run jobs in parallel when possible

### 3. Security
- Never expose secrets in logs
- Use least-privilege access tokens
- Regularly audit dependencies

### 4. Monitoring
- Set up notifications for failed deployments
- Monitor test execution time trends
- Track bundle size over time

## 🎉 Next Steps

After setting up CI/CD:

1. **Create your first PR** to test the workflows
2. **Set up monitoring** dashboards (GitHub Insights)
3. **Configure notifications** (Slack, Discord, email)
4. **Add integration tests** for better coverage
5. **Set up staging environment** for testing
6. **Configure automated dependency updates** (Dependabot)

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CI/CD Guide](https://vercel.com/docs/concepts/git)
- [Jest Testing Best Practices](https://jestjs.io/docs/manual-mocks)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)

---

🎯 **Goal**: Every commit to main should be production-ready with zero manual intervention! 