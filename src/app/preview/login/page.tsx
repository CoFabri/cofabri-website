'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

interface PreviewContent {
  id: string;
  type: string;
  [key: string]: any;
}

interface MissingField {
  field: string;
  value: any;
}

export default function LoginPreviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <LoginPreviewContent />
    </Suspense>
  );
}

function LoginPreviewContent() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirect = searchParams ? searchParams.get('redirect') || '/' : '/';
  const [content, setContent] = useState<PreviewContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requiredFields, setRequiredFields] = useState<string[]>([]);
  const [optionalFields, setOptionalFields] = useState<string[]>([]);
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const [isReadyToPost, setIsReadyToPost] = useState(false);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('/api/preview/login/default');
        if (!response.ok) {
          throw new Error('Failed to fetch login preview content');
        }
        const data = await response.json();
        setContent(data);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch content');
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Check if the password matches the preview password from environment variables
    if (password === process.env.NEXT_PUBLIC_PREVIEW_PASSWORD) {
      // If password is correct, redirect to the intended destination
      router.push(redirect);
    } else {
      setError('Invalid preview password');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 max-w-md w-full">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Preview</h1>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Preview Access
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter the preview password to continue
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="password" className="sr-only">
                Preview Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter preview password"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Continue to Preview
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 