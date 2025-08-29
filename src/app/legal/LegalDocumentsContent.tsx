'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import GradientHeading from '@/components/ui/GradientHeading';
import { LegalDocument } from '@/lib/airtable';

export default function LegalDocumentsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  
  const documentType = searchParams?.get('type') || '';
  const associatedApp = searchParams?.get('app') || '';
  const searchQuery = searchParams?.get('search') || '';
  const documentName = searchParams?.get('document') || '';
  
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [documentTypes, setDocumentTypes] = useState<string[]>([]);
  const [applications, setApplications] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState(documentType);
  const [selectedApplication, setSelectedApplication] = useState(associatedApp);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [currentPage, setCurrentPage] = useState(1);
  const documentsPerPage = 6;

  // Sync state with URL params when they change
  useEffect(() => {
    setSelectedType(documentType);
    setSelectedApplication(associatedApp);
    setSearchInput(searchQuery);
    setCurrentPage(1); // Reset to first page when URL params change
  }, [documentType, associatedApp, searchQuery, documentName]);

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const response = await fetch('/api/legal', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
            'Pragma': 'no-cache',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch legal documents');
        }
        
        const data = await response.json() as LegalDocument[];
        setDocuments(data);
        
        // Extract unique document types and applications
        const types = Array.from(new Set(data.map(doc => doc.documentType)));
        const apps = Array.from(new Set(data.map(doc => doc.associatedApp).filter((app): app is string => Boolean(app))));
        
        setDocumentTypes(types);
        setApplications(apps);
      } catch (error) {
        console.error('Error loading legal documents:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchDocuments();
  }, []);

  // Filter documents based on selected type, application, search query, and document name
  const filteredDocuments = documents.filter(doc => {
    const matchesType = !selectedType || doc.documentType === selectedType;
    const matchesApp = !selectedApplication || doc.associatedApp === selectedApplication;
    const matchesSearch = !searchInput || 
      doc.title.toLowerCase().includes(searchInput.toLowerCase()) ||
      (doc.description || '').toLowerCase().includes(searchInput.toLowerCase()) ||
      (doc.documentType || '').toLowerCase().includes(searchInput.toLowerCase()) ||
      (doc.associatedApp || '').toLowerCase().includes(searchInput.toLowerCase());
    const matchesDocument = !documentName || 
      doc.title.toLowerCase().includes(documentName.toLowerCase());
    
    return matchesType && matchesApp && matchesSearch && matchesDocument;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredDocuments.length / documentsPerPage);
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * documentsPerPage,
    currentPage * documentsPerPage
  );

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setCurrentPage(1); // Reset to first page
    updateURL(type || undefined, selectedApplication || undefined, searchInput || undefined, documentName || undefined);
  };

  const handleApplicationChange = (application: string) => {
    setSelectedApplication(application);
    setCurrentPage(1); // Reset to first page
    updateURL(selectedType || undefined, application || undefined, searchInput || undefined, documentName || undefined);
  };

  const handleSearchChange = (search: string) => {
    setSearchInput(search);
    setCurrentPage(1); // Reset to first page
    updateURL(selectedType || undefined, selectedApplication || undefined, search || undefined, documentName || undefined);
  };

  // URL update function
  const updateURL = (newType?: string, newApplication?: string, newSearch?: string, newDocument?: string) => {
    const params = new URLSearchParams();
    
    if (newType) params.set('type', newType);
    if (newApplication) params.set('app', newApplication);
    if (newSearch) params.set('search', newSearch);
    if (newDocument) params.set('document', newDocument);
    
    const queryString = params.toString();
    const newUrl = queryString ? `${pathname || ''}?${queryString}` : pathname || '';
    router.push(newUrl);
  };





  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen">
      <GradientHeading
        title="Legal Documents"
        subtitle="Access our comprehensive collection of legal documents including privacy policies, terms of service, and cookie policies. All documents are regularly updated to ensure compliance with the latest regulations."
        extraContent={
          <div className="relative z-50 w-full max-w-4xl mx-auto mt-12">
            <div className="flex flex-col gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search legal documents..."
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full px-4 py-3 pl-12 rounded-xl border-2 border-gray-200 
                    text-gray-700 font-medium hover:border-blue-400 focus:border-blue-500 focus:ring-2 
                    focus:ring-blue-200 focus:outline-none transition-all duration-200
                    shadow-sm hover:shadow-md"
                />
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              {/* Document Types */}
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700 mr-2 self-center">Document Types:</span>
                <button
                  onClick={() => handleTypeChange('')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                    ${!selectedType
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                  All Types
                </button>
                {documentTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleTypeChange(type)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200
                      ${selectedType === type
                        ? 'bg-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Applications */}
              {applications.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm font-medium text-gray-700 mr-2 self-center">Applications:</span>
                  <button
                    onClick={() => handleApplicationChange('')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200
                      ${!selectedApplication
                        ? 'bg-purple-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                  >
                    All Applications
                  </button>
                  {applications.map((application) => (
                    <button
                      key={application}
                      onClick={() => handleApplicationChange(application)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200
                        ${selectedApplication === application
                          ? 'bg-purple-500 text-white shadow-md'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      {application}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        }
      />

      <div className="container mx-auto px-4 py-12">

        {/* Documents Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : paginatedDocuments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No legal documents found matching your criteria.</p>
          </div>
        ) : (
          <div className={`${
            paginatedDocuments.length === 1 
              ? 'flex justify-center' 
              : paginatedDocuments.length === 2 
                ? 'flex justify-center' 
                : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
          } gap-6`}>
            {paginatedDocuments.map((document) => (
              <div
                key={document.id}
                className={`bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 overflow-hidden ${
                  paginatedDocuments.length === 1 ? 'w-full max-w-sm md:max-w-md lg:max-w-lg' : paginatedDocuments.length === 2 ? 'w-full max-w-sm' : ''
                }`}
              >
                {/* Document Header */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">{document.documentType}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <p className="text-xs text-gray-500">Active</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
                      {document.title}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span>Last updated: {formatDate(document.lastUpdated)}</span>
                    </div>
                  </div>
                  
                  {document.description && (
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {document.description}
                    </p>
                  )}
                  
                  {/* Document Metadata */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      Document Details
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                          </svg>
                          Version
                        </span>
                        <span className="font-medium text-gray-900 bg-white px-2 py-1 rounded text-xs">{document.version}</span>
                      </div>
                      {document.associatedApp && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 flex items-center">
                                                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3 7a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 11a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                          </svg>
                            Application
                          </span>
                          <span className="font-medium text-gray-900 bg-white px-2 py-1 rounded text-xs">{document.associatedApp}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {document.tags && document.tags.length > 0 && (
                    <div className="mb-4">
                      <h5 className="text-xs font-medium text-gray-600 mb-2 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                        </svg>
                        Tags
                      </h5>
                      <div className="flex flex-wrap gap-1">
                        {document.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-4">
                    {document.documentUrl ? (
                      <a
                        href={document.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                          <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                        </svg>
                        <span>View Document</span>
                      </a>
                    ) : (
                      <div className="w-full bg-gray-100 text-gray-500 text-center py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>No Document Available</span>
                      </div>
          )}
        </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Previous
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
