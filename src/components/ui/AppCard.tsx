import Image from 'next/image';
import Link from 'next/link';
import type { App } from '@/lib/airtable';
import { StarIcon } from '@heroicons/react/20/solid';

interface AppCardProps {
  app: App;
}

export default function AppCard({ app }: AppCardProps) {
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
              src={typeof app.screenshot === 'string' ? app.screenshot : app.screenshot[0]?.url}
              alt={app.name}
              width={1200}
              height={630}
              className="object-cover w-full h-auto"
            />
          )}
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition">
              {app.name}
            </h2>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  app.status === 'Live' ? 'bg-green-100 text-green-800' :
                  app.status === 'Beta' ? 'bg-blue-100 text-blue-800' :
                  app.status === 'Alpha' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {app.status}
                </span>
              </div>
              {app.launchDate && (
                <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                  isLaunchingToday()
                    ? 'bg-blue-100 text-blue-800 animate-bounce'
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
            </div>
          </div>
          <p className="text-gray-600 mb-4">
            {app.description}
          </p>

          <ul className="space-y-2 mb-4">
            {app.feature1 && (
              <li className="flex items-center text-gray-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                {app.feature1}
              </li>
            )}
            {app.feature2 && (
              <li className="flex items-center text-gray-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                {app.feature2}
              </li>
            )}
            {app.feature3 && (
              <li className="flex items-center text-gray-600">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                {app.feature3}
              </li>
            )}
          </ul>
          <Link
            href={app.url ? (app.url.startsWith('http') ? app.url : `https://${app.url}`) : '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            Visit App
          </Link>
        </div>
      </div>
    </div>
  );
} 