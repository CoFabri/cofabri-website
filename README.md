# CoFabri Website

A modern, responsive company website built with Next.js, TypeScript, and Tailwind CSS.

## Features

- Modern, responsive design
- Animated components using Framer Motion
- Mobile-friendly navigation
- Contact form
- Services showcase
- Team section
- Testimonials slider

## Tech Stack

- [Next.js](https://nextjs.org/) - React framework for production
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [Heroicons](https://heroicons.com/) - Beautiful hand-crafted SVG icons

## Getting Started

### Prerequisites

- Node.js 18.0.0 or later
- npm or yarn

### Installation

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

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
cofabri/
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── page.tsx      # Home page
│   │   ├── about/        # About page
│   │   ├── contact/      # Contact page
│   │   └── services/     # Services pages
│   ├── components/       # Reusable components
│   │   ├── ui/          # UI components
│   │   ├── Navbar.tsx   # Navigation component
│   │   └── Footer.tsx   # Footer component
│   └── styles/          # Global styles
├── public/              # Static assets
└── package.json         # Project dependencies
```

## Customization

### Colors

The color scheme can be customized by modifying the CSS variables in `src/app/globals.css`:

```css
:root {
  --primary: #d3d3d3;
  --secondary: #36454f;
  --accent: #007bff;
}
```

### Content

- Update the content in the respective page components
- Modify the team members in `src/app/about/page.tsx`
- Update services in `src/components/ui/Services.tsx`
- Edit testimonials in `src/components/ui/Testimonials.tsx`

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
