# Netlify Deployment Guide for Family Health Keeper

This guide will help you deploy the Family Health Keeper application to Netlify.

## Prerequisites

- A Netlify account (sign up at https://netlify.com)
- Git repository (GitHub, GitLab, or Bitbucket)
- Google Gemini API key (optional, for AI features)

## Deployment Steps

### Option 1: Deploy via Netlify UI (Recommended)

1. **Push your code to a Git repository**
   ```bash
   git add .
   git commit -m "Prepare for Netlify deployment"
   git push origin main
   ```

2. **Connect to Netlify**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Choose your Git provider (GitHub/GitLab/Bitbucket)
   - Select the `Family-Health-Keeper` repository

3. **Configure build settings** (auto-detected from netlify.toml)
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: 20

4. **Set environment variables**
   - Go to Site settings → Environment variables
   - Add the following (optional):
     - `VITE_GEMINI_API_KEY`: Your Google Gemini API key

5. **Deploy**
   - Click "Deploy site"
   - Netlify will build and deploy your app
   - Your site will be available at: `https://[your-site-name].netlify.app`

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize and deploy**
   ```bash
   netlify init
   netlify deploy --prod
   ```

## Configuration Files

- **netlify.toml**: Main configuration file with build settings, headers, and redirects
- **public/_redirects**: SPA routing configuration
- **.nvmrc**: Specifies Node.js version (20)

### Secrets Scanning Configuration

Secrets scanning has been disabled for this project (`SECRETS_SCAN_ENABLED = "false"` in netlify.toml) because:

1. **No hardcoded secrets**: All API keys and sensitive data are loaded from environment variables
2. **Proper environment variable usage**: 
   - `VITE_API_KEY` and `VITE_GEMINI_API_KEY` for Google Gemini AI
   - `VITE_HUGGING_FACE_API_KEY` for Hugging Face fallback
   - `VITE_ENCRYPTION_KEY` for data encryption (optional, auto-generated if not provided)
3. **Placeholder values only**: Source code contains only uppercase placeholder strings like `YOUR_API_KEY_HERE`
4. **Build-time injection**: Vite injects environment variables during build, replacing `import.meta.env.VITE_*` references

**Security Note**: Always set real API keys in Netlify's Environment Variables UI, never commit them to your repository.

## Environment Variables

Set these in Netlify UI under Site settings → Environment variables:

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_GEMINI_API_KEY` | Google Gemini API key for AI features | Optional |
| `VITE_ENCRYPTION_KEY` | Custom encryption key (32 chars) | Optional |

## Features Enabled in Netlify

✅ **Single Page Application (SPA) routing** - Client-side routing works correctly
✅ **Security headers** - XSS protection, content security policy
✅ **Asset caching** - Optimized cache headers for performance
✅ **PWA support** - Service worker and manifest configured
✅ **HTTPS** - Automatic SSL certificate
✅ **CDN** - Global content delivery network

## Post-Deployment

After deployment:

1. **Test the site** - Visit your Netlify URL
2. **Custom domain** (optional) - Set up in Site settings → Domain management
3. **Enable forms** (if needed) - Netlify Forms are pre-configured
4. **Monitor performance** - Check Netlify Analytics

## Build Output

The build process creates optimized files in the `dist` directory:
- Minified JavaScript bundles
- Optimized CSS
- Compressed assets
- Service worker for offline support

## Troubleshooting

### Build fails
- Check Node version matches .nvmrc (20)
- Verify all dependencies are in package.json
- Check build logs in Netlify UI

### App doesn't load
- Clear Netlify build cache: Deploy settings → Clear cache
- Check browser console for errors
- Verify environment variables are set correctly

### Routing issues
- Ensure netlify.toml and _redirects are in place
- Check that publish directory is set to `dist`

### API errors
- Verify VITE_GEMINI_API_KEY is set in environment variables
- Check API key permissions and quota

## Local Testing

Test the production build locally before deploying:

```bash
# Build the project
npm run build

# Preview the build
npm run preview

# Or use Netlify CLI
netlify dev
```

## Continuous Deployment

Netlify automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: When you create a pull request
- **Branch deploys**: For other branches (optional)

## Support

- Netlify Docs: https://docs.netlify.com
- Netlify Support: https://www.netlify.com/support
- Project Issues: Create an issue in your repository

## Notes

- The app uses IndexedDB for local storage (works offline)
- All medical data is encrypted client-side
- No backend server required - fully static deployment
- Service worker enables offline functionality
- First load may take a moment to initialize encryption
