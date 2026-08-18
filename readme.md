# ALIGHT MOTION PREMIUM TOOL

A modern web application for generating Alight Motion Premium using AlightPro API.

## Features

- Request magic link via email
- Verify and activate premium
- Modern glassmorphism UI
- Responsive mobile-first design
- Secure backend with AlightPro API integration
- POW (Proof of Work) protection bypass

## Deployment to Vercel

### Step 1: Create GitHub Repository

1. Go to GitHub and create a new repository.
2. Upload all files from this project using the "Add file" → "Upload files" button.
3. Commit the files.

### Step 2: Deploy to Vercel

1. Go to [Vercel](https://vercel.com) and sign in.
2. Click "Add New..." → "Project".
3. Import your GitHub repository.
4. Vercel will automatically detect the project. **No build command is needed**.
5. Configure the Environment Variables (see below).
6. Click "Deploy".

### Environment Variables

Add the following environment variables in your Vercel project settings:

| Variable | Description | Default |
|----------|-------------|---------|
| `ALIGHTPRO_BASE_URL` | Base URL of AlightPro API | `https://www.alightpro.my.id` |
| `ALIGHTPRO_SECRET` | Secret key for human proof | `amprem-human-v3-secret-2026` |

These variables are used securely on the server-side only. Never expose them in the frontend.

## File Structure
