/**
 * Campaign Feed Page
 * 
 * Main landing page displaying campaigns in tabs:
 * - Trending: Most actions in last 7 days
 * - Hot: Most actions in last 24 hours
 * - New: Most recently created
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame,
  TrendingUp,
  Clock,
  Users,
  Share2,
  Plus,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { genUserName } from '@/lib/genUserName';
import {
  CampaignEvent,
  parseCampaign,
  isCampaignEvent,
  CAMPAIGN_KIND,
  type CampaignCategory,
} from '@/types/nostr';

/**
 * Feed tab types
 */
type FeedTab = 'trending' | 'hot' | 'new';

/**
 * Campaign card component
 */
function CampaignCard({ campaign, metrics }: { campaign: CampaignEvent; metrics?: any }) {
  const parsed = parseCampaign(campaign);
  const author = useAuthor(campaign.pubkey);
  const metadata = author.data?.metadata;

  // Get category badge color
  const getCategoryColor = (category: CampaignCategory): string => {
    const colors: Record<CampaignCategory, string> = {
      environment: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      healthcare: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      education: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      civil_rights: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      economy: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      immigration: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      gun_control: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300',
      housing: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
      transportation: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      technology: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300',
      criminal_justice: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300',
      election_reform: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
      government_transparency: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
      public_safety: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      community: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/campaign/${parsed.id}`}>
        <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  {parsed.categories.slice(0, 2).map((category) => (
                    <Badge key={category} variant="secondary" className={getCategoryColor(category)}>
                      {category.replace('_', ' ')}
                    </Badge>
                  ))}
                  {parsed.categories.length > 2 && (
                    <Badge variant="outline">+{parsed.categories.length - 2}</Badge>
                  )}
                  {metrics?.hotActions > 10 && (
                    <Badge variant="destructive" className="animate-pulse">
                      <Flame className="w-3 h-3 mr-1" />
                      Hot
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl line-clamp-2">{parsed.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {parsed.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 text-sm">
              <Avatar className="w-8 h-8">
                <AvatarImage src={metadata?.picture} alt={metadata?.name} />
                <AvatarFallback>
                  {genUserName(campaign.pubkey).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {metadata?.name || genUserName(campaign.pubkey)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(parsed.createdAt * 1000).toLocaleDateString()}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="text-sm text-muted-foreground">
            <div className="flex items-center gap-4 w-full">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{metrics?.totalActions || 0} actions</span>
              </div>
              {metrics?.hotActions > 0 && (
                <div className="flex items-center gap-1">
                  <Flame className="w-4 h-4" />
                  <span>{metrics.hotActions} in 24h</span>
                </div>
              )}
              <div className="flex items-center gap-1 ml-auto">
                <Share2 className="w-4 h-4" />
                <span>{metrics?.shareCount || 0}</span>
              </div>
            </div>
          </CardFooter>
        </Card>
      </Link>
    </motion.div>
  );
}

/**
 * Campaign card skeleton loader
 */
function CampaignCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-full" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex gap-4 w-full">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20 ml-auto" />
        </div>
      </CardFooter>
    </Card>
  );
}

/**
 * Campaign feed component
 */
function CampaignFeed({ tab }: { tab: FeedTab }) {
  const { nostr } = useNostr();

  // Query campaigns based on tab
  const { data: campaigns, isLoading, error } = useQuery({
    queryKey: ['campaigns', tab],
    queryFn: async ({ signal }) => {
      const abortSignal = AbortSignal.any([signal, AbortSignal.timeout(5000)]);
      
      const events = await nostr.query(
        [
          {
            kinds: [CAMPAIGN_KIND],
            '#t': ['active'],
            limit: 50,
          },
        ],
        { signal: abortSignal }
      );

      // Filter and sort based on tab
      const campaignEvents = events.filter(isCampaignEvent);

      // In a real implementation, we would:
      // 1. Query attestations to get metrics
      // 2. Sort campaigns based on metrics
      // 3. For MVP, we just sort by created_at

      let sorted = [...campaignEvents];

      if (tab === 'new') {
        // Sort by creation date (newest first)
        sorted.sort((a, b) => b.created_at - a.created_at);
      } else if (tab === 'hot') {
        // Sort by creation date as placeholder for hot metric
        // In production, this would use attestation timestamps
        sorted.sort((a, b) => b.created_at - a.created_at);
      } else if (tab === 'trending') {
        // Sort by creation date as placeholder for trending metric
        // In production, this would use 7-day action count
        sorted.sort((a, b) => b.created_at - a.created_at);
      }

      return sorted;
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // 2 minutes
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CampaignCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 px-8 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Failed to load campaigns</h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            There was an error loading campaigns. Please check your relay connections and try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 px-8 text-center">
          <div className="max-w-sm mx-auto space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground">
                Be the first to create a campaign and start making a difference!
              </p>
            </div>
            <Link to="/campaigns/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <AnimatePresence mode="popLayout">
        {campaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * Main index page
 */
export default function Index() {
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<FeedTab>('trending');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Movement</h1>
                <p className="text-xs text-muted-foreground">Civic engagement for everyone</p>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link to="/campaigns/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </Link>
              <LoginArea className="max-w-60" />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Make Your Voice Heard
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground">
              Join campaigns, contact your representatives, and create real change in your community.
            </p>
            <div className="flex flex-wrap justify-center gap-4 pt-4">
              <Link to="/campaigns/new">
                <Button size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Start a Campaign
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                <Users className="w-5 h-5 mr-2" />
                Browse Campaigns
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as FeedTab)}
          className="w-full"
        >
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="trending" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="hot" className="gap-2">
                <Flame className="w-4 h-4" />
                Hot
              </TabsTrigger>
              <TabsTrigger value="new" className="gap-2">
                <Clock className="w-4 h-4" />
                New
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-0">
            <CampaignFeed tab={activeTab} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/50 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>
              Powered by <Link to="https://soapbox.pub/mkstack" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">MKStack</Link>
            </p>
            <p>
              Civic engagement platform built on Nostr
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}