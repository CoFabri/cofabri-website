'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function BackButton() {
  const router = useRouter();

  return (
    <button 
      onClick={() => router.push('/knowledge-base')}
      className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-8 group transition-all duration-200"
    >
      <ArrowLeftIcon className="h-4 w-4 mr-2 transition-transform group-hover:-translate-x-1" />
      Back to Knowledge Base
    </button>
  );
} 