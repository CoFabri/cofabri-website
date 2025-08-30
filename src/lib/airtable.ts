import { FieldSet, Attachment, Thumbnail } from 'airtable';
import { Collaborator } from 'airtable';

const AIRTABLE_API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

export interface AirtableRecord<T> {
  id: string;
  fields: T;
  createdTime: string;
}

interface AirtableFields extends FieldSet {
  [key: string]: any;
}

// Server-side fetch function for Airtable
export async function fetchFromAirtable<T extends AirtableFields>(
  table: string,
  options: {
    filterByFormula?: string;
    sort?: { field: string; direction: string }[];
    maxRecords?: number;
  } = {}
): Promise<AirtableRecord<T>[]> {
  try {
    const url = new URL(`${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${encodeURIComponent(table)}`);
    
    // Add query parameters
    if (options.filterByFormula) {
      url.searchParams.append('filterByFormula', options.filterByFormula);
    }
    if (options.sort) {
      url.searchParams.append('sort[0][field]', options.sort[0].field);
      url.searchParams.append('sort[0][direction]', options.sort[0].direction);
    }
    if (options.maxRecords) {
      url.searchParams.append('maxRecords', options.maxRecords.toString());
    }
    
    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Airtable API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        url: url.toString()
      });
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.records;
  } catch (error) {
    console.error(`Error fetching from Airtable table ${table}:`, error);
    throw error;
  }
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
  applications?: string[];
  logoUrl?: string;
  relatedTopics?: string[] | string;
}

export interface App {
  id: string;
  name: string;
  description?: string;
  url?: string;
  screenshot?: string;
  faviconUrl?: string;
  status: 'Live' | 'Beta' | 'Alpha' | 'Active' | 'In Development' | 'Coming Soon';
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

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
  image: string; // Now a URL string
  isActive: boolean;
  order: number;
  createdAt: string;
  apps: string[];
  featured: boolean;
}

export interface LegalDocument {
  id: string;
  title: string;
  description?: string;
  documentType: string;
  status: 'Active' | 'Draft' | 'Archived';
  version: string;
  lastUpdated: string;
  documentUrl?: string;
  associatedApp?: string;
  category?: string;
  isPublic: boolean;
  tags?: string[];
}

// Updated API functions to use server-side fetch
export async function getKnowledgeBaseArticles(): Promise<KnowledgeBaseArticle[]> {
  try {
    console.log('Fetching knowledge base articles from Airtable...');
    const records = await fetchFromAirtable<{
      'Title': string;
      'Slug': string;
      'Content': string;
      'Excerpt'?: string;
      'Category': string;
      'Author': string;
      'Read Time': number;
      'Last Updated': string;
      'Is Popular'?: boolean;
      'Is Featured'?: boolean;
      'Tags'?: string[];
      'Application(s)'?: string[] | string;
      'Logo URL'?: string;
    }>('Knowledge Base', {
      filterByFormula: '{Status} = "Published"'
    });
    
    console.log(`Found ${records.length} published knowledge base articles`);
    
    const articles = records.map(record => {
      try {
        // Handle applications field - could be string or array
        let applications: string[] = [];
        if (record.fields['Application(s)']) {
          if (Array.isArray(record.fields['Application(s)'])) {
            applications = record.fields['Application(s)'];
          } else {
            applications = [record.fields['Application(s)']];
          }
        }

        return {
          id: record.id,
          title: record.fields['Title'],
          slug: record.fields['Slug'],
          content: record.fields['Content'],
          excerpt: record.fields['Excerpt'],
          category: record.fields['Category'],
          author: record.fields['Author'],
          readTime: record.fields['Read Time'],
          publishedAt: record.fields['Last Updated'],
          lastUpdated: record.fields['Last Updated'],
          isPopular: record.fields['Is Popular'],
          isFeatured: record.fields['Is Featured'],
          tags: record.fields['Tags'] || [],
          applications: applications,
          logoUrl: record.fields['Logo URL'],
        };
      } catch (error) {
        console.error(`Error processing knowledge base article ${record.id}:`, error);
        console.error('Record fields:', record.fields);
        return null;
      }
    }).filter(Boolean) as KnowledgeBaseArticle[];
    
    console.log(`Successfully processed ${articles.length} knowledge base articles`);
    return articles;
  } catch (error) {
    console.error('Error fetching knowledge base articles:', error);
    return [];
  }
}

