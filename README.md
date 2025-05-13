# CoFabri - SaaS Apps for Modern Businesses

A modern web platform showcasing a suite of powerful SaaS applications, built with Next.js, TypeScript, and Tailwind CSS.

## Features

### Core Features
- 🎨 Modern, responsive UI with animated gradients and glass-morphism effects
- 📱 Mobile-first design with optimized performance
- 🔍 SEO-optimized with comprehensive metadata
- 🌐 Multi-language support (ready for internationalization)
- 🔒 Secure authentication and authorization
- 📊 Real-time analytics integration
- 🎉 Interactive celebrations with confetti effects

### Content Management
- 📝 Blog system with rich text support
- 📚 Knowledge base with categorized articles
- 🗺️ Product roadmap with milestone tracking
- 📢 Status page for system monitoring
- 🎯 App showcase with launch management
- 👥 Author profiles with social integration
- 🎨 Customizable UI components
- 🔄 Dynamic content updates

### Social Integration
- 🐦 X (Twitter) feed integration
- 📸 Instagram post showcase
- 💼 LinkedIn company updates
- 🔄 Real-time social media feeds
- 📱 Social sharing capabilities
- 📊 Social engagement analytics
- 🔗 Social profile linking

### User Engagement
- 📧 Newsletter subscription system
- 💬 Live chat widget (HighLevel integration)
- ❓ FAQ section
- 📝 Blog comments
- 📊 Analytics tracking
- 🎯 Call-to-action components
- 🎉 Interactive celebrations
- 📱 Mobile-responsive design

### Preview System
- 👀 Content preview before publishing
- 🔄 Draft management
- 📱 Responsive preview
- 🔒 Password-protected previews
- 📅 Scheduled content publishing
- 🎨 Visual preview options
- 🔍 SEO preview
- 📊 Analytics preview

### Launch Management
- ⏰ Launch countdown system
- 📢 Launch announcements
- 🎉 Launch celebrations with confetti
- 📱 Social media integration
- 📧 Email notifications
- 📊 Launch analytics
- 🎯 Launch goals tracking
- 🔔 Launch notifications

### System Status
- 🚨 Real-time status monitoring
- 📊 Incident tracking
- 🔔 Status notifications
- 📱 Service-specific status
- 📈 Historical incident data
- 🔄 Status updates
- 📧 Status notifications
- 🎯 Status indicators

### Interactive Features
- 🎉 Confetti celebrations for launches and achievements
- 🎨 Animated UI components
- 🔄 Real-time updates
- 📱 Responsive interactions
- 🎯 Interactive CTAs
- 🔔 Notification system
- 📊 Interactive analytics
- 🎨 Custom animations

## Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Animations**: Framer Motion
- **Content Management**: Airtable
- **Social Media**: Twitter API, Instagram API, LinkedIn API
- **Analytics**: Google Analytics
- **Email**: Nodemailer
- **Chat**: HighLevel Widget
- **Deployment**: Vercel
- **Celebrations**: Canvas Confetti

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/cofabri.git
   cd cofabri
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root directory with the following variables:

   ```env
   # Newsletter Webhook
   NEWSLETTER_WEBHOOK_URL=your_webhook_url_here

   # HighLevel Chat Widget
   NEXT_PUBLIC_HIGHLEVEL_WIDGET_URL=your_highlevel_widget_url_here

   # Airtable Form
   NEXT_PUBLIC_AIRTABLE_FORM_ID=your_airtable_form_id_here

   # Base URL
   NEXT_PUBLIC_BASE_URL=http://localhost:3000

   # Airtable Configuration
   AIRTABLE_PERSONAL_ACCESS_TOKEN=your_airtable_token
   AIRTABLE_BASE_ID=your_base_id

   # X (Twitter) API Credentials
   TWITTER_API_KEY=your_twitter_api_key
   TWITTER_API_SECRET=your_twitter_api_secret
   TWITTER_ACCESS_TOKEN=your_twitter_access_token
   TWITTER_ACCESS_SECRET=your_twitter_access_secret
   TWITTER_USER_ID=your_twitter_user_id

   # Instagram API Credentials
   INSTAGRAM_USERNAME=your_instagram_username
   INSTAGRAM_PASSWORD=your_instagram_password
   INSTAGRAM_USER_ID=your_instagram_user_id

   # LinkedIn API Credentials
   LINKEDIN_CLIENT_ID=your_linkedin_client_id
   LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
   LINKEDIN_ACCESS_TOKEN=your_linkedin_access_token
   LINKEDIN_COMPANY_ID=your_linkedin_company_id

   # Gmail Configuration
   GMAIL_USER=your_gmail_address
   GMAIL_APP_PASSWORD=your_gmail_app_password

   # Preview Password
   PREVIEW_PASSWORD=your_preview_password
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
cofabri/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── page.tsx           # Home page
│   │   ├── preview/           # Content preview system
│   │   ├── roadmaps/          # Product roadmap pages
│   │   ├── status/            # System status pages
│   │   ├── blog/              # Blog pages
│   │   ├── knowledge-base/    # Knowledge base pages
│   │   ├── apps/              # App showcase pages
│   │   └── api/               # API routes
│   ├── components/            # React components
│   │   ├── ui/               # UI components
│   │   │   ├── Banner.tsx    # Announcement banner
│   │   │   ├── LaunchCountdown.tsx  # App launch countdown
│   │   │   ├── StatusIndicator.tsx  # System status indicator
│   │   │   ├── NewsletterSignup.tsx # Newsletter signup form
│   │   │   ├── LiveChat.tsx  # Live chat widget
│   │   │   ├── SocialFeeds.tsx # Social media feeds
│   │   │   └── Features.tsx  # Feature showcase
│   │   └── layout/           # Layout components
│   ├── lib/                   # Utility functions and API clients
│   │   ├── airtable.ts       # Airtable integration
│   │   ├── social.ts         # Social media integration
│   │   ├── status.ts         # Status page integration
│   │   └── launch.ts         # Launch announcement system
│   └── styles/               # Global styles
├── public/                   # Static assets
└── package.json             # Project dependencies
```

