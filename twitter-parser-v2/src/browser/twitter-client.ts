// Twitter Parser V2 - Twitter Client (MULTI Architecture)
// Handles Twitter GraphQL API interactions via browser
// MULTI: accepts cookies + proxy per request instead of session manager
// v2: Integrated ScrollEngine for risk-aware parsing

import { Page, BrowserContext, Response } from 'playwright';
import { browserManager } from './browser-manager.js';
import { config } from '../config.js';
import { ScrollEngine, selectInitialProfile, ScrollProfile, ScrollTelemetry, ScrollHints } from '../scroll/index.js';

export interface Tweet {
  id: string;
  text: string;
  createdAt: string;
  likes: number;
  reposts: number;
  replies: number;
  views: number;
  author: {
    id: string;
    username: string;
    name: string;
    avatar: string;
    verified: boolean;
    followers: number;
  };
  media?: string[];
}

export interface SearchResult {
  tweets: Tweet[];
  cursor?: string;
  engineSummary?: ReturnType<ScrollEngine['getSummary']>;
}

export interface UserProfile {
  id: string;
  username: string;
  name: string;
  description: string;
  avatar: string;
  verified: boolean;
  followers: number;
  following: number;
  tweets: number;
}

export interface CredentialsInput {
  cookies: any[];
  proxyUrl?: string;
  userAgent?: string;
}

export interface SearchInput extends CredentialsInput {
  keyword: string;
  limit?: number;
  profile?: ScrollProfile; // Initial scroll profile
  taskId?: string;
}

export interface UserInput extends CredentialsInput {
  username: string;
  limit?: number;
  profile?: ScrollProfile;
  taskId?: string;
}

export class TwitterClient {
  /**
   * Search tweets with provided credentials
   * MULTI Architecture entry point
   */
  async searchWithCredentials(input: SearchInput): Promise<SearchResult> {
    const { keyword, limit = 20, cookies, proxyUrl, userAgent, profile, taskId } = input;

    console.log(`[TwitterClient] Search "${keyword}" with ${cookies.length} cookies`);

    // Create page with credentials
    const { page, context } = await this.createPageWithCredentials({ cookies, proxyUrl, userAgent });

    try {
      const result = await this.searchWithScrollEngine(page, keyword, limit, profile, taskId);
      return result;
    } catch (error: any) {
      console.error(`[TwitterClient] Search error:`, error.message);
      throw error;
    } finally {
      await page.close();
      await context.close();
    }
  }

  /**
   * Get user tweets with provided credentials
   */
  async getUserTweetsWithCredentials(input: UserInput): Promise<{ tweets: Tweet[]; engineSummary?: any }> {
    const { username, limit = 20, cookies, proxyUrl, userAgent, profile, taskId } = input;

    console.log(`[TwitterClient] User tweets @${username} with ${cookies.length} cookies`);

    const { page, context } = await this.createPageWithCredentials({ cookies, proxyUrl, userAgent });

    try {
      const result = await this.getUserTweetsWithScrollEngine(page, username, limit, profile, taskId);
      return result;
    } finally {
      await page.close();
      await context.close();
    }
  }

  /**
   * Get user profile with provided credentials
   */
  async getUserProfileWithCredentials(input: Omit<UserInput, 'limit'>): Promise<UserProfile | null> {
    const { username, cookies, proxyUrl, userAgent } = input;

    console.log(`[TwitterClient] Profile @${username} with ${cookies.length} cookies`);

    const { page, context } = await this.createPageWithCredentials({ cookies, proxyUrl, userAgent });

    try {
      return await this.getProfileWithInterceptor(page, username);
    } finally {
      await page.close();
      await context.close();
    }
  }

