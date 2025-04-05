import Airtable from 'airtable';
import { FieldSet } from 'airtable';
import { Collaborator } from 'airtable';

const AIRTABLE_API_KEY = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

// Create a function to get the Airtable base instance
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
  slug: string;
  content: string;
  excerpt?: string;
  category: string;
  author: string;
  readTime: number;
  publishedAt: string;
  lastUpdated?: string;
  isPopular?: boolean;
  isFeatured?: boolean;
  tags: string[];
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

// API functions that handle the case when Airtable is not configured
export async function getBlogPosts(): Promise<BlogPost[]> {
  const base = getAirtableBase();
  if (!base) {
    console.warn('Airtable not configured - returning empty array');
    return [];
  }

  try {
    const records = await base('Blog Posts').select().all();
    return records.map(record => ({
      id: record.id,
      title: record.get('Title') as string,
      slug: record.get('Slug') as string,
      content: record.get('Content') as string,
      excerpt: record.get('Excerpt') as string,
      featuredImage: record.get('Featured Image') as string,
      authorId: record.get('Author') as string,
      category: record.get('Category') as string,
      readingTime: record.get('Reading Time') as number,
      publishedAt: record.get('Published At') as string,
      tags: record.get('Tags') as string[],
      isFeatured: record.get('Is Featured') as boolean,
      relatedPostIds: record.get('Related Posts') as string[],
    }));
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return [];
  }
}

export async function getKnowledgeBaseArticles(): Promise<KnowledgeBaseArticle[]> {
  console.log('Getting Airtable base...');
  const base = getAirtableBase();
  if (!base) {
    console.warn('Airtable not configured - returning empty array');
    return [];
  }

  try {
    console.log('Fetching records from Knowledge Base table...');
    const records = await base('Knowledge Base').select().all();
    console.log('Fetched records:', records);
    return records.map(record => ({
      id: record.id,
      title: record.get('Title') as string,
      slug: record.get('Slug') as string,
      content: record.get('Content') as string,
      excerpt: record.get('Excerpt') as string,
      category: record.get('Category') as string,
      author: record.get('Author') as string,
      readTime: record.get('Read Time') as number,
      publishedAt: record.get('Last Updated') as string,
      lastUpdated: record.get('Last Updated') as string,
      isPopular: record.get('Is Popular') as boolean,
      isFeatured: record.get('Is Featured') as boolean,
      tags: record.get('Tags') as string[],
    }));
  } catch (error) {
    console.error('Error fetching knowledge base articles:', error);
    return [];
  }
}