export async function getKnowledgeBaseArticle(slug: string): Promise<KnowledgeBaseArticle | null> {
  try {
    const records = await fetchFromAirtable<{
      'Title': string;
      'Slug': string;
      'Content': string;
      'Excerpt': string;
      'Category': string;
      'Author': string;
      'Read Time': number;
      'Last Updated': string;
      'Is Popular': boolean;
      'Is Featured': boolean;
      'Tags': string[];
      'Application(s)'?: string[] | string;
      'Logo URL'?: string;
      'Related Topics'?: string[] | string;
    }>('Knowledge Base', {
      filterByFormula: `AND({Slug} = '${slug}', {Status} = "Published")`,
    });

    if (records.length === 0) {
      console.log(`No published article found with slug: ${slug}`);
      return null;
    }

    const record = records[0];
    
    try {
      // Handle applications field - could be string or array
      let applications: string[] = [];
      if (record.fields['Application(s)']) {
        if (Array.isArray(record.fields['Application(s)'])) {
          applications = record.fields['Application(s)'];
        } else {
          applications = [record.fields['Application(s)']];
        }
      }

      return {
        id: record.id,
        title: record.fields['Title'],
        slug: record.fields['Slug'],
        content: record.fields['Content'],
        excerpt: record.fields['Excerpt'],
        category: record.fields['Category'],
        author: record.fields['Author'],
        readTime: record.fields['Read Time'],
        publishedAt: record.fields['Last Updated'],
        lastUpdated: record.fields['Last Updated'],
        isPopular: record.fields['Is Popular'],
        isFeatured: record.fields['Is Featured'],
        tags: record.fields['Tags'],
        applications: applications,
        logoUrl: record.fields['Logo URL'],
        relatedTopics: record.fields['Related Topics'],
      };
    } catch (error) {
      console.error(`Error processing knowledge base article ${record.id}:`, error);
      console.error('Record fields:', record.fields);
      return null;
    }
  } catch (error) {
    console.error('Error fetching knowledge base article:', error);
    return null;
  }
}

export async function getKnowledgeBaseArticlesBySlugs(slugs: string[]): Promise<KnowledgeBaseArticle[]> {
  try {
    if (slugs.length === 0) return [];
    
    // Create filter formula for multiple slugs
    const slugFilters = slugs.map(slug => `{Slug} = '${slug}'`).join(', ');
    const filterFormula = `AND(OR(${slugFilters}), {Status} = "Published")`;
    
    const records = await fetchFromAirtable<{
      'Title': string;
      'Slug': string;
      'Content': string;
      'Excerpt': string;
      'Category': string;
      'Author': string;
      'Read Time': number;
      'Last Updated': string;
      'Is Popular': boolean;
      'Is Featured': boolean;
      'Tags': string[];
      'Application(s)'?: string[] | string;
      'Logo URL'?: string;
      'Related Topics'?: string[] | string;
    }>('Knowledge Base', {
      filterByFormula: filterFormula,
    });

    return records.map(record => {
      // Handle applications field - could be string or array
      let applications: string[] = [];
      if (record.fields['Application(s)']) {
        if (Array.isArray(record.fields['Application(s)'])) {
          applications = record.fields['Application(s)'];
        } else {
          applications = [record.fields['Application(s)']];
        }
      }

      return {
        id: record.id,
        title: record.fields['Title'],
        slug: record.fields['Slug'],
        content: record.fields['Content'],
        excerpt: record.fields['Excerpt'],
        category: record.fields['Category'],
        author: record.fields['Author'],
        readTime: record.fields['Read Time'],
        publishedAt: record.fields['Last Updated'],
        lastUpdated: record.fields['Last Updated'],
        isPopular: record.fields['Is Popular'],
        isFeatured: record.fields['Is Featured'],
        tags: record.fields['Tags'],
        applications: applications,
        logoUrl: record.fields['Logo URL'],
        relatedTopics: record.fields['Related Topics'],
      };
    });
  } catch (error) {
    console.error('Error fetching knowledge base articles by slugs:', error);
    return [];
  }
}