  /**
   * Create page with injected credentials
   */
  private async createPageWithCredentials(creds: CredentialsInput): Promise<{ page: Page; context: BrowserContext }> {
    const context = await browserManager.createContext({
      proxyUrl: creds.proxyUrl,
    });

    const page = await context.newPage();

    if (creds.userAgent) {
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      });
    }

    if (creds.cookies && creds.cookies.length > 0) {
      const normalizedCookies = creds.cookies.map(c => {
        // Normalize sameSite to valid Playwright values
        let sameSite: 'Strict' | 'Lax' | 'None' = 'Lax';
        const rawSameSite = String(c.sameSite || '').toLowerCase();
        if (rawSameSite === 'strict') sameSite = 'Strict';
        else if (rawSameSite === 'none' || rawSameSite === 'no_restriction') sameSite = 'None';
        else sameSite = 'Lax';
        
        return {
          name: c.name,
          value: c.value,
          domain: c.domain || '.x.com',
          path: c.path || '/',
          secure: c.secure !== false,
          httpOnly: c.httpOnly || false,
          sameSite,
        };
      });

      await context.addCookies(normalizedCookies);
      console.log(`[TwitterClient] Injected ${normalizedCookies.length} cookies`);
    }

    return { page, context };
  }

  /**
   * Search with ScrollEngine integration
   */
  private async searchWithScrollEngine(
    page: Page,
    keyword: string,
    limit: number,
    initialProfile?: ScrollProfile,
    taskId?: string
  ): Promise<SearchResult> {
    const tweets: Tweet[] = [];
    let searchCompleted = false;
    
    // Telemetry tracking
    let lastXhrTime = 0;
    let xhrErrors = 0;
    let captchaSeen = false;
    let rateLimitSeen = false;
    let lastBatchSize = 0;

    // Initialize ScrollEngine
    const engine = new ScrollEngine({
      plannedPosts: limit,
      initialProfile: initialProfile || selectInitialProfile(),
      taskId,
    });

    // Setup response listener for GraphQL
    const handleResponse = async (response: Response) => {
      if (searchCompleted) return;
      
      const url = response.url();
      
      // Check for rate limit
      if (response.status() === 429) {
        rateLimitSeen = true;
        console.log('[TwitterClient] Rate limit detected!');
        return;
      }
      
      if (url.includes('/graphql') && url.includes('SearchTimeline')) {
        const requestStartTime = lastXhrTime || Date.now();
        lastXhrTime = Date.now();
        
        try {
          const data = await response.json();
          const extracted = this.extractTweetsFromSearch(data);
          
          lastBatchSize = extracted.length;
          
          if (extracted.length > 0) {
            tweets.push(...extracted);
            console.log(`[TwitterClient] Intercepted ${extracted.length} tweets, total: ${tweets.length}`);
          }
        } catch (e) {
          xhrErrors++;
        }
      }
      
      // Check for captcha
      if (url.includes('captcha') || url.includes('challenge')) {
        captchaSeen = true;
        console.log('[TwitterClient] Captcha/challenge detected!');
      }
    };

    page.on('response', handleResponse);

    // Navigate to search
    const searchUrl = `https://x.com/search?q=${encodeURIComponent(keyword)}&src=typed_query&f=live`;
    
    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch (navError: any) {
      const pageContent = await page.content();
      if (pageContent.includes('Could not log you in') || pageContent.includes('Account suspended')) {
        throw new Error('Session blocked by Twitter');
      }
      throw navError;
    }

    // Wait for initial results
    const initialHints = engine.getNextHints();
    await page.waitForTimeout(Math.min(3000, initialHints.delayMs));

    // Check if session is valid
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/i/flow/login')) {
      throw new Error('Session expired - redirected to login');
    }

    // ScrollEngine-controlled loop
    while (engine.shouldContinue()) {
      const hints = engine.getNextHints();
      
      // Wait with engine-calculated delay
      await page.waitForTimeout(hints.delayMs);
      
      // Scroll with engine-calculated distance
      await page.mouse.wheel(0, hints.scrollPx);
      
      // Wait for XHR to complete
      await page.waitForTimeout(500);
      
      // Build telemetry
      const telemetry: ScrollTelemetry = {
        fetchedThisBatch: lastBatchSize,
        fetchedTotal: tweets.length,
        latencyMs: lastXhrTime ? Date.now() - lastXhrTime : 0,
        xhrErrors,
        captchaSeen,
        rateLimitSeen,
        emptyResponse: lastBatchSize === 0,
        timestamp: new Date(),
      };
      
      // Reset batch tracking
      lastBatchSize = 0;
      xhrErrors = 0;
      
      // Process telemetry and get next action
      const nextHints = engine.processTelemetry(telemetry);
      
      // Handle cooldown
      if (nextHints.needsCooldown) {
        console.log(`[TwitterClient] Cooldown pause: ${nextHints.cooldownMs}ms`);
        await page.waitForTimeout(nextHints.cooldownMs);
      }
      
      // Handle stop
      if (nextHints.shouldStop) {
        console.log(`[TwitterClient] Stopping: ${nextHints.reason}`);
        break;
      }
    }

    searchCompleted = true;
    
    const summary = engine.getSummary();
    console.log(`[TwitterClient] Search complete:`, summary);

    return {
      tweets: tweets.slice(0, limit),
      engineSummary: summary,
    };
  }

  /**
   * Get user tweets with ScrollEngine
   */
  private async getUserTweetsWithScrollEngine(
    page: Page,
    username: string,
    limit: number,
    initialProfile?: ScrollProfile,
    taskId?: string
  ): Promise<{ tweets: Tweet[]; engineSummary?: any }> {
    const tweets: Tweet[] = [];
    
    let lastXhrTime = 0;
    let xhrErrors = 0;
    let captchaSeen = false;
    let rateLimitSeen = false;
    let lastBatchSize = 0;

    const engine = new ScrollEngine({
      plannedPosts: limit,
      initialProfile: initialProfile || selectInitialProfile(),
      taskId,
    });

    page.on('response', async (response) => {
      const url = response.url();
      
      if (response.status() === 429) {
        rateLimitSeen = true;
        return;
      }
      
      if (url.includes('/graphql') && url.includes('UserTweets')) {
        lastXhrTime = Date.now();
        try {
          const data = await response.json();
          const extracted = this.extractUserTweets(data);
          lastBatchSize = extracted.length;
          tweets.push(...extracted);
          console.log(`[TwitterClient] Intercepted ${extracted.length} user tweets`);
        } catch (e) {
          xhrErrors++;
        }
      }
      
      if (url.includes('captcha') || url.includes('challenge')) {
        captchaSeen = true;
      }
    });

    await page.goto(`https://x.com/${username}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    const initialHints = engine.getNextHints();
    await page.waitForTimeout(Math.min(3000, initialHints.delayMs));

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      throw new Error('Session expired - redirected to login');
    }

    // ScrollEngine-controlled loop
    while (engine.shouldContinue()) {
      const hints = engine.getNextHints();
      
      await page.waitForTimeout(hints.delayMs);
      await page.mouse.wheel(0, hints.scrollPx);
      await page.waitForTimeout(500);
      
      const telemetry: ScrollTelemetry = {
        fetchedThisBatch: lastBatchSize,
        fetchedTotal: tweets.length,
        latencyMs: lastXhrTime ? Date.now() - lastXhrTime : 0,
        xhrErrors,
        captchaSeen,
        rateLimitSeen,
        emptyResponse: lastBatchSize === 0,
        timestamp: new Date(),
      };
      
      lastBatchSize = 0;
      xhrErrors = 0;
      
      const nextHints = engine.processTelemetry(telemetry);
      
      if (nextHints.needsCooldown) {
        await page.waitForTimeout(nextHints.cooldownMs);
      }
      
      if (nextHints.shouldStop) {
        console.log(`[TwitterClient] Stopping: ${nextHints.reason}`);
        break;
      }
    }

    const summary = engine.getSummary();
    console.log(`[TwitterClient] User tweets complete:`, summary);

    return {
      tweets: tweets.slice(0, limit),
      engineSummary: summary,
    };
  }

  /**
   * Extract tweets from search response
   */
  private extractTweetsFromSearch(data: any): Tweet[] {
    const tweets: Tweet[] = [];

    try {
      const instructions = data?.data?.search_by_raw_query?.search_timeline?.timeline?.instructions || [];
      
      for (const instruction of instructions) {
        if (instruction.type !== 'TimelineAddEntries') continue;
        
        for (const entry of instruction.entries || []) {
          if (!entry.entryId?.includes('tweet')) continue;
          
          const result = entry.content?.itemContent?.tweet_results?.result;
          if (!result) continue;

          const tweet = this.parseTweetResult(result);
          if (tweet) tweets.push(tweet);
        }
      }
    } catch (e) {
      console.error('[TwitterClient] Error extracting tweets:', e);
    }

    return tweets;
  }

  /**
   * Parse single tweet result
   */
  private parseTweetResult(result: any): Tweet | null {
    try {
      // Handle promoted tweets and tombstones
      if (result.__typename === 'TweetTombstone' || result.__typename === 'TweetUnavailable') {
        return null;
      }
      
      // Handle TweetWithVisibilityResults wrapper
      const tweetResult = result.__typename === 'TweetWithVisibilityResults' 
        ? result.tweet 
        : result;
      
      const legacy = tweetResult.legacy;
      if (!legacy?.full_text) return null;

      // DEBUG: Log first tweet structure to understand data paths
      if (!this._debugLogged) {
        console.log('[TwitterClient] DEBUG Tweet structure:');
        console.log('  legacy keys:', Object.keys(legacy || {}));
        console.log('  favorite_count:', legacy?.favorite_count);
        console.log('  retweet_count:', legacy?.retweet_count);
        console.log('  reply_count:', legacy?.reply_count);
        
        // Check for alternate engagement paths
        console.log('  tweetResult.engagement:', tweetResult.engagement);
        console.log('  tweetResult.legacy.ext_views:', legacy?.ext_views);
        console.log('  tweetResult.views:', tweetResult.views);
        this._debugLogged = true;
      }

      // Try multiple paths for user data (Twitter API v2 structure)
      const userResult = tweetResult.core?.user_results?.result 
        || tweetResult.author?.result
        || result.core?.user_results?.result;
      
      // Twitter API v2: user data moved from legacy to core
      const userCore = userResult?.core;
      const userLegacy = userResult?.legacy;
      
      // Get screen_name from new structure (core) or fallback to legacy
      const screenName = userCore?.screen_name || userLegacy?.screen_name || '';
      const userName = userCore?.name || userLegacy?.name || '';
      const avatarUrl = userResult?.avatar?.image_url || userLegacy?.profile_image_url_https || '';
      const followersCount = userCore?.followers_count || userLegacy?.followers_count || 0;

      const media = legacy.extended_entities?.media || legacy.entities?.media || [];
      const photos = media
        .filter((m: any) => m.type === 'photo')
        .map((m: any) => m.media_url_https);

      // Get engagement metrics from multiple possible paths
      const likes = legacy.favorite_count ?? tweetResult.favorite_count ?? 0;
      const reposts = legacy.retweet_count ?? tweetResult.retweet_count ?? 0;
      const replies = legacy.reply_count ?? tweetResult.reply_count ?? 0;
      const viewsRaw = tweetResult.views?.count || legacy.ext_views?.count || tweetResult.view_count || '0';
      const views = parseInt(String(viewsRaw));

      return {
        id: tweetResult.rest_id,
        text: legacy.full_text,
        createdAt: legacy.created_at,
        likes,
        reposts,
        replies,
        views,
        author: {
          id: userResult?.rest_id || '',
          username: screenName,
          name: userName,
          avatar: avatarUrl,
          verified: userResult?.is_blue_verified || false,
          followers: followersCount,
        },
        media: photos.length > 0 ? photos : undefined,
      };
    } catch (e) {
      return null;
    }
  }

  private _debugLogged = false;

  /**
   * Extract user tweets from response
   */
  private extractUserTweets(data: any): Tweet[] {
    const tweets: Tweet[] = [];

    try {
      const instructions = data?.data?.user?.result?.timeline_v2?.timeline?.instructions ||
                          data?.data?.user?.result?.timeline?.timeline?.instructions || [];
      
      // DEBUG: Log first tweet from UserTweets to check engagement data
      if (!this._userTweetsDebugLogged) {
        for (const instruction of instructions) {
          if (instruction.type !== 'TimelineAddEntries') continue;
          for (const entry of instruction.entries || []) {
            if (!entry.entryId?.includes('tweet')) continue;
            const result = entry.content?.itemContent?.tweet_results?.result;
            if (result?.legacy) {
              console.log('[TwitterClient] DEBUG UserTweets engagement:');
              console.log('  favorite_count:', result.legacy.favorite_count);
              console.log('  retweet_count:', result.legacy.retweet_count);
              console.log('  reply_count:', result.legacy.reply_count);
              console.log('  views:', result.views);
              this._userTweetsDebugLogged = true;
              break;
            }
          }
          if (this._userTweetsDebugLogged) break;
        }
      }
      
      for (const instruction of instructions) {
        if (instruction.type !== 'TimelineAddEntries') continue;
        
        for (const entry of instruction.entries || []) {
          if (!entry.entryId?.includes('tweet')) continue;
          
          const result = entry.content?.itemContent?.tweet_results?.result;
          if (!result) continue;

          const tweet = this.parseTweetResult(result);
          if (tweet) tweets.push(tweet);
        }
      }
    } catch (e) {}

    return tweets;
  }

  private _userTweetsDebugLogged = false;

  /**
   * Get user profile with interceptor
   */
  private async getProfileWithInterceptor(page: Page, username: string): Promise<UserProfile | null> {
    let profile: UserProfile | null = null;

    page.on('response', async (response) => {
      const url = response.url();
      
      if (url.includes('/graphql') && url.includes('UserByScreenName')) {
        try {
          const data = await response.json();
          profile = this.extractUserProfile(data);
        } catch (e) {}
      }
    });

    await page.goto(`https://x.com/${username}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);

    return profile;
  }

  /**
   * Extract user profile from response
   */
  private extractUserProfile(data: any): UserProfile | null {
    try {
      const result = data?.data?.user?.result;
      if (!result) return null;

      const legacy = result.legacy;

      return {
        id: result.rest_id,
        username: legacy.screen_name,
        name: legacy.name,
        description: legacy.description,
        avatar: legacy.profile_image_url_https,
        verified: result.is_blue_verified || false,
        followers: legacy.followers_count,
        following: legacy.friends_count,
        tweets: legacy.statuses_count,
      };
    } catch (e) {
      return null;
    }
  }

  /**
   * Ping session to check if cookies are still valid
   */
  async pingSession(input: CredentialsInput): Promise<{ success: boolean; httpStatus: number; userId?: string }> {
    console.log(`[TwitterClient] Ping session with ${input.cookies.length} cookies`);

    const { page, context } = await this.createPageWithCredentials(input);

    try {
      let success = false;
      let httpStatus = 200;
      let userId: string | undefined;

      page.on('response', async (response) => {
        const url = response.url();
        
        if (url.includes('/graphql') && url.includes('Viewer')) {
          try {
            httpStatus = response.status();
            
            if (httpStatus === 200) {
              const data = await response.json();
              const viewerResult = data?.data?.viewer;
              
              if (viewerResult?.user_results?.result?.rest_id) {
                userId = viewerResult.user_results.result.rest_id;
                success = true;
                console.log(`[TwitterClient] Session valid, userId: ${userId}`);
              }
            }
          } catch (e) {}
        }
      });

      try {
        await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: 15000 });
      } catch (navError: any) {
        console.log('[TwitterClient] Navigation completed with timeout/error');
      }

      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      if (currentUrl.includes('/login') || currentUrl.includes('/i/flow/login')) {
        return { success: false, httpStatus: 401, userId: undefined };
      }

      const content = await page.content();
      if (content.includes('Could not log you in') || content.includes('Account suspended')) {
        return { success: false, httpStatus: 403, userId: undefined };
      }

      return { success, httpStatus, userId };
    } finally {
      await page.close();
      await context.close();
    }
  }

  /**
   * Get following list for a user (who they follow)
   * Returns list of user IDs and basic info
   */
  async getFollowingList(input: UserInput): Promise<{ following: { id: string; username: string; name: string; followers: number; verified: boolean }[]; cursor?: string }> {
    const { username, limit = 50, cookies, proxyUrl, userAgent } = input;
    console.log(`[TwitterClient] Getting following for @${username}`);

    const { page, context } = await this.createPageWithCredentials({ cookies, proxyUrl, userAgent });
    const following: { id: string; username: string; name: string; followers: number; verified: boolean }[] = [];

    try {
      // Setup GraphQL listener
      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/graphql') && url.includes('Following')) {
          try {
            const data = await response.json();
            const users = this.extractUsersFromTimeline(data);
            following.push(...users);
            console.log(`[TwitterClient] Extracted ${users.length} following, total: ${following.length}`);
          } catch (e) {
            // Ignore parse errors
          }
        }
      });

      // Navigate to following page
      await page.goto(`https://x.com/${username}/following`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);

      // Scroll to load more if needed
      let scrollAttempts = 0;
      while (following.length < limit && scrollAttempts < 5) {
        await page.evaluate(() => window.scrollBy(0, 1000));
        await page.waitForTimeout(2000);
        scrollAttempts++;
      }

      return { following: following.slice(0, limit) };
    } finally {
      await page.close();
      await context.close();
    }
  }

  /**
   * Get followers list for a user (who follows them)
   * Returns list of user IDs and basic info
   */
  async getFollowersList(input: UserInput): Promise<{ followers: { id: string; username: string; name: string; followers: number; verified: boolean }[]; cursor?: string }> {
    const { username, limit = 50, cookies, proxyUrl, userAgent } = input;
    console.log(`[TwitterClient] Getting followers for @${username}`);

    const { page, context } = await this.createPageWithCredentials({ cookies, proxyUrl, userAgent });
    const followers: { id: string; username: string; name: string; followers: number; verified: boolean }[] = [];

    try {
      // Setup GraphQL listener - Followers endpoint
      page.on('response', async (response) => {
        const url = response.url();
        if (url.includes('/graphql') && url.includes('Followers')) {
          try {
            const data = await response.json();
            const users = this.extractUsersFromTimeline(data);
            followers.push(...users);
            console.log(`[TwitterClient] Extracted ${users.length} followers, total: ${followers.length}`);
          } catch (e) {
            // Ignore parse errors
          }
        }
      });

      // Navigate to followers page
      await page.goto(`https://x.com/${username}/followers`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);

      // Scroll to load more if needed
      let scrollAttempts = 0;
      while (followers.length < limit && scrollAttempts < 5) {
        await page.evaluate(() => window.scrollBy(0, 1000));
        await page.waitForTimeout(2000);
        scrollAttempts++;
      }

      return { followers: followers.slice(0, limit) };
    } finally {
      await page.close();
      await context.close();
    }
  }

  /**
   * Extract users from Following/Followers timeline response
   */
  private extractUsersFromTimeline(data: any): { id: string; username: string; name: string; followers: number; verified: boolean }[] {
    const users: { id: string; username: string; name: string; followers: number; verified: boolean }[] = [];

    try {
      const instructions = data?.data?.user?.result?.timeline?.timeline?.instructions || [];
      
      for (const instruction of instructions) {
        const entries = instruction.entries || [];
        
        for (const entry of entries) {
          const content = entry.content;
          if (content?.itemContent?.user_results?.result) {
            const result = content.itemContent.user_results.result;
            const legacy = result.legacy;
            const core = result.core;
            
            // Twitter 2025: screen_name and name are in result.core
            let username = '';
            let name = '';
            
            // Priority 1: from core (Twitter 2025 format)
            if (core?.screen_name) username = core.screen_name;
            // Priority 2: direct on result
            else if (result.screen_name) username = result.screen_name;
            // Priority 3: in legacy
            else if (legacy?.screen_name) username = legacy.screen_name;
            
            // Same for name
            if (core?.name) name = core.name;
            else if (result.name) name = result.name;
            else if (legacy?.name) name = legacy.name;
            
            if (result?.rest_id) {
              const user = {
                id: result.rest_id,
                username,
                name,
                followers: legacy?.followers_count || result?.followers_count || 0,
                verified: result.is_blue_verified || false,
              };
              users.push(user);
              
              if (users.length === 1) {
                console.log(`[TwitterClient] First user extracted: id=${user.id}, username="${user.username}", name="${user.name}"`);
              }
            }
          }
        }
      }
    } catch (e) {
      console.log('[TwitterClient] Error extracting users:', e);
    }

    return users;
  }
}

export const twitterClient = new TwitterClient();
