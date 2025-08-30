import Image from 'next/image';
import Link from 'next/link';
import type { App } from '@/lib/airtable';
import { StarIcon } from '@heroicons/react/20/solid';
import ExpandableText from './ExpandableText';

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
      <div className={`bg-white rounded-2xl shadow-sm overflow-hidden border transition
        ${isLaunchingToday() 
          ? 'border-blue-400 shadow-lg hover:shadow-xl hover:border-blue-500 animate-pulse' 
          : 'border-gray-100 hover:shadow-md'}`}>
        <div className="relative w-full h-auto">
          {app.screenshot && (
            <Image
              src={app.screenshot}
              alt={app.name}
              width={1200}
              height={630}
              className="object-cover w-full h-auto"
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
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              app.status === 'Live' ? 'bg-green-100 text-green-800' :
              app.status === 'Beta' ? 'bg-blue-100 text-blue-800' :
              app.status === 'Alpha' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {app.status}
            </span>
            {app.launchDate && (
              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                isLaunchingToday()
                  ? 'bg-blue-100 text-blue-800 animate-pulse'
                  : new Date(app.launchDate) > new Date() 
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
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
              <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                Released {new Date(app.releaseDate).toLocaleDateString()}
              </span>
            )}
          </div>

          {/* App Name */}
          <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition mb-4">
            {app.name}
            {isLaunchingToday() && (
              <span className="ml-2 inline-flex items-center text-sm font-medium text-blue-600 animate-bounce">
                🎉
              </span>
            )}
          </h2>
          <ExpandableText 
            text={app.description} 
            maxLength={200}
            className="text-gray-600 text-base leading-relaxed"
          />

          {/* Features Section */}
          {(app.feature1 || app.feature2 || app.feature3) && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Key Features</h3>
              <ul className="space-y-2.5">
                {app.feature1 && (
                  <li className="flex items-start text-gray-600">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-3 flex-shrink-0" />
                    <span>{app.feature1}</span>
                  </li>
                )}
                {app.feature2 && (
                  <li className="flex items-start text-gray-600">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-3 flex-shrink-0" />
                    <span>{app.feature2}</span>
                  </li>
                )}
                {app.feature3 && (
                  <li className="flex items-start text-gray-600">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-3 flex-shrink-0" />
                    <span>{app.feature3}</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Action Button */}
          {app.url && (
            <Link
              href={app.url.startsWith('http') ? app.url : `https://${app.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-5 py-2.5 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
            >
              Visit App
            </Link>
          )}
        </div>
      </div>
    </div>
  );
} 