## Content Management

### Airtable Setup

1. Create an Airtable base with the following tables:
   - Blog
   - Knowledge Base
   - Roadmap
   - Status
   - Apps
   - Authors
   - Sitewide Banners
   - Launches

2. Required fields for each table:

#### Blog Posts
- Title
- Content
- Slug
- Published At
- Author (linked to Authors table)
- Reading Time
- Featured Image (optional)
- Excerpt (optional)
- Tags (optional)

#### Knowledge Base
- Title
- Content
- Category
- Slug
- Last Updated
- Status
- Summary/Description
- Author (linked to Authors table)
- Read Time
- Tags (optional)

#### Roadmap
- Name
- Description
- Status
- Release Type
- Milestone
- Application (optional)
- Features and Changes (optional)
- Release Notes (optional)

#### Status Updates
- Title
- Issue/Ticket ID
- Root Cause
- Application
- Severity (Critical, Major, Minor)
- Public Status (Investigating, Identified, Monitoring, Resolved)
- Created Date
- Message
- Updates (optional)
- Affected Services (optional)
- Resolved Date (optional)

#### Apps
- Name
- Description
- Application Status (Live, Beta, Alpha, Coming Soon)
- Category
- URL
- Feature 1-3 (optional)
- Launch Date (optional)
- Launch Announcement (optional)
- Launch Countdown (optional)

#### Authors
- Name
- Role
- Bio (optional)
- Image (optional)
- Social Links (optional)

#### Sitewide Banners
- Title
- Message
- Type (Info, Warning, Success, Error)
- Start Date
- End Date (optional)
- Is Active
- Link (optional)
- Link Text (optional)

#### Launches
- App Name (linked to Apps table)
- Launch Date
- Launch Time
- Announcement Text
- Features List
- Status (Scheduled, In Progress, Completed)
- Countdown Enabled
- Social Media Announcements

### Preview System

The preview system allows you to view content before publishing. Access previews at:
```
/preview/[type]/[id]
```

Supported types:
- blog
- kb
- apps
- authors
- roadmap
- status
- banners
- launches

## Feature Details

### Banner System

The banner system allows you to display important announcements across the website:

1. Create a new banner in the Sitewide Banners table
2. Set the banner type (Info, Warning, Success, Error)
3. Configure display dates
4. Add optional call-to-action link
5. Preview the banner using the preview system
6. Trigger confetti effects for special announcements

Banners are automatically displayed based on:
- Active status
- Current date within start/end date range
- Priority (Error > Warning > Info > Success)
- Special event triggers
- User interactions

Features:
- Multiple banner types
- Customizable styling
- Interactive elements
- Confetti celebrations
- Analytics tracking
- A/B testing support
- Mobile optimization
- Accessibility compliance

### App Launch System

The app launch system provides a comprehensive way to announce and manage new app launches:

1. Create a new launch in the Launches table
2. Link it to the corresponding app
3. Set launch date and time
4. Configure announcement text and features
5. Enable/disable countdown timer
6. Set up social media announcements

Features:
- Real-time countdown timer
- Launch status indicators
- Feature preview
- Social media integration
- Email notifications (optional)

### System Status

The system status feature provides real-time monitoring and updates:

1. Create status updates in the Status table
2. Set severity level
3. Update status as issues progress
4. Add affected services
5. Include resolution details
6. Configure notification preferences

Features:
- Real-time status indicators
- Historical incident tracking
- Service-specific status
- Email notifications
- Status page integration
- Incident timeline
- Resolution tracking
- User impact assessment
- Automated status updates
- Custom status pages

### Newsletter System

The newsletter system allows users to subscribe to updates:

1. Configure webhook URL in environment variables
2. Customize signup form design
3. Set up email notifications
4. Track subscription analytics

Features:
- Email validation
- Success/error handling
- Subscription tracking
- Webhook integration
- Customizable form design

### Live Chat

The live chat system integrates with HighLevel:

1. Configure widget URL in environment variables
2. Customize widget appearance
3. Set up chat routing
4. Monitor chat analytics

Features:
- Real-time chat
- Custom styling
- Mobile responsive
- Analytics tracking
- Chat history

## Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in Vercel's project settings
4. Deploy!

## Customization

### Colors

The color scheme can be customized by modifying the Tailwind configuration in `tailwind.config.js`:

```js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#your-primary-color',
        secondary: '#your-secondary-color',
        accent: '#your-accent-color',
      },
    },
  },
}
```

### Components

UI components are located in `src/components/ui/`. Each component is self-contained and can be customized as needed.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.
