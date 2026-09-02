import Image from 'next/image';
import Link from 'next/link';
import type { App } from '@/lib/api-client';
import { ArrowUpRight } from 'lucide-react';
import ExpandableText from './ExpandableText';
import { Button } from '@/components/ui/button';

interface AppPreviewCardProps {
  app: App;
}

export default function AppPreviewCard({ app }: AppPreviewCardProps) {
  // Check if app is launching today
  const isLaunchingToday = () => {
    if (!app.launchDate) return false;
    const today = new Date();
    const launchDate = new Date(app.launchDate);
    return (
      launchDate.getDate() === today.getDate() &&
      launchDate.getMonth() === today.getMonth() &&
      launchDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="group">
      <div className={`bg-card rounded-2xl shadow-sm overflow-hidden border transition-all duration-300 ease-out transform hover:scale-[1.02] hover:-translate-y-1
        ${isLaunchingToday()
          ? 'border-primary/60 shadow-lg hover:shadow-2xl hover:border-primary animate-pulse hover:animate-none'
          : 'border-border hover:shadow-xl'}`}>
        <div className="relative w-full h-auto overflow-hidden">
          {app.screenshot && (
            <Image
              src={app.screenshot}
              alt={app.name}
              width={1200}
              height={630}
              className="object-cover w-full h-auto transition-transform duration-500 ease-out group-hover:scale-105"
              onError={(e) => {
                console.error(`Error loading image for ${app.name}:`, e);
                // Fallback to placeholder
                const imgElement = e.target as HTMLImageElement;
                imgElement.src = '/images/placeholder.jpg';
              }}
            />
          )}
        </div>
        <div className="p-6">
          {/* Badges Section */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            <span className={`px-2 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
              app.status === 'Live' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
              app.status === 'Active' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
              app.status === 'Beta' ? 'bg-accent text-accent-foreground hover:bg-accent/80' :
              app.status === 'Alpha' ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80' :
              'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}>
              {app.status}
            </span>
            {app.launchDate && (
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                isLaunchingToday()
                  ? 'bg-accent text-accent-foreground animate-pulse hover:bg-accent/80'
                  : new Date(app.launchDate) > new Date()
                    ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
              }`}>
                {isLaunchingToday()
                  ? '🚀 Launching Today! 🎉'
                  : new Date(app.launchDate) > new Date()
                    ? `Launching ${new Date(app.launchDate).toLocaleDateString()}`
                    : `Launched ${new Date(app.launchDate).toLocaleDateString()}`
                }
              </span>
            )}
            {app.releaseDate && (
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all duration-200">
                Released {new Date(app.releaseDate).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* App Name */}
          <h2 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300 mb-4">
            {app.name}
            {isLaunchingToday() && (
              <span className="ml-2 inline-flex items-center text-sm font-medium text-primary animate-bounce">
                🎉
              </span>
            )}
          </h2>
          <ExpandableText
            text={app.description}
            maxLength={200}
            className="text-muted-foreground text-base leading-relaxed"
          />

          {/* Features Section */}
          {(app.feature1 || app.feature2 || app.feature3) && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-foreground mb-3">Key Features</h3>
              <ul className="space-y-2.5">
                {app.feature1 && (
                  <li className="flex items-start text-muted-foreground transition-colors duration-200 hover:text-foreground">
                    <span className="w-2 h-2 bg-primary rounded-full mt-1.5 mr-3 flex-shrink-0 transition-transform duration-200 group-hover:scale-125" />
                    <span>{app.feature1}</span>
                  </li>
                )}
                {app.feature2 && (
                  <li className="flex items-start text-muted-foreground transition-colors duration-200 hover:text-foreground">
                    <span className="w-2 h-2 bg-primary rounded-full mt-1.5 mr-3 flex-shrink-0 transition-transform duration-200 group-hover:scale-125" />
                    <span>{app.feature2}</span>
                  </li>
                )}
                {app.feature3 && (
                  <li className="flex items-start text-muted-foreground transition-colors duration-200 hover:text-foreground">
                    <span className="w-2 h-2 bg-primary rounded-full mt-1.5 mr-3 flex-shrink-0 transition-transform duration-200 group-hover:scale-125" />
                    <span>{app.feature3}</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Action Button */}
          {app.status === 'In Development' ? (
            <Button asChild>
              <Link href={`/signup?appId=${app.id}`}>Join Waitlist</Link>
            </Button>
          ) : app.url ? (
            <Button asChild>
              <Link
                href={app.url.startsWith('http') ? app.url : `https://${app.url}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit App
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
