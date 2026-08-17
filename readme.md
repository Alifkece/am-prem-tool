# ALIGHT MOTION PREMIUM TOOL

A modern web application for requesting and verifying Alight Motion premium access using magic links.

## Features

- Request access via email
- Verify access using magic links
- Modern glassmorphism UI
- Responsive mobile-first design
- Secure backend API integration

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
| `UPSTREAM_SEND_URL` | The API endpoint for sending magic links | `https://znn-alightmotion.vercel.app/api/send` |
| `UPSTREAM_VERIFY_URL` | The API endpoint for verifying magic links | `https://znn-alightmotion.vercel.app/api/verify` |
| `UPSTREAM_API_KEY` | (Optional) API key for authentication | - |

These variables are used securely on the server-side only. Never expose them in the frontend.

## File Structure