export async function getFeaturedKnowledgeBaseArticles(): Promise<KnowledgeBaseArticle[]> {
  try {
    const records = await fetchFromAirtable<{
      'Title': string;
      'Slug': string;
      'Content': string;
      'Excerpt': string;
      'Category': string;
      'Author': string;
      'Read Time': number;
      'Last Updated': string;
      'Is Popular': boolean;
      'Is Featured': boolean;
      'Tags': string[];
      'Application(s)'?: string[] | string;
      'Logo URL'?: string;
    }>('Knowledge Base', {
      filterByFormula: 'AND({Is Featured} = TRUE(), {Status} = "Published")',
      sort: [{ field: 'Last Updated', direction: 'desc' }],
      maxRecords: 6,
    });

    return records.map(record => {
      // Handle applications field - could be string or array
      let applications: string[] = [];
      if (record.fields['Application(s)']) {
        if (Array.isArray(record.fields['Application(s)'])) {
          applications = record.fields['Application(s)'];
        } else {
          applications = [record.fields['Application(s)']];
        }
      }

      return {
        id: record.id,
        title: record.fields['Title'],
        slug: record.fields['Slug'],
        content: record.fields['Content'],
        excerpt: record.fields['Excerpt'],
        category: record.fields['Category'],
        author: record.fields['Author'],
        readTime: record.fields['Read Time'],
        publishedAt: record.fields['Last Updated'],
        lastUpdated: record.fields['Last Updated'],
        isPopular: record.fields['Is Popular'],
        isFeatured: record.fields['Is Featured'],
        tags: record.fields['Tags'],
        applications: applications,
        logoUrl: record.fields['Logo URL'],
      };
    });
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
      'Featured Image URL'?: string | readonly { url: string }[];
      'Favicon URL'?: string;
      'Application Status': App['status'];
      Category?: string;
      'Feature 1'?: string;
      'Feature 2'?: string;
      'Feature 3'?: string;
      'Launch Date'?: string;
      'Released Date'?: string;
      'Domain(s)'?: string;
      'Featured App?'?: boolean;
      [key: string]: any;
    }>('Apps', {
      sort: [{ field: 'Name', direction: 'asc' }]
    });
    
    const apps = records.map(record => {
      
      // Handle featured image URL (string or attachment array)
      let screenshot: string | undefined;
      const featuredImageField = record.fields['Featured Image URL'];
      if (featuredImageField) {
        if (typeof featuredImageField === 'string') {
          // String URL
          try {
            new URL(featuredImageField);
            screenshot = featuredImageField;
          } catch (e) {
            console.warn(`Invalid featured image URL for app ${record.fields.Name}:`, featuredImageField);
            screenshot = '/images/placeholder.jpg';
          }
        } else if (Array.isArray(featuredImageField) && featuredImageField.length > 0 && featuredImageField[0].url) {
          // Attachment array
          try {
            new URL(featuredImageField[0].url);
            screenshot = featuredImageField[0].url;
          } catch (e) {
            console.warn(`Invalid featured image attachment for app ${record.fields.Name}:`, featuredImageField[0].url);
            screenshot = '/images/placeholder.jpg';
          }
        } else {
          screenshot = '/images/placeholder.jpg';
        }
      } else {
        screenshot = '/images/placeholder.jpg';
      }

      // Handle favicon URL
      let faviconUrl: string | undefined;
      const faviconField = record.fields['Favicon URL'];
      if (faviconField) {
        try {
          new URL(faviconField);
          faviconUrl = faviconField;
        } catch (e) {
          console.warn(`Invalid favicon URL for app ${record.fields.Name}:`, faviconField);
        }
      }

      // Validate app URL
      let appUrl = record.fields.URL;
      try {
        if (appUrl && !appUrl.startsWith('http')) {
          appUrl = `https://${appUrl}`;
        }
        if (appUrl) {
          const url = new URL(appUrl);
          // Check if the URL has a valid hostname (not just protocol)
          if (!url.hostname || url.hostname === '') {
            throw new Error('Invalid hostname');
          }
        }
      } catch (e) {
        console.warn(`Invalid app URL for ${record.fields.Name}:`, appUrl);
        appUrl = undefined;
      }
      
      return {
        id: record.id,
        name: record.fields.Name,
        description: record.fields.Description || 'No description available',
        url: appUrl,
        screenshot,
        faviconUrl,
        status: record.fields['Application Status'],
        category: record.fields.Category,
        feature1: record.fields['Feature 1'],
        feature2: record.fields['Feature 2'],
        feature3: record.fields['Feature 3'],
        launchDate: record.fields['Launch Date'],
        releaseDate: record.fields['Released Date'],
        domains: record.fields['Domain(s)'],
        featureOnWebsite: record.fields['Featured App?'],
      };
    });
    
    return apps;
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
      sort: [
        { field: 'Milestone', direction: 'asc' },
        { field: 'Released Date', direction: 'desc' }
      ]
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
  table: 'Knowledge Base' | 'Apps',
  recordId: string,
  status: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${table}/${recordId}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: { status }
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error(`Error updating status for ${table}:`, error);
    return false;
  }
}

