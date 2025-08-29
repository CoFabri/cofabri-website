# Cloudflare Turnstile Setup Guide

This guide explains how to set up Cloudflare Turnstile for spam protection on the contact form.

## What is Cloudflare Turnstile?

Cloudflare Turnstile is a privacy-first, free CAPTCHA alternative that helps protect your website from spam and abuse while providing a better user experience than traditional CAPTCHAs.

## Development vs Production

### Development Environment
- **Test keys are automatically used** in development mode
- No configuration required for local development
- Uses Cloudflare's official test keys:
  - Site Key: `1x00000000000000000000AA`
  - Secret Key: `1x0000000000000000000000000000000AA`

### Production Environment
- Requires real Turnstile keys from Cloudflare
- Must be configured with environment variables

## Setup Steps

### 1. Create a Cloudflare Account
If you don't have one, sign up at [cloudflare.com](https://cloudflare.com)

### 2. Add Your Domain
Add your domain to Cloudflare and configure DNS settings.

### 3. Create Turnstile Widget
1. Go to the Cloudflare dashboard
2. Navigate to **Security** > **Turnstile**
3. Click **Add site**
4. Choose **Managed** challenge type
5. Select your domain
6. Choose **Non-interactive** for the best user experience
7. Click **Create**

### 4. Get Your Keys
After creating the widget, you'll get:
- **Site Key** (public) - Used in the frontend
- **Secret Key** (private) - Used in the backend

### 5. Configure Environment Variables

Add these environment variables to your `.env.local` file for production:

```bash
# Public key (used in frontend)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_site_key_here

# Secret key (used in backend)
TURNSTILE_SECRET_KEY=your_secret_key_here
```

**Note**: These are only needed for production. Development automatically uses test keys.

### 6. Deploy
Make sure to add these environment variables to your production environment as well.

## How It Works

1. **Frontend**: The Turnstile widget loads on the contact form
2. **User Interaction**: Users complete the verification (usually invisible)
3. **Token Generation**: Turnstile generates a token
4. **Form Submission**: Token is sent with the form data
5. **Backend Verification**: Server verifies the token with Cloudflare
6. **Success/Failure**: Form is processed or rejected based on verification

## Features

- **Privacy-first**: No tracking or cookies
- **Invisible by default**: Users don't see traditional CAPTCHA challenges
- **Mobile-friendly**: Works seamlessly on all devices
- **Accessible**: WCAG compliant
- **Free**: No cost for basic usage
- **Development-friendly**: Automatic test keys for local development

## Troubleshooting

### Widget Not Loading
- Check that `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set correctly (production only)
- Ensure your domain is properly configured in Cloudflare
- Check browser console for JavaScript errors

### Verification Failing
- Verify `TURNSTILE_SECRET_KEY` is set correctly (production only)
- Check that the domain matches your Turnstile widget configuration
- Review Cloudflare dashboard for any error messages

### Production Issues
- Ensure environment variables are set in production
- Check that your production domain is added to the Turnstile widget
- Verify DNS settings are correct

### Multiple Widgets Appearing
- The component includes protection against multiple renders
- If you still see multiple widgets, check for React Strict Mode or component re-renders

## Security Notes

- Never expose your secret key in client-side code
- Always verify tokens server-side
- Use HTTPS in production
- Regularly rotate your keys if needed
- Test keys are safe to use in development

## Support

For Turnstile-specific issues, refer to the [Cloudflare Turnstile documentation](https://developers.cloudflare.com/turnstile/).
