/**
 * Campaign Feed Page - Redesigned
 *
 * Dynamic, immersive civic engagement platform with:
 * - Animated hero section with civic imagery
 * - Campaign cards with category-specific theming
 * - Smooth scroll animations
 * - Social proof displays
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Flame,
  TrendingUp,
  Clock,
  Users,
  Share2,
  Plus,
  Loader2,
  AlertCircle,
  ArrowRight,
  Heart,
  Zap,
  Sparkles,
  Mic,
  Building2,
  Scale,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { LoginArea } from '@/components/auth/LoginArea';
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
import {
  SAMPLE_CAMPAIGNS,
  getNewCampaigns,
  getHotCampaigns,
  getTrendingCampaigns,
  getUserByPubkey,
} from '@/lib/sampleCampaigns';

/**
 * Feed tab types
 */
type FeedTab = 'trending' | 'hot' | 'new';

/**
 * Category theme configuration
 */
const CATEGORY_THEMES: Record<CampaignCategory, { color: string; bgGradient: string; icon: any; accent: string }> = {
  environment: {
    color: 'text-emerald-700 dark:text-emerald-400',
    bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50',
    icon: Scale,
    accent: 'bg-emerald-500'
  },
  healthcare: {
    color: 'text-rose-700 dark:text-rose-400',
    bgGradient: 'from-rose-50 to-red-50 dark:from-rose-950/50 dark:to-red-950/50',
    icon: Heart,
    accent: 'bg-rose-500'
  },
  education: {
    color: 'text-blue-700 dark:text-blue-400',
    bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50',
    icon: Zap,
    accent: 'bg-blue-500'
  },
  civil_rights: {
    color: 'text-purple-700 dark:text-purple-400',
    bgGradient: 'from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50',
    icon: Scale,
    accent: 'bg-purple-500'
  },
  economy: {
    color: 'text-amber-700 dark:text-amber-400',
    bgGradient: 'from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50',
    icon: TrendingUp,
    accent: 'bg-amber-500'
  },
  immigration: {
    color: 'text-orange-700 dark:text-orange-400',
    bgGradient: 'from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50',
    icon: Building2,
    accent: 'bg-orange-500'
  },
  gun_control: {
    color: 'text-red-700 dark:text-red-400',
    bgGradient: 'from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50',
    icon: AlertCircle,
    accent: 'bg-red-500'
  },
  housing: {
    color: 'text-cyan-700 dark:text-cyan-400',
    bgGradient: 'from-cyan-50 to-sky-50 dark:from-cyan-950/50 dark:to-sky-950/50',
    icon: Building2,
    accent: 'bg-cyan-500'
  },
  transportation: {
    color: 'text-indigo-700 dark:text-indigo-400',
    bgGradient: 'from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/50',
    icon: TrendingUp,
    accent: 'bg-indigo-500'
  },
  technology: {
    color: 'text-violet-700 dark:text-violet-400',
    bgGradient: 'from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50',
    icon: Sparkles,
    accent: 'bg-violet-500'
  },
  criminal_justice: {
    color: 'text-slate-700 dark:text-slate-400',
    bgGradient: 'from-slate-50 to-gray-50 dark:from-slate-950/50 dark:to-gray-950/50',
    icon: Scale,
    accent: 'bg-slate-500'
  },
  election_reform: {
    color: 'text-amber-700 dark:text-amber-400',
    bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50',
    icon: Mic,
    accent: 'bg-amber-500'
  },
  government_transparency: {
    color: 'text-teal-700 dark:text-teal-400',
    bgGradient: 'from-teal-50 to-cyan-50 dark:from-teal-950/50 dark:to-cyan-950/50',
    icon: AlertCircle,
    accent: 'bg-teal-500'
  },
  public_safety: {
    color: 'text-pink-700 dark:text-pink-400',
    bgGradient: 'from-pink-50 to-rose-50 dark:from-pink-950/50 dark:to-rose-950/50',
    icon: Heart,
    accent: 'bg-pink-500'
  },
  community: {
    color: 'text-lime-700 dark:text-lime-400',
    bgGradient: 'from-lime-50 to-green-50 dark:from-lime-950/50 dark:to-green-950/50',
    icon: Users,
    accent: 'bg-lime-500'
  },
};

/**
 * Animated counter component
 */
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {value.toLocaleString()}{suffix}
    </motion.span>
  );
}

/**
 * Campaign card component with category theming
 */
