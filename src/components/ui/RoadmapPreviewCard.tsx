import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface RoadmapPreviewCardProps {
  roadmap: {
    id: string;
    name: string;
    description: string;
    status: string;
    category?: string;
    launchDate?: string;
    featuresAndChanges?: string;
    releaseNotes?: string;
    releaseType?: string;
  };
}

export default function RoadmapPreviewCard({ roadmap }: RoadmapPreviewCardProps) {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'released':
        return 'bg-green-100 text-green-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'delayed':
        return 'bg-orange-100 text-orange-800';
      case 'planned':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'released':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'in progress':
        return <ClockIcon className="w-5 h-5 text-blue-500 animate-spin-slow" />;
      case 'delayed':
        return <ExclamationCircleIcon className="w-5 h-5 text-orange-500" />;
      case 'planned':
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
      case 'cancelled':
        return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getReleaseTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'major':
        return 'bg-red-100 text-red-800';
      case 'minor':
        return 'bg-green-100 text-green-800';
      case 'patch':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 relative flex flex-col">
      <div className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 mt-1">
            {getStatusIcon(roadmap.status)}
          </div>
          <div className="flex-grow">
            <h4 className="text-lg font-semibold text-gray-900">
              {roadmap.name}
            </h4>
            {roadmap.category && (
              <div className="mt-1">
                <span className="inline-flex text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded-md">
                  {roadmap.category}
                </span>
              </div>
            )}
          </div>
        </div>

        <p className="text-gray-600 mb-4">
          {roadmap.description}
        </p>

        {roadmap.featuresAndChanges && (
          <div className="mb-4 bg-gray-50/80 p-4 rounded-lg">
            <h5 className="text-sm font-semibold text-gray-900 mb-2">Features & Changes</h5>
            <div className="text-sm text-gray-600 space-y-1.5">
              {roadmap.featuresAndChanges.split('\n').map((item: string, index: number) => {
                const trimmedItem = item.trim();
                const cleanedItem = trimmedItem.replace(/^[-•*]\s*/, '');
                return cleanedItem ? (
                  <div key={index} className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-[0.2rem]">•</span>
                    <span className="flex-grow leading-relaxed">{cleanedItem}</span>
                  </div>
                ) : null;
              }).filter(Boolean)}
            </div>
          </div>
        )}

        {roadmap.releaseNotes && (
          <div className="mb-4 bg-blue-50/80 p-4 rounded-lg">
            <h5 className="text-sm font-semibold text-blue-900 mb-2">Release Notes</h5>
            <p className="text-sm text-blue-700">{roadmap.releaseNotes}</p>
          </div>
        )}
      </div>

      <div className="mt-auto">
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex flex-wrap items-center gap-2">
            {roadmap.releaseType && (
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getReleaseTypeColor(roadmap.releaseType)}`}>
                {roadmap.releaseType}
              </span>
            )}
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(roadmap.status)}`}>
              {roadmap.status || 'Unknown Status'}
            </span>
          </div>
        </div>

        {roadmap.launchDate && (
          <div className="text-center py-3 px-4 bg-green-50 border-t border-green-100">
            <div className="text-sm font-medium text-green-800">
              Launch Date: {new Date(roadmap.launchDate).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 