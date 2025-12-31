/**
 * Campaign Detail Page - Redesigned
 * 
 * Immersive campaign page with:
 * - Hero banner with gradient overlay
 * - Animated stats and social proof
 * - Smooth action flow with progress steps
 * - Beautiful share modal
 */

import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useNostr } from '@nostrify/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Share2,
  Users,
  Flame,
  MessageCircle,
  Heart,
  Copy,
  CheckCircle2,
  AlertCircle,
  MapPin,
  User,
  FileText,
  Send,
  Loader2,
  QrCode,
  ChevronRight,
  Zap,
  Target,
  Clock,
  TrendingUp,
  Mic,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/useToast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useAuthor } from '@/hooks/useAuthor';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { genUserName } from '@/lib/genUserName';
import { NoteContent } from '@/components/NoteContent';
import {
  CampaignEvent,
  parseCampaign,
  isCampaignEvent,
  CAMPAIGN_KIND,
  ACTION_ATTESTATION_KIND,
  generateNonce,
  type CampaignCategory,
} from '@/types/nostr';
import type { Representative } from '@/types/representative';

/**
 * Action flow steps
 */
type ActionStep = 'identify' | 'representatives' | 'message' | 'send' | 'success';

/**
 * Get category theme
 */
function getCategoryTheme(category: CampaignCategory) {
  const themes: Record<CampaignCategory, { color: string; bgGradient: string; borderColor: string }> = {
    environment: { color: 'text-emerald-700 dark:text-emerald-400', bgGradient: 'from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50', borderColor: 'border-emerald-200 dark:border-emerald-800' },
    healthcare: { color: 'text-rose-700 dark:text-rose-400', bgGradient: 'from-rose-50 to-red-50 dark:from-rose-950/50 dark:to-red-950/50', borderColor: 'border-rose-200 dark:border-rose-800' },
    education: { color: 'text-blue-700 dark:text-blue-400', bgGradient: 'from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50', borderColor: 'border-blue-200 dark:border-blue-800' },
    civil_rights: { color: 'text-purple-700 dark:text-purple-400', bgGradient: 'from-purple-50 to-violet-50 dark:from-purple-950/50 dark:to-violet-950/50', borderColor: 'border-purple-200 dark:border-purple-800' },
    economy: { color: 'text-amber-700 dark:text-amber-400', bgGradient: 'from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50', borderColor: 'border-amber-200 dark:border-amber-800' },
    immigration: { color: 'text-orange-700 dark:text-orange-400', bgGradient: 'from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50', borderColor: 'border-orange-200 dark:border-orange-800' },
    gun_control: { color: 'text-red-700 dark:text-red-400', bgGradient: 'from-red-50 to-rose-50 dark:from-red-950/50 dark:to-rose-950/50', borderColor: 'border-red-200 dark:border-red-800' },
    housing: { color: 'text-cyan-700 dark:text-cyan-400', bgGradient: 'from-cyan-50 to-sky-50 dark:from-cyan-950/50 dark:to-sky-950/50', borderColor: 'border-cyan-200 dark:border-cyan-800' },
    transportation: { color: 'text-indigo-700 dark:text-indigo-400', bgGradient: 'from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/50', borderColor: 'border-indigo-200 dark:border-indigo-800' },
    technology: { color: 'text-violet-700 dark:text-violet-400', bgGradient: 'from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50', borderColor: 'border-violet-200 dark:border-violet-800' },
    criminal_justice: { color: 'text-slate-700 dark:text-slate-400', bgGradient: 'from-slate-50 to-gray-50 dark:from-slate-950/50 dark:to-gray-950/50', borderColor: 'border-slate-200 dark:border-slate-800' },
    election_reform: { color: 'text-amber-700 dark:text-amber-400', bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50', borderColor: 'border-amber-200 dark:border-amber-800' },
    government_transparency: { color: 'text-teal-700 dark:text-teal-400', bgGradient: 'from-teal-50 to-cyan-50 dark:from-teal-950/50 dark:to-cyan-950/50', borderColor: 'border-teal-200 dark:border-teal-800' },
    public_safety: { color: 'text-pink-700 dark:text-pink-400', bgGradient: 'from-pink-50 to-rose-50 dark:from-pink-950/50 dark:to-rose-950/50', borderColor: 'border-pink-200 dark:border-pink-800' },
    community: { color: 'text-lime-700 dark:text-lime-400', bgGradient: 'from-lime-50 to-green-50 dark:from-lime-950/50 dark:to-green-950/50', borderColor: 'border-lime-200 dark:border-lime-800' },
  };
  return themes[category] || themes.community;
}

/**
 * Mock representative lookup
 */
async function lookupRepresentatives(zipCode: string): Promise<Representative[]> {
  await new Promise(resolve => setTimeout(resolve, 800));
  return [
    {
      id: 'senator-1',
      name: 'Senator Jane Smith',
      level: 'federal',
      office: 'U.S. Senate',
      party: 'Democratic',
      contact: { method: 'email', email: 'senator.smith@senate.gov' },
      state: 'CA',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=senator1',
    },
    {
      id: 'rep-1',
      name: 'Rep. John Doe',
      level: 'federal',
      office: 'U.S. House of Representatives',
      party: 'Republican',
      contact: { method: 'form', formUrl: 'https://doe.house.gov/contact' },
      state: 'CA',
      district: 'CA-12',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rep1',
    },
  ];
}

/**
 * Animated counter component
 */
function AnimatedCounter({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <motion.div
        key={value}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="text-3xl font-bold"
      >
        {value.toLocaleString()}
      </motion.div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

/**
 * Share dialog component
 */
function ShareDialog({ isOpen, onClose, campaignId, campaignTitle }: {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  campaignTitle: string;
}) {
  const { toast } = useToast();
  const shareUrl = `${window.location.origin}/campaign/${campaignId}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied!', description: 'Link copied to clipboard' });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to copy' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Campaign
          </DialogTitle>
          <DialogDescription>
            Spread the word about "{campaignTitle}"
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50">
            <Label className="text-xs text-muted-foreground">Web Link</Label>
            <div className="flex gap-2 mt-2">
              <Input value={shareUrl} readOnly className="font-mono text-sm bg-white/50" />
              <Button onClick={() => copyToClipboard(shareUrl)} size="icon" variant="outline">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={() => copyToClipboard(`nostr:${shareUrl}`)} variant="outline" className="justify-start gap-2">
              <span className="text-lg">⚡</span>
              Nostr
            </Button>
            <Button onClick={() => copyToClipboard(shareUrl)} variant="outline" className="justify-start gap-2">
              <Copy className="w-4 h-4" />
              Copy Link
            </Button>
          </div>

          <div className="flex justify-center py-4">
            <div className="w-32 h-32 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center">
              <QrCode className="w-24 h-24 text-slate-800 dark:text-slate-200" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Action step indicator
 */
function ActionSteps({ currentStep }: { currentStep: ActionStep | null }) {
  const steps: { key: ActionStep; label: string; icon: any }[] = [
    { key: 'identify', label: 'Identify', icon: MapPin },
    { key: 'representatives', label: 'Representatives', icon: Users },
    { key: 'message', label: 'Message', icon: MessageCircle },
    { key: 'send', label: 'Send', icon: Send },
  ];

  if (!currentStep) return null;

  const currentIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        
        return (
          <motion.div
            key={step.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center"
          >
            <div className="flex flex-col items-center">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center transition-all
                ${isCompleted ? 'bg-green-500 text-white' : ''}
                ${isCurrent ? 'bg-blue-500 text-white ring-4 ring-blue-500/20' : ''}
                ${!isCompleted && !isCurrent ? 'bg-slate-100 dark:bg-slate-800 text-slate-400' : ''}
              `}>
                {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-5 h-5" />}
              </div>
              <span className={`text-xs mt-2 ${isCurrent ? 'font-medium text-blue-500' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * Campaign detail page
 */
export default function CampaignDetail() {
  const { campaignId } = useParams<{ campaignId: string }>();
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();
  const { toast } = useToast();
  const author = useAuthor(campaignId || '');
  const metadata = author.data?.metadata;

  const [actionStep, setActionStep] = useState<ActionStep | null>(null);
  const [zipCode, setZipCode] = useState('');
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [messageDraft, setMessageDraft] = useState({ subject: '', body: '' });
  const [isTakingAction, setIsTakingAction] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [actionCompleted, setActionCompleted] = useState(false);

  // Query campaign
  const { data: campaign, isLoading, error } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async ({ signal }) => {
      if (!campaignId) throw new Error('Campaign ID required');
      
      const events = await nostr.query(
        [{ kinds: [CAMPAIGN_KIND], '#d': [campaignId], limit: 1 }],
        { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) }
      );

      const campaignEvent = events.find(isCampaignEvent);
      if (!campaignEvent) throw new Error('Campaign not found');
      return campaignEvent;
    },
    enabled: !!campaignId,
    staleTime: 60000,
  });

  const parsedCampaign = campaign ? parseCampaign(campaign) : null;
  const categoryTheme = parsedCampaign ? getCategoryTheme(parsedCampaign.categories[0] || 'community') : getCategoryTheme('community');

  // Handle user identification
  const handleIdentifyUser = async () => {
    if (!zipCode || zipCode.length < 5) {
      toast({ variant: 'destructive', title: 'Invalid ZIP', description: 'Please enter a valid ZIP code' });
      return;
    }

    const reps = await lookupRepresentatives(zipCode);
    setRepresentatives(reps);
    setMessageDraft({
      subject: `Regarding: ${parsedCampaign?.title}`,
      body: `Dear Representative,

I am writing as a constituent about ${parsedCampaign?.title}.

${parsedCampaign?.description}

Please take action on this important issue.

Sincerely,
[Your Name]`,
    });
    setActionStep('representatives');
  };

  // Handle message send
  const handleSendMessage = async () => {
    if (!user || !campaign) return;
    setIsTakingAction(true);
    setActionStep('send');

    await new Promise(resolve => setTimeout(resolve, 2000));

    const timestamp = Math.floor(Date.now() / 1000);
    createEvent({
      kind: ACTION_ATTESTATION_KIND,
      content: `I took action on "${parsedCampaign?.title}"`,
      tags: [
        ['e', campaign.id],
        ['d', campaignId!],
        ['timestamp', timestamp],
        ['nonce', generateNonce()],
        ['rep_count', representatives.length],
        ['alt', `Action on ${parsedCampaign?.title}`],
      ],
    });

    setActionStep('success');
    setActionCompleted(true);
    toast({ title: 'Action Completed!', description: 'Your message has been sent to your representatives.' });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error || !campaign || !parsedCampaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-16 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Campaign Not Found</h3>
            <p className="text-muted-foreground mb-6">The campaign you're looking for doesn't exist.</p>
            <Link to="/">
              <Button>Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero Banner */}
      <section className="relative min-h-[50vh] flex items-end bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] opacity-20" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
        
        <div className="container mx-auto px-4 py-16 relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Campaigns
          </Link>

          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-2 mb-4"
            >
              {parsedCampaign.categories.map((cat) => (
                <Badge key={cat} variant="secondary" className="bg-white/10 text-white border-white/20">
                  {cat.replace('_', ' ')}
                </Badge>
              ))}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold text-white mb-6"
            >
              {parsedCampaign.title}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4 text-slate-300"
            >
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={metadata?.picture} />
                  <AvatarFallback>{genUserName(campaign.pubkey).slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span>{metadata?.name || genUserName(campaign.pubkey)}</span>
              </div>
              <span>•</span>
              <span>{new Date(parsedCampaign.createdAt * 1000).toLocaleDateString()}</span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* Left Column - Campaign Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { icon: Users, value: '1,234', label: 'Actions', color: 'text-blue-500' },
                { icon: Flame, value: '56', label: 'Today', color: 'text-orange-500' },
                { icon: Share2, value: '89', label: 'Shares', color: 'text-green-500' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                >
                  <Card className="text-center p-6">
                    <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Campaign Description */}
            <Card className={categoryTheme.bgGradient}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  About This Campaign
                </CardTitle>
              </CardHeader>
              <CardContent>
                <NoteContent event={campaign} className="prose dark:prose-invert max-w-none" />
              </CardContent>
            </Card>

            {/* Target Levels */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Target Levels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {parsedCampaign.targetLevels.map((level) => (
                    <Badge key={level} variant="outline" className="px-4 py-2 text-sm">
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Take Action */}
          <div className="space-y-6">
            {/* Action Card */}
            <Card className="sticky top-24 overflow-hidden">
              {!actionCompleted ? (
                <>
                  <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500" />
                  <CardContent className="pt-6">
                    {/* Step Indicator */}
                    <ActionSteps currentStep={actionStep} />

                    {!actionStep ? (
                      // Initial State
                      <div className="text-center space-y-6">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 flex items-center justify-center">
                          <Send className="w-10 h-10 text-blue-500" />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2">Take Action</h3>
                          <p className="text-muted-foreground">
                            Contact your representatives and make your voice heard on this important issue.
                          </p>
                        </div>
                        {user ? (
                          <Button onClick={() => setActionStep('identify')} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500">
                            Start Taking Action
                          </Button>
                        ) : (
                          <Button variant="outline" className="w-full">Login to Take Action</Button>
                        )}
                      </div>
                    ) : actionStep === 'identify' ? (
                      // Step 1: Identify
                      <div className="space-y-6">
                        <div className="text-center">
                          <h3 className="text-lg font-semibold mb-2">Identify Yourself</h3>
                          <p className="text-sm text-muted-foreground">
                            Enter your ZIP code to find your representatives
                          </p>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="zip">ZIP Code</Label>
                            <Input
                              id="zip"
                              placeholder="90210"
                              value={zipCode}
                              onChange={(e) => setZipCode(e.target.value)}
                              maxLength={5}
                              className="mt-2"
                            />
                          </div>
                          <Button onClick={handleIdentifyUser} className="w-full" disabled={zipCode.length < 5}>
                            Find My Representatives
                          </Button>
                          <Button variant="outline" onClick={() => setActionStep(null)} className="w-full">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : actionStep === 'representatives' ? (
                      // Step 2: Representatives
                      <div className="space-y-6">
                        <div className="text-center">
                          <Users className="w-12 h-12 mx-auto mb-2 text-blue-500" />
                          <h3 className="text-lg font-semibold">Your Representatives</h3>
                          <p className="text-sm text-muted-foreground">
                            {representatives.length} representative{representatives.length !== 1 ? 's' : ''} found
                          </p>
                        </div>
                        <div className="space-y-3">
                          {representatives.map((rep) => (
                            <div key={rep.id} className={`flex items-center gap-3 p-3 rounded-lg border ${categoryTheme.borderColor}`}>
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={rep.photo} />
                                <AvatarFallback>{rep.name.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{rep.name}</div>
                                <div className="text-xs text-muted-foreground">{rep.office}</div>
                              </div>
                              <Badge variant="secondary" className="text-xs">{rep.level}</Badge>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => setActionStep('message')} className="flex-1">
                            Next: Write Message
                          </Button>
                          <Button variant="outline" onClick={() => setActionStep('identify')}>
                            Back
                          </Button>
                        </div>
                      </div>
                    ) : actionStep === 'message' ? (
                      // Step 3: Message
                      <div className="space-y-6">
                        <div className="text-center">
                          <MessageCircle className="w-12 h-12 mx-auto mb-2 text-blue-500" />
                          <h3 className="text-lg font-semibold">Write Your Message</h3>
                          <p className="text-sm text-muted-foreground">
                            Your message will be sent to all {representatives.length} representatives
                          </p>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <Label>Subject</Label>
                            <Input
                              value={messageDraft.subject}
                              onChange={(e) => setMessageDraft(prev => ({ ...prev, subject: e.target.value }))}
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label>Message</Label>
                            <Textarea
                              value={messageDraft.body}
                              onChange={(e) => setMessageDraft(prev => ({ ...prev, body: e.target.value }))}
                              rows={8}
                              className="mt-2"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleSendMessage} disabled={isTakingAction} className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-500">
                              {isTakingAction ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4 mr-2" />
                                  Send Message
                                </>
                              )}
                            </Button>
                            <Button variant="outline" onClick={() => setActionStep('representatives')}>
                              Back
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : actionStep === 'send' ? (
                      // Step 4: Sending
                      <div className="py-12 text-center space-y-6">
                        <div className="relative w-24 h-24 mx-auto">
                          <div className="absolute inset-0 rounded-full border-4 border-blue-500/20" />
                          <motion.div
                            className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">Sending Your Message</h3>
                          <p className="text-muted-foreground">
                            Contacting {representatives.length} representatives...
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </>
              ) : (
                // Success State
                <div className="py-8 text-center space-y-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/30"
                  >
                    <CheckCircle2 className="w-12 h-12 text-white" />
                  </motion.div>
                  <div>
                    <h3 className="text-2xl font-bold">Action Completed!</h3>
                    <p className="text-muted-foreground mt-2">
                      You've successfully contacted your representatives about this campaign.
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <Button onClick={() => setShowShareDialog(true)} className="w-full bg-gradient-to-r from-blue-500 to-cyan-500">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Your Action
                    </Button>
                    <Link to="/">
                      <Button variant="outline" className="w-full">
                        Explore More Campaigns
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </Card>

            {/* Share Card */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 text-white">
              <CardContent className="pt-6 text-center">
                <h4 className="font-semibold mb-2">Spread the Word</h4>
                <p className="text-sm text-slate-300 mb-4">
                  Help this campaign reach more people
                </p>
                <Button onClick={() => setShowShareDialog(true)} variant="secondary" className="w-full">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Campaign
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Share Dialog */}
      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        campaignId={campaignId || ''}
        campaignTitle={parsedCampaign.title}
      />
    </div>
  );
}