function CampaignCard({ campaign }: { campaign: CampaignEvent }) {
  const parsed = parseCampaign(campaign);
  const author = useAuthor(campaign.pubkey);
  const metadata = author.data?.metadata;

  const primaryCategory = parsed.categories[0] || 'community';
  const theme = CATEGORY_THEMES[primaryCategory];
  const Icon = theme.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/campaign/${parsed.id}`}>
        <Card className={`h-full overflow-hidden bg-gradient-to-br ${theme.bgGradient} border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group`}>
          {/* Category header with icon */}
          <div className={`h-2 bg-gradient-to-r ${theme.accent} to-transparent`} />

          <CardContent className="p-6 space-y-4">
            {/* Category badge & hot indicator */}
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 dark:bg-black/40 backdrop-blur-sm`}>
                <Icon className={`w-4 h-4 ${theme.color}`} />
                <span className={`text-sm font-medium ${theme.color} capitalize`}>
                  {primaryCategory.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-1 text-orange-500">
                <Flame className="w-4 h-4" />
                <span className="text-xs font-medium">Hot</span>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {parsed.title}
            </h3>

            {/* Pitch */}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {parsed.description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 py-3 border-t border-black/5 dark:border-white/5">
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 rounded-full bg-white/60 dark:bg-black/40">
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium">1,234</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 rounded-full bg-white/60 dark:bg-black/40">
                  <Flame className="w-4 h-4 text-orange-500" />
                </div>
                <span className="text-sm font-medium">56</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <div className="p-1.5 rounded-full bg-white/60 dark:bg-black/40">
                  <Share2 className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium">89</span>
              </div>
            </div>

            {/* Creator */}
            <div className="flex items-center gap-3 pt-2">
              <Avatar className="w-8 h-8 ring-2 ring-white/50 dark:ring-black/50">
                <AvatarImage src={metadata?.picture} alt={metadata?.name} />
                <AvatarFallback className={`text-xs ${theme.accent} text-white`}>
                  {genUserName(campaign.pubkey).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {metadata?.name || genUserName(campaign.pubkey)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(parsed.createdAt * 1000).toLocaleDateString()}
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </CardContent>
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
    <Card className="overflow-hidden">
      <div className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
      <CardContent className="p-6 space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-4 py-3 border-t">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-16 ml-auto" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Hero section with animated elements
 */
function HeroSection() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 100]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
      {/* Animated background elements */}
      <motion.div
        style={{ y, opacity }}
        className="absolute inset-0 overflow-hidden"
      >
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500" />

        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </motion.div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm text-slate-300">Civic engagement for everyone</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight"
          >
            <span className="bg-gradient-to-r from-white via-blue-200 to-cyan-200 bg-clip-text text-transparent">
              Make Your Voice
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Heard
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-400 max-w-2xl mx-auto"
          >
            Join campaigns that matter. Contact your representatives. Create real change in your community.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link to="/campaigns/new">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0 text-lg px-8 py-6 h-auto">
                <Plus className="w-5 h-5 mr-2" />
                Start a Campaign
              </Button>
            </Link>
            <Link to="#campaigns">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 h-auto bg-white/5 border-white/10 text-white hover:bg-white/10">
                <Flame className="w-5 h-5 mr-2" />
                Explore Campaigns
              </Button>
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex items-center justify-center gap-8 pt-8"
          >
            <div className="text-center">
              <div className="text-3xl font-bold text-white">10K+</div>
              <div className="text-sm text-slate-500">Campaigns</div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center">
              <div className="text-3xl font-bold text-white">500K+</div>
              <div className="text-sm text-slate-500">Actions Taken</div>
            </div>
            <div className="w-px h-12 bg-white/10" />
            <div className="text-center">
              <div className="text-3xl font-bold text-white">50+</div>
              <div className="text-sm text-slate-500">Countries</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        style={{ opacity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 rounded-full border-2 border-white/30 flex items-start justify-center p-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-white"
          />
        </div>
      </motion.div>
    </section>
  );
}

/**
 * Campaign feed component
 */
function CampaignFeed({ tab }: { tab: FeedTab }) {
  const { nostr } = useNostr();

  const { data: campaigns, isLoading, error } = useQuery({
    queryKey: ['campaigns', tab],
    queryFn: async ({ signal }) => {
      const abortSignal = AbortSignal.any([signal, AbortSignal.timeout(3000)]);

      try {
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

        const campaignEvents = events.filter(isCampaignEvent);
        let sorted = [...campaignEvents];

        if (tab === 'new') {
          sorted.sort((a, b) => b.created_at - a.created_at);
        } else if (tab === 'hot') {
          sorted.sort((a, b) => b.created_at - a.created_at);
        } else {
          sorted.sort((a, b) => b.created_at - a.created_at);
        }

        return sorted;
      } catch (e) {
        // If Nostr query fails, return null to use sample data
        console.log('Nostr query failed, using sample data');
        return null;
      }
    },
    staleTime: 60000,
    refetchInterval: 120000,
    retry: 1,
  });

  // Use sample campaigns if Nostr is empty or failed
  const displayCampaigns = campaigns && campaigns.length > 0
    ? campaigns
    : null;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CampaignCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error || !displayCampaigns) {
    // Use sample data when Nostr fails or returns empty
    return <SampleCampaignFeed tab={tab} />;
  }

  if (displayCampaigns.length === 0) {
    // Use sample data when no campaigns exist
    return <SampleCampaignFeed tab={tab} />;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <AnimatePresence mode="popLayout">
        {displayCampaigns.map((campaign) => (
          <CampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Sample campaign feed when Nostr is empty
 */
function SampleCampaignFeed({ tab }: { tab: FeedTab }) {
  let sampleCampaigns = SAMPLE_CAMPAIGNS;

  if (tab === 'new') {
    sampleCampaigns = getNewCampaigns(9);
  } else if (tab === 'hot') {
    sampleCampaigns = getHotCampaigns(9);
  } else {
    sampleCampaigns = getTrendingCampaigns(9);
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <AnimatePresence mode="popLayout">
        {sampleCampaigns.map((campaign) => (
          <SampleCampaignCard key={campaign.id} campaign={campaign} />
        ))}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * Sample campaign card component
 */
function SampleCampaignCard({ campaign }: { campaign: Campaign }) {
  const user = getUserByPubkey(campaign.creatorPubkey);

  const primaryCategory = campaign.categories[0] || 'community';
  const theme = CATEGORY_THEMES[primaryCategory];
  const Icon = theme.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -30 }}
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={`/campaign/${campaign.id}`}>
        <Card className={`h-full overflow-hidden bg-gradient-to-br ${theme.bgGradient} border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer`}>
          {/* Category header with icon */}
          <div className={`h-2 bg-gradient-to-r ${theme.accent} to-transparent`} />

          <CardContent className="p-6 space-y-4">
            {/* Category badge & hot indicator */}
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 dark:bg-black/40 backdrop-blur-sm`}>
                <Icon className={`w-4 h-4 ${theme.color}`} />
                <span className={`text-sm font-medium ${theme.color} capitalize`}>
                  {primaryCategory.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center gap-1 text-orange-500">
                <Flame className="w-4 h-4" />
                <span className="text-xs font-medium">Hot</span>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {campaign.title}
            </h3>

            {/* Pitch */}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {campaign.description}
            </p>

            {/* Stats */}
            <div className="flex items-center gap-4 py-3 border-t border-black/5 dark:border-white/5">
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 rounded-full bg-white/60 dark:bg-black/40">
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium">{Math.floor(Math.random() * 5000) + 500}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 rounded-full bg-white/60 dark:bg-black/40">
                  <Flame className="w-4 h-4 text-orange-500" />
                </div>
                <span className="text-sm font-medium">{Math.floor(Math.random() * 100) + 10}</span>
              </div>
              <div className="flex items-center gap-1.5 ml-auto">
                <div className="p-1.5 rounded-full bg-white/60 dark:bg-black/40">
                  <Share2 className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium">{Math.floor(Math.random() * 200) + 20}</span>
              </div>
            </div>

            {/* Creator */}
            <div className="flex items-center gap-3 pt-2">
              <Avatar className="w-8 h-8 ring-2 ring-white/50 dark:ring-black/50">
                <AvatarImage src={user.picture} alt={user.name} />
                <AvatarFallback className={`text-xs ${theme.accent} text-white`}>
                  {user.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{user.name}</div>
                <div className="text-xs text-muted-foreground">
                  {formatRelativeTime(campaign.createdAt)}
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

/**
 * Format relative time
 */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now() / 1000;
  const diff = now - timestamp;

  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(timestamp * 1000).toLocaleDateString();
}

/**
 * Main index page
 */
export default function Index() {
  const [activeTab, setActiveTab] = useState<FeedTab>('hot');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Movement</h1>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link to="/campaigns/new">
                <Button className="bg-blue-500 hover:bg-blue-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </Link>
              <LoginArea className="max-w-60" />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <HeroSection />

      {/* Campaigns Section */}
      <section id="campaigns" className="py-20">
        <div className="container mx-auto px-4">
          {/* Section header */}
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <Flame className="w-3 h-3 mr-1" />
              Trending Now
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Campaigns That Matter</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join thousands of people taking action on issues they care about.
              Browse active campaigns or start your own.
            </p>
          </div>

          {/* Feed Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as FeedTab)}
            className="w-full"
          >
            <div className="flex items-center justify-center mb-8">
              <TabsList className="grid w-full max-w-md grid-cols-3 p-1.5 bg-slate-100 dark:bg-slate-800">
                <TabsTrigger
                  value="trending"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Trending
                </TabsTrigger>
                <TabsTrigger
                  value="hot"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
                >
                  <Flame className="w-4 h-4 mr-2" />
                  Hot
                </TabsTrigger>
                <TabsTrigger
                  value="new"
                  className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  New
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              <CampaignFeed tab={activeTab} />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 to-cyan-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl font-bold text-white">
              Ready to Make a Difference?
            </h2>
            <p className="text-xl text-blue-100">
              Start a campaign on an issue you care about. Your voice matters.
            </p>
            <Link to="/campaigns/new">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-6 h-auto">
                <Plus className="w-5 h-5 mr-2" />
                Start Your Campaign
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-slate-950 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold text-slate-400">Movement</span>
            </div>
            <p>
              Civic engagement platform built on Nostr. Your voice, your power.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}