export async function getApps(): Promise<App[]> {
  if (!process.env.AIRTABLE_BASE_ID || !process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN) {
    throw new Error('Airtable configuration is missing');
  }

  try {
    const base = new Airtable({
      apiKey: process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN,
    }).base(process.env.AIRTABLE_BASE_ID);

    const records = await base('Apps').select().all();
    console.log('Raw Airtable records:', records.map(record => ({
      id: record.id,
      fields: record.fields,
      rawLaunch: record.get('Launch Date'),
      rawLaunchDate: record.get('Launch'),
      allFields: Object.keys(record.fields)
    })));
    return records.map((record): App => ({
      id: record.id,
      name: record.get('Name') as string,
      description: record.get('Description') as string,
      url: record.get('URL') as string,
      screenshot: record.get('Image URL') as string,
      status: record.get('Application Status') as App['status'],
      category: record.get('Category') as string,
      feature1: record.get('Feature 1') as string,
      feature2: record.get('Feature 2') as string,
      feature3: record.get('Feature 3') as string,
      launchDate: record.get('Launch Date') as string,
      releaseDate: record.get('Released Date') as string,
      domains: record.get('Domain(s)') as string,
      featureOnWebsite: record.get('Feature On Website?') as boolean,
    }));
  } catch (error) {
    console.error('Error fetching apps from Airtable:', error);
    throw error;
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

export async function getRoadmapFeatures(): Promise<RoadmapFeature[]> {
  const base = getAirtableBase();
  if (!base) {
    console.warn('Airtable not configured - returning empty array');
    return [];
  }

  try {
    const records = await base('Roadmap').select().all();
    return records.map(record => ({
      id: record.id,
      name: record.get('Name') as string,
      description: record.get('Description') as string,
      status: record.get('Status') as string,
      milestone: record.get('Milestone') as string,
      releaseType: record.get('Release Type') as string,
      releasedDate: record.get('Released Date') as string,
      application: record.get('Application') as string,
      applicationUrl: record.get('Application URL') as string,
      featuresAndChanges: record.get('Features and Changes') as string,
      releaseNotes: record.get('Release Notes') as string,
    }));
  } catch (error) {
    console.error('Error fetching roadmap features:', error);
    return [];
  }
}

export async function getSystemStatus(): Promise<SystemStatus[]> {
  const base = getAirtableBase();
  if (!base) {
    console.warn('Airtable not configured - returning empty array');
    return [];
  }

  try {
    const records = await base('System Status').select().all();
    return records.map(record => ({
      ticketId: record.get('Ticket ID') as string,
      title: record.get('Title') as string,
      publicStatus: record.get('Public Status') as 'Investigating' | 'Identified' | 'Monitoring' | 'Resolved',
      severity: record.get('Severity') as 'Critical' | 'High' | 'Medium' | 'Low',
      message: record.get('Message') as string,
      'Created Date': record.get('Created Date') as string,
      'Updated At': record.get('Updated At') as string,
      'Resolved Date': record.get('Resolved Date') as string,
      affectedServices: record.get('Affected Services') as string[],
      application: record.get('Application') as string,
      updates: record.get('Updates') as string,
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

export async function getAirtableRecords(tableName: string) {
  const base = getAirtableBase();
  if (!base) {
    console.warn('Airtable not configured - cannot fetch records');
    throw new Error('Airtable not configured');
  }

  const table = base(tableName);
  
  try {
    const records = await table.select().all();
    return records;
  } catch (error) {
    console.error(`Error fetching records from ${tableName}:`, error);
    throw error;
  }
}

export async function getMarketingPopupConfig(): Promise<MarketingPopupConfig | null> {
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
    console.error('Error fetching marketing popup config:', error);
    return null;
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const base = getAirtableBase();
  if (!base) {
    console.warn('Airtable not configured - cannot fetch blog post');
    return null;
  }

  try {
    const records = await base('Blog Posts')
      .select({
        filterByFormula: `{Slug} = '${slug}'`,
        maxRecords: 1
      })
      .firstPage();

    if (!records || records.length === 0) {
      return null;
    }

    const record = records[0];
    const fields = record.fields as Record<string, any>;

    // If this is a blog post, fetch the author data
    if (fields.Author) {
      const authorId = Array.isArray(fields.Author) ? fields.Author[0] : fields.Author;
      try {
        const authorRecord = await base('Authors').find(authorId);
        const authorFields = authorRecord.fields as Record<string, any>;
        
        fields.Author = {
          Name: authorFields.Name as string,
          Role: authorFields.Role as string,
          Bio: authorFields.Bio as string,
          Image: Array.isArray(authorFields.Image) && authorFields.Image.length > 0 
            ? [{ url: (authorFields.Image[0] as any).url }] 
            : undefined,
          'Social Links': authorFields['Social Links'] as string[]
        };
      } catch (error) {
        console.error('Error fetching author:', error);
      }
    }

    return {
      id: record.id,
      title: fields.Title as string,
      content: fields.Content as string,
      excerpt: fields.Excerpt as string,
      category: fields.Category as string,
      slug: fields.Slug as string,
      authorId: fields.Author?.Name || 'Unknown Author',
      authorImage: fields.Author?.Image?.[0]?.url,
      authorRole: fields.Author?.Role,
      authorBio: fields.Author?.Bio,
      authorSocial: fields.Author?.['Social Links']?.map((link: string) => ({
        platform: link.split('/').pop() || '',
        url: link,
        icon: getSocialIcon(link)
      })),
      readingTime: fields['Reading Time'] as number,
      isPopular: fields['Is Popular'] as boolean,
      isFeatured: fields['Is Featured'] as boolean,
      publishedAt: fields['Published At'] as string,
      tags: fields.Tags as string[],
      featuredImage: fields['Featured Image']?.[0]?.url
    };
  } catch (error) {
    console.error('Error fetching blog post:', error);
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

export async function getRelatedPosts(currentPost: BlogPost, limit: number = 3): Promise<BlogPost[]> {
  const base = getAirtableBase();
  if (!base) {
    console.warn('Airtable not configured - cannot fetch related posts');
    return [];
  }

  try {
    // Build filter formula to exclude current post and match category or tags
    const filterFormula = `AND(
      RECORD_ID() != '${currentPost.id}',
      OR(
        {Category} = '${currentPost.category}',
        ${currentPost.tags?.map(tag => `FIND('${tag}', {Tags})`).join(',')}
      )
    )`;

    const records = await base('Blog Posts')
      .select({
        filterByFormula: filterFormula,
        maxRecords: limit,
        sort: [{ field: 'Published At', direction: 'desc' }]
      })
      .firstPage();

    if (!records || records.length === 0) {
      return [];
    }

    return records.map(record => {
      const fields = record.fields as Record<string, any>;
      return {
        id: record.id,
        title: fields.Title as string,
        content: fields.Content as string,
        excerpt: fields.Excerpt as string,
        category: fields.Category as string,
        slug: fields.Slug as string,
        authorId: fields.Author?.Name || 'Unknown Author',
        authorImage: fields.Author?.Image?.[0]?.url,
        authorRole: fields.Author?.Role,
        authorBio: fields.Author?.Bio,
        authorSocial: fields.Author?.['Social Links']?.map((link: string) => ({
          platform: link.split('/').pop() || '',
          url: link,
          icon: getSocialIcon(link)
        })),
        readingTime: fields['Reading Time'] as number,
        isPopular: fields['Is Popular'] as boolean,
        isFeatured: fields['Is Featured'] as boolean,
        publishedAt: fields['Published At'] as string,
        tags: fields.Tags as string[],
        featuredImage: fields['Featured Image']?.[0]?.url
      };
    });
  } catch (error) {
    console.error('Error fetching related posts:', error);
    return [];
  }
} 