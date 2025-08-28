# Vercel Deployment Guide

## Prerequisites

1. Your backend server must be deployed and accessible via HTTPS
2. You need the URL of your deployed backend server

## Environment Variables Setup in Vercel

1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add the following environment variable:

```
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
```

Replace `your-backend-domain.com` with your actual backend server domain.

## Backend Deployment Options

### Option 1: Deploy Backend to Vercel

- Create a new Vercel project for your backend
- Set the root directory to `backend/`
- Configure the build settings for Node.js

### Option 2: Deploy Backend to Railway/Render/Heroku

- Deploy your Express.js backend to any Node.js hosting platform
- Get the production URL
- Update the `NEXT_PUBLIC_API_URL` environment variable

### Option 3: Use a Subdomain

- Deploy backend to `api.yourdomain.com`
- Deploy frontend to `yourdomain.com`
- Set `NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api`

## CORS Configuration

Make sure your backend has CORS configured to allow requests from your Vercel domain:

```javascript
app.use(
	cors({
		origin: [
			'https://your-frontend-domain.vercel.app',
			'http://localhost:3000', // for development
		],
		credentials: true,
	})
)
```

## Troubleshooting

1. **"This site can't be reached" error**: Check if your backend is running and accessible
2. **CORS errors**: Verify CORS configuration in your backend
3. **API connection issues**: Check the `NEXT_PUBLIC_API_URL` environment variable
4. **Build failures**: Check the build logs in Vercel dashboard

## Testing Deployment

1. After deployment, test the login functionality
2. Check browser console for any API errors
3. Verify that all features work as expected
