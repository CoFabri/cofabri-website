import Airtable from 'airtable';
import { FieldSet } from 'airtable';
import { Collaborator } from 'airtable';

const AIRTABLE_API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

export interface AirtableRecord<T> {
  id: string;
  fields: T;
  createdTime: string;
}

// Create a function to get the Airtable base instance (for client-side use)
export function getAirtableBase() {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error('Missing Airtable configuration');
  }

  return new Airtable({ 
    apiKey: AIRTABLE_API_KEY,
    requestTimeout: 300000, // 5 minutes
    endpointUrl: 'https://api.airtable.com',
  }).base(AIRTABLE_BASE_ID);
}

// Server-side fetch function for Airtable
async function fetchFromAirtable<T>(tableName: string, options: { filterByFormula?: string; sort?: { field: string; direction: string }[]; maxRecords?: number } = {}): Promise<AirtableRecord<T>[]> {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error('Missing Airtable configuration');
  }

  const queryParams = new URLSearchParams();
  if (options.filterByFormula) queryParams.append('filterByFormula', options.filterByFormula);
  if (options.maxRecords) queryParams.append('maxRecords', options.maxRecords.toString());
  if (options.sort) queryParams.append('sort[0][field]', options.sort[0].field);
  if (options.sort) queryParams.append('sort[0][direction]', options.sort[0].direction);

  const response = await fetch(
    `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${tableName}?${queryParams.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Airtable API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.records;
}

// Types for our tables
export interface Author {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string | readonly { url: string }[];
  twitterUrl?: string;
  linkedinUrl?: string;
}

interface AuthorSocial {
  platform: string;
  url: string;
  icon: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  slug: string;
  authorId: string;
  authorImage?: string;
  authorRole?: string;
  authorBio?: string;
  authorSocial?: AuthorSocial[];
  readingTime: number;
  isPopular?: boolean;
  isFeatured?: boolean;
  publishedAt: string;
  tags?: string[];
  featuredImage?: string;
}

export interface KnowledgeBaseArticle {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  category: string;
  slug: string;
  author: string;
  readTime: number;
  publishedAt: string;
  lastUpdated?: string;
  isPopular?: boolean;
  isFeatured?: boolean;
  tags?: string[];
}

export interface App {
  id: string;
  name: string;
  description: string;
  url?: string;
  screenshot?: string;
  status: 'Live' | 'Beta' | 'Alpha' | 'In Development' | 'Coming Soon';
  category?: string;
  feature1?: string;
  feature2?: string;
  feature3?: string;
  launchDate?: string;
  releaseDate?: string;
  domains?: string;
  featureOnWebsite?: boolean;
}

export interface RoadmapFeature {
  id: string;
  name: string;
  description: string;
  status: string;
  milestone: string;
  releaseType: string;
  releasedDate?: string;
  application?: string;
  applicationUrl?: string;
  featuresAndChanges?: string;
  releaseNotes?: string;
}

export interface SystemStatus {
  ticketId: string;
  title: string;
  publicStatus: 'Investigating' | 'Identified' | 'Monitoring' | 'Resolved';
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  message: string;
  'Created Date': string;
  'Updated At': string;
  'Resolved Date': string;
  affectedServices: string[];
  application?: string;
  updates?: string;
}

export interface MarketingPopupConfig {
  title: string;
  content: string;
  buttonText: string;
  buttonLink: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  position: 'Center' | 'Bottom Right' | 'Bottom Left';
  delay: number;
  isEnabled: boolean;
}

// Updated API functions to use server-side fetch
export async function getKnowledgeBaseArticles(): Promise<KnowledgeBaseArticle[]> {
  try {
    const records = await fetchFromAirtable<{
      Title: string;
      Slug: string;
      Content: string;
      Excerpt?: string;
      Category: string;
      Author: string;
      'Read Time': number;
      'Last Updated': string;
      'Is Popular'?: boolean;
      'Is Featured'?: boolean;
      Tags?: string[];
    }>('Knowledge Base');
    
    return records.map(record => ({
      id: record.id,
      title: record.fields.Title,
      slug: record.fields.Slug,
      content: record.fields.Content,
      excerpt: record.fields.Excerpt,
      category: record.fields.Category,
      author: record.fields.Author,
      readTime: record.fields['Read Time'],
      publishedAt: record.fields['Last Updated'],
      lastUpdated: record.fields['Last Updated'],
      isPopular: record.fields['Is Popular'],
      isFeatured: record.fields['Is Featured'],
      tags: record.fields.Tags || [],
    }));
  } catch (error) {
    console.error('Error fetching knowledge base articles:', error);
    return [];
  }
}

export async function getKnowledgeBaseArticle(slug: string): Promise<KnowledgeBaseArticle | null> {
  const base = getAirtableBase();
  if (!base) {
    throw new Error('Airtable not configured');
  }

  try {
    const records = await base('Knowledge Base')
      .select({
        filterByFormula: `{Slug} = '${slug}'`,
      })
      .all();

    if (records.length === 0) {
      return null;
    }

    const record = records[0];
    
    // Debug logging
    console.log('Raw Airtable record:', record.fields);
    console.log('All field names:', Object.keys(record.fields));
    console.log('Published At from Airtable:', record.get('Published At'));
    console.log('Published At type:', typeof record.get('Published At'));
    
    return {
      id: record.id,
      title: record.get('Title') as string,
      slug: record.get('Slug') as string,
      content: record.get('Content') as string,
      excerpt: record.get('Excerpt') as string,
      category: record.get('Category') as string,
      author: record.get('Author') as string,
      readTime: record.get('Read Time') as number,
      publishedAt: record.get('Published At') as string,
      lastUpdated: record.get('Last Updated') as string,
      isPopular: record.get('Is Popular') as boolean,
      isFeatured: record.get('Is Featured') as boolean,
      tags: record.get('Tags') as string[],
    };
  } catch (error) {
    console.error('Error fetching knowledge base article:', error);
    return null;
  }
}

export async function getFeaturedKnowledgeBaseArticles(): Promise<KnowledgeBaseArticle[]> {
  const base = getAirtableBase();
  if (!base) {
    console.warn('Airtable not configured - returning empty array');
    return [];
  }

  try {
    const records = await base('Knowledge Base')
      .select({
        filterByFormula: 'AND({Is Featured} = TRUE(), {Status} = "Published")',
        sort: [{ field: 'Published At', direction: 'desc' }],
        maxRecords: 6,
      })
      .all();
    return records.map(record => ({
      id: record.id,
      title: record.get('Title') as string,
      slug: record.get('Slug') as string,
      content: record.get('Content') as string,
      excerpt: record.get('Excerpt') as string,
      category: record.get('Category') as string,
      author: record.get('Author') as string,
      readTime: record.get('Read Time') as number,
      publishedAt: record.get('Published At') as string,
      lastUpdated: record.get('Last Updated') as string,
      isPopular: record.get('Is Popular') as boolean,
      isFeatured: record.get('Is Featured') as boolean,
      tags: record.get('Tags') as string[],
    }));
  } catch (error) {
    console.error('Error fetching featured knowledge base articles:', error);
    return [];
  }
}

export async function getApps(): Promise<App[]> {
  try {
    const records = await fetchFromAirtable<{
      Name: string;
      Description: string;
      URL?: string;
      'Image URL'?: string;
      'Application Status': App['status'];
      Category?: string;
      'Feature 1'?: string;
      'Feature 2'?: string;
      'Feature 3'?: string;
      'Launch Date'?: string;
      'Released Date'?: string;
      'Domain(s)'?: string;
      'Feature On Website?'?: boolean;
    }>('Apps', {
      sort: [{ field: 'Name', direction: 'asc' }]
    });
    
    return records.map(record => ({
      id: record.id,
      name: record.fields.Name,
      description: record.fields.Description,
      url: record.fields.URL,
      screenshot: record.fields['Image URL'],
      status: record.fields['Application Status'],
      category: record.fields.Category,
      feature1: record.fields['Feature 1'],
      feature2: record.fields['Feature 2'],
      feature3: record.fields['Feature 3'],
      launchDate: record.fields['Launch Date'],
      releaseDate: record.fields['Released Date'],
      domains: record.fields['Domain(s)'],
      featureOnWebsite: record.fields['Feature On Website?'],
    }));
  } catch (error) {
    console.error('Error fetching apps from Airtable:', error);
    return [];
  }
}

export async function getRoadmapFeatures(): Promise<RoadmapFeature[]> {
  try {
    const records = await fetchFromAirtable<{
      Name: string;
      Description: string;
      Status: string;
      Milestone: string;
      'Release Type': string;
      'Released Date': string;
      Application: string;
      'Application URL': string;
      'Features and Changes': string;
      'Release Notes': string;
    }>('Roadmap', {
      sort: [{ field: 'Released Date', direction: 'desc' }]
    });

    return records.map(record => ({
      id: record.id,
      name: record.fields.Name,
      description: record.fields.Description,
      status: record.fields.Status,
      milestone: record.fields.Milestone,
      releaseType: record.fields['Release Type'],
      releasedDate: record.fields['Released Date'],
      application: record.fields.Application,
      applicationUrl: record.fields['Application URL'],
      featuresAndChanges: record.fields['Features and Changes'],
      releaseNotes: record.fields['Release Notes'],
    }));
  } catch (error) {
    console.error('Error fetching roadmap features:', error);
    return [];
  }
}

export async function getSystemStatus(): Promise<SystemStatus[]> {
  try {
    const records = await fetchFromAirtable<{
      'Ticket ID': string;
      Title: string;
      'Public Status': 'Investigating' | 'Identified' | 'Monitoring' | 'Resolved';
      Severity: 'Critical' | 'High' | 'Medium' | 'Low';
      Message: string;
      'Created Date': string;
      'Updated At': string;
      'Resolved Date': string;
      'Affected Services': string[];
      Application: string;
      Updates: string;
    }>('System Status', {
      sort: [{ field: 'Created Date', direction: 'desc' }]
    });

    return records.map(record => ({
      ticketId: record.fields['Ticket ID'],
      title: record.fields.Title,
      publicStatus: record.fields['Public Status'],
      severity: record.fields.Severity,
      message: record.fields.Message,
      'Created Date': record.fields['Created Date'],
      'Updated At': record.fields['Updated At'],
      'Resolved Date': record.fields['Resolved Date'],
      affectedServices: record.fields['Affected Services'],
      application: record.fields.Application,
      updates: record.fields.Updates,
    }));
  } catch (error) {
    console.error('Error fetching system status:', error);
    return [];
  }
}

// Admin functions for content management
export async function updateContentStatus(
  table: 'Blog Posts' | 'Knowledge Base' | 'Apps',
  recordId: string,
  status: string
): Promise<boolean> {
  const base = getAirtableBase();
  if (!base) {
    console.warn('Airtable not configured - cannot update status');
    return false;
  }

  try {
    await base(table).update(recordId, {
      status,
    });
    return true;
  } catch (error) {
    console.error(`Error updating status for ${table}:`, error);
    return false;
  }
}

// Get all content regardless of status (for admin use)
export async function getAllContent<T extends BlogPost | KnowledgeBaseArticle | App>(
  table: 'Blog Posts' | 'Knowledge Base' | 'Apps'
): Promise<T[]> {
  const base = getAirtableBase();
  if (!base) {
    console.warn('Airtable not configured - cannot fetch all content');
    return [];
  }

  const records = await base(table)
    .select({
      sort: [{ field: 'status', direction: 'asc' }],
    })
    .all();

  return records.map((record) => ({
    id: record.id,
    ...record.fields,
  })) as T[];
}

export async function getAirtableRecords<T>(tableName: string, options: { filterByFormula?: string; sort?: { field: string; direction: string }[]; maxRecords?: number } = {}): Promise<AirtableRecord<T>[]> {
  try {
    return await fetchFromAirtable<T>(tableName, options);
  } catch (error) {
    console.error(`Error fetching records from ${tableName}:`, error);
    throw error;
  }
}

export async function getMarketingPopupConfig(options: { signal?: AbortSignal } = {}): Promise<MarketingPopupConfig | null> {
  const base = getAirtableBase();
  if (!base) {
    console.warn('Airtable not configured - cannot fetch marketing popup config');
    return null;
  }

  try {
    const records = await base('Marketing Popups')
      .select({
        filterByFormula: 'AND({Is Enabled}=TRUE(),{Start Date}<=NOW(),{End Date}>=NOW())',
        maxRecords: 1,
      })
      .firstPage();

    if (records.length === 0) return null;

    const record = records[0];
    return {
      title: record.get('Title') as string,
      content: record.get('Content') as string,
      buttonText: record.get('Button Text') as string,
      buttonLink: record.get('Button Link') as string,
      backgroundColor: record.get('Background Color') as string,
      textColor: record.get('Text Color') as string,
      buttonColor: record.get('Button Color') as string,
      position: record.get('Position') as 'Center' | 'Bottom Right' | 'Bottom Left',
      delay: record.get('Delay') as number,
      isEnabled: record.get('Is Enabled') as boolean,
    };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Request was aborted');
      return null;
    }
    console.error('Error fetching marketing popup config:', error);
    return null;
  }
}

// Helper function to get social media icon based on URL
function getSocialIcon(url: string): string {
  if (url.includes('twitter.com') || url.includes('x.com')) {
    return `<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>`;
  }
  if (url.includes('linkedin.com')) {
    return `<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>`;
  }
  if (url.includes('github.com')) {
    return `<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>`;
  }
  return `<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-2 16h-2v-6h2v6zm-1-6.891c-.607 0-1.1-.496-1.1-1.109 0-.612.492-1.109 1.1-1.109s1.1.497 1.1 1.109c0 .613-.492 1.109-1.1 1.109zm8 6.891h-1.998v-2.861c0-1.881-2.002-1.722-2.002 0v2.861h-2v-6h2v1.093c.872-1.616 4-1.736 4 1.548v3.359z"/>
  </svg>`;
} 