// Get all content regardless of status (for admin use)
export async function getAllContent<T extends KnowledgeBaseArticle | App>(
  table: 'Knowledge Base' | 'Apps'
): Promise<T[]> {
  try {
    const records = await fetchFromAirtable<T>(table, {
      sort: [{ field: 'status', direction: 'asc' }],
    });

    return records.map((record) => ({
      ...record.fields,
      id: record.id,
    })) as T[];
  } catch (error) {
    console.error(`Error fetching all content from ${table}:`, error);
    return [];
  }
}

export async function getAirtableRecords<T extends AirtableFields>(tableName: string, options: { filterByFormula?: string; sort?: { field: string; direction: string }[]; maxRecords?: number } = {}): Promise<AirtableRecord<T>[]> {
  try {
    return await fetchFromAirtable<T>(tableName, options);
  } catch (error) {
    console.error(`Error fetching records from ${tableName}:`, error);
    throw error;
  }
}

export async function getMarketingPopupConfig(options: { signal?: AbortSignal } = {}): Promise<MarketingPopupConfig | null> {
  try {
    // Get all enabled marketing popups
    const enabledRecords = await fetchFromAirtable<{
      Title: string;
      Content: string;
      'Button Text': string;
      'Button Link': string;
      'Background Color': string;
      'Text Color': string;
      'Button Color': string;
      Position: 'Center' | 'Bottom Right' | 'Bottom Left';
      Delay: number;
      'Is Enabled': boolean;
      'Start Date': string;
      'End Date': string;
      [key: string]: any;
    }>('Marketing Popups', {
      filterByFormula: '{Is Enabled}=TRUE()',
      maxRecords: 10,
    });

    if (enabledRecords.length === 0) return null;

    // Manually filter by date since Airtable's NOW() function can be unreliable
    const now = new Date();
    const validRecords = enabledRecords.filter(r => {
      const startDate = new Date(r.fields['Start Date']);
      const endDate = new Date(r.fields['End Date']);
      return now >= startDate && now <= endDate;
    });

    if (validRecords.length === 0) return null;

    // Use the first valid record
    const record = validRecords[0];

    // Validate button link URL
    let buttonLink = record.fields['Button Link'];
    try {
      if (buttonLink && !buttonLink.startsWith('http')) {
        buttonLink = `https://${buttonLink}`;
      }
      if (buttonLink) {
        new URL(buttonLink);
      }
    } catch (e) {
      console.warn(`Invalid button link URL for popup ${record.id}:`, buttonLink);
      buttonLink = '/';
    }

    return {
      title: record.fields.Title,
      content: record.fields.Content,
      buttonText: record.fields['Button Text'],
      buttonLink,
      backgroundColor: record.fields['Background Color'] || '#ffffff',
      textColor: record.fields['Text Color'] || '#000000',
      buttonColor: record.fields['Button Color'] || '#000000',
      position: record.fields.Position || 'Center',
      delay: (record.fields.Delay || 0) * 1000, // Convert seconds to milliseconds
      isEnabled: true, // Since we're filtering for enabled popups, this will always be true
    };
  } catch (error) {
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

export async function getTestimonials(randomCount?: number): Promise<Testimonial[]> {
  try {
    const records = await fetchFromAirtable<{
      Name: string;
      'Role/Position': string;
      Company: string;
      Content: string;
      Rating: number;
      'Profile Image URL'?: string;
      'Active?': boolean;
      Order: number;
      Created: string;
      Apps: string[];
      'Featured?': boolean;
    }>('Testimonials', {
      filterByFormula: '{Active?} = TRUE()',
      sort: [{ field: 'Featured?', direction: 'desc' }]
    });

    const testimonials = records.map(record => ({
      id: record.id,
      name: record.fields.Name,
      role: record.fields['Role/Position'],
      company: record.fields.Company,
      content: record.fields.Content,
      rating: record.fields.Rating,
      image: record.fields['Profile Image URL'] || '/images/placeholder.jpg',
      isActive: record.fields['Active?'],
      order: record.fields.Order,
      createdAt: record.fields.Created,
      apps: record.fields.Apps,
      featured: record.fields['Featured?']
    }));

    if (randomCount && randomCount > 0) {
      // Separate featured and non-featured testimonials
      const featured = testimonials.filter(t => t.featured);
      const nonFeatured = testimonials.filter(t => !t.featured);

      // Shuffle both arrays
      const shuffle = (array: Testimonial[]) => {
        for (let i = array.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      };

      const shuffledFeatured = shuffle([...featured]);
      const shuffledNonFeatured = shuffle([...nonFeatured]);

      // If we have enough featured testimonials, use them
      if (shuffledFeatured.length >= randomCount) {
        return shuffledFeatured.slice(0, randomCount);
      }

      // Otherwise, combine featured and non-featured
      return [...shuffledFeatured, ...shuffledNonFeatured].slice(0, randomCount);
    }

    return testimonials;
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
}

export async function getLegalDocuments(): Promise<LegalDocument[]> {
  try {
    const records = await fetchFromAirtable<{
      'Document Name': string;
      'Document Type': string;
      'Status': 'Active' | 'Draft' | 'Archived';
      'Effective Date'?: string;
      'Expiration/Renewal...'?: string;
      'Attachment'?: string | readonly { url: string }[];
      'Associated App'?: string[] | string;
      'Version'?: string | number;
      'Last Updated'?: string;
    }>('Contracts & Legal Docs', {
      filterByFormula: '{Status} = "Active"',
      sort: [{ field: 'Effective Date', direction: 'desc' }]
    });

    // Get all apps to resolve app names
    const apps = await getApps();
    const appMap = new Map(apps.map(app => [app.id, app.name]));

    return records.map(record => {
      // Handle attachment field - could be string URL or attachment array
      let documentUrl: string | undefined;
      const attachmentField = record.fields['Attachment'];
      if (attachmentField) {
        if (typeof attachmentField === 'string') {
          documentUrl = attachmentField;
        } else if (Array.isArray(attachmentField) && attachmentField.length > 0 && attachmentField[0].url) {
          documentUrl = attachmentField[0].url;
        }
      }

      // Resolve associated app names
      let associatedApp: string | undefined;
      const associatedAppField = record.fields['Associated App'];
      
      // Try different field name variations
      const appField = associatedAppField || (record.fields as any)['App'] || (record.fields as any)['Application'];
      
      if (appField) {
        let associatedAppIds: string[] = [];
        if (Array.isArray(appField)) {
          associatedAppIds = appField;
        } else if (typeof appField === 'string') {
          associatedAppIds = [appField];
        }
        
              if (associatedAppIds.length > 0) {
        const appName = appMap.get(associatedAppIds[0]);
        if (appName) {
          associatedApp = appName;
        }
      }
         }
     
     // Fallback: Extract app name from document title
     if (!associatedApp) {
       const title = record.fields['Document Name'];
       if (title.includes('CertiFi Central')) {
         associatedApp = 'CertiFi Central';
       } else if (title.includes('RePrisma')) {
         associatedApp = 'RePrisma';
       } else if (title.includes('Ayden')) {
         associatedApp = 'Ayden';
       } else if (title.includes('CoFabri')) {
         associatedApp = 'CoFabri';
       }
     }

      return {
        id: record.id,
        title: record.fields['Document Name'],
        description: undefined, // Not available in the table
        documentType: record.fields['Document Type'],
        status: record.fields['Status'],
        version: String(record.fields['Version'] || '1.0'),
        lastUpdated: record.fields['Last Updated'] || record.fields['Effective Date'] || new Date().toISOString(),
        documentUrl: documentUrl,
        associatedApp: associatedApp,
        category: undefined, // Not available in the table
        isPublic: true, // Assuming all active documents are public
        tags: [], // Not available in the table
      };
    });
  } catch (error) {
    console.error('Error fetching legal documents:', error);
    return [];
  }
}

export async function getLegalDocument(id: string): Promise<LegalDocument | null> {
  try {
    const records = await fetchFromAirtable<{
      'Document Name': string;
      'Document Type': string;
      'Status': 'Active' | 'Draft' | 'Archived';
      'Effective Date'?: string;
      'Expiration/Renewal...'?: string;
      'Attachment'?: string | readonly { url: string }[];
      'Associated App'?: string[] | string;
      'Version'?: string | number;
      'Last Updated'?: string;
    }>('Contracts & Legal Docs', {
      filterByFormula: `AND(RECORD_ID() = '${id}', {Status} = "Active")`
    });

    if (records.length === 0) {
      return null;
    }

    const record = records[0];
    
    // Get all apps to resolve app names
    const apps = await getApps();
    const appMap = new Map(apps.map(app => [app.id, app.name]));
    
    // Handle attachment field - could be string URL or attachment array
    let documentUrl: string | undefined;
    const attachmentField = record.fields['Attachment'];
    if (attachmentField) {
      if (typeof attachmentField === 'string') {
        documentUrl = attachmentField;
      } else if (Array.isArray(attachmentField) && attachmentField.length > 0 && attachmentField[0].url) {
        documentUrl = attachmentField[0].url;
      }
    }

    // Resolve associated app names
    let associatedApp: string | undefined;
    const associatedAppField = record.fields['Associated App'];
    
    // Try different field name variations
    const appField = associatedAppField || (record.fields as any)['App'] || (record.fields as any)['Application'];
    
    if (appField) {
      let associatedAppIds: string[] = [];
      if (Array.isArray(appField)) {
        associatedAppIds = appField;
      } else if (typeof appField === 'string') {
        associatedAppIds = [appField];
      }
      
      if (associatedAppIds.length > 0) {
        const appName = appMap.get(associatedAppIds[0]);
        if (appName) {
          associatedApp = appName;
        }
      }
    }

    return {
      id: record.id,
      title: record.fields['Document Name'],
      description: undefined, // Not available in the table
      documentType: record.fields['Document Type'],
      status: record.fields['Status'],
      version: String(record.fields['Version'] || '1.0'),
      lastUpdated: record.fields['Last Updated'] || record.fields['Effective Date'] || new Date().toISOString(),
      documentUrl: documentUrl,
      associatedApp: associatedApp,
      category: undefined, // Not available in the table
      isPublic: true, // Assuming all active documents are public
      tags: [], // Not available in the table
    };
  } catch (error) {
    console.error('Error fetching legal document:', error);
    return null;
  }
} 