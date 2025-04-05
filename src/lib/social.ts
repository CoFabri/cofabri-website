import { TwitterApi } from 'twitter-api-v2';
import { IgApiClient } from 'instagram-private-api';

// Initialize API clients
const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_SECRET!,
});

const ig = new IgApiClient();

export async function getXPosts() {
  if (!process.env.TWITTER_API_KEY) {
    console.warn('Twitter API credentials not configured');
    return [];
  }

  try {
    const tweets = await twitterClient.v2.userTimeline(process.env.TWITTER_USER_ID!, {
      max_results: 10,
      'tweet.fields': ['created_at', 'public_metrics'],
    });

    return tweets.data.data.map((tweet) => ({
      id: tweet.id,
      content: tweet.text,
      date: new Date(tweet.created_at!).toLocaleDateString(),
      engagement: `${tweet.public_metrics?.impression_count || 0} views`,
      url: `https://x.com/cofabri/status/${tweet.id}`,
    }));
  } catch (error) {
    console.error('Error fetching X posts:', error);
    return [];
  }
}

export async function getInstagramPosts() {
  if (!process.env.INSTAGRAM_USERNAME) {
    console.warn('Instagram credentials not configured');
    return [];
  }

  try {
    ig.state.generateDevice(process.env.INSTAGRAM_USERNAME!);
    await ig.simulate.preLoginFlow();
    await ig.account.login(process.env.INSTAGRAM_USERNAME!, process.env.INSTAGRAM_PASSWORD!);

    const userFeed = ig.feed.user(process.env.INSTAGRAM_USER_ID!);
    const items = await userFeed.items();

    return items.map((post) => ({
      id: post.id,
      content: post.caption?.text || '',
      date: new Date(post.taken_at * 1000).toLocaleDateString(),
      engagement: `${post.like_count} likes`,
      imageUrl: post.image_versions2?.candidates[0]?.url || '',
      url: `https://instagram.com/p/${post.code}`,
    }));
  } catch (error) {
    console.error('Error fetching Instagram posts:', error);
    return [];
  }
}

export async function getLinkedInPosts() {
  if (!process.env.LINKEDIN_ACCESS_TOKEN) {
    console.warn('LinkedIn API credentials not configured');
    return [];
  }

  try {
    const response = await fetch(
      `https://api.linkedin.com/v2/ugcPosts?q=authors&authors[0]=urn:li:company:${process.env.LINKEDIN_COMPANY_ID}&count=10`,
      {
        headers: {
          Authorization: `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`LinkedIn API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.elements.map((post: any) => ({
      id: post.id,
      content: post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || '',
      date: new Date(post.created?.time).toLocaleDateString(),
      engagement: `${post.numLikes || 0} likes`,
      url: `https://linkedin.com/company/cofabri/posts/${post.id}`,
    }));
  } catch (error) {
    console.error('Error fetching LinkedIn posts:', error);
    return [];
  }
} 