/**
 * Campaign Detail Page
 * 
 * Displays campaign details and "Take Action" flow:
 * 1. View campaign
 * 2. Identify user (ZIP/address)
 * 3. Review representatives
 * 4. Draft message
 * 5. Send message
 * 6. Generate action attestation
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
} from '@/types/nostr';
import type { Representative, MessageDraft } from '@/types/representative';
import { STORAGE_KEYS } from '@/types/representative';

/**
 * Action flow steps
 */
type ActionStep = 'identify' | 'representatives' | 'message' | 'send' | 'success';

/**
 * Mock representative lookup (MVP - stubbed)
 * In production, this would call real representative lookup API
 */
async function lookupRepresentatives(zipCode: string): Promise<Representative[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return mock representatives
  return [
    {
      id: 'senator-1',
      name: 'Senator Jane Smith',
      level: 'federal',
      office: 'U.S. Senate',
      party: 'Democratic',
      contact: {
        method: 'email',
        email: 'senator.smith@senate.gov',
        formUrl: 'https://smith.senate.gov/contact',
      },
      state: 'CA',
      district: 'California',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=senator1',
    },
    {
      id: 'representative-1',
      name: 'Rep. John Doe',
      level: 'federal',
      office: 'U.S. House of Representatives',
      party: 'Republican',
      contact: {
        method: 'form',
        formUrl: 'https://doe.house.gov/contact',
      },
      state: 'CA',
      district: 'CA-12',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rep1',
    },
  ];
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
  const nostrLink = `nostr:${window.location.origin}/campaign/${campaignId}`;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied!', description: 'Link copied to clipboard' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Failed to copy', description: 'Unable to copy to clipboard' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Campaign</DialogTitle>
          <DialogDescription>
            Share "{campaignTitle}" to help it reach more people
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <Label>Web Link</Label>
            <div className="flex gap-2 mt-2">
              <Input value={shareUrl} readOnly className="font-mono text-sm" />
              <Button onClick={() => copyToClipboard(shareUrl)} size="icon" variant="outline">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label>Nostr Link</Label>
            <div className="flex gap-2 mt-2">
              <Input value={nostrLink} readOnly className="font-mono text-sm" />
              <Button onClick={() => copyToClipboard(nostrLink)} size="icon" variant="outline">
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="text-center pt-2">
            <p className="text-sm text-muted-foreground">
              Scan QR code to share on mobile
            </p>
            <div className="flex justify-center mt-4">
              <div className="bg-white p-4 rounded-lg">
                <QrCode className="w-32 h-32 text-black" />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
  const [messageDraft, setMessageDraft] = useState<MessageDraft | null>(null);
  const [isTakingAction, setIsTakingAction] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [actionCompleted, setActionCompleted] = useState(false);

  // Query campaign
  const { data: campaign, isLoading, error } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: async ({ signal }) => {
      const abortSignal = AbortSignal.any([signal, AbortSignal.timeout(5000)]);
      
      if (!campaignId) {
        throw new Error('Campaign ID is required');
      }

      const events = await nostr.query(
        [
          {
            kinds: [CAMPAIGN_KIND],
            '#d': [campaignId],
            limit: 1,
          },
        ],
        { signal: abortSignal }
      );

      const campaignEvent = events.find(isCampaignEvent);
      if (!campaignEvent) {
        throw new Error('Campaign not found');
      }

      return campaignEvent;
    },
    enabled: !!campaignId,
    staleTime: 60000,
  });

  const parsedCampaign = campaign ? parseCampaign(campaign) : null;

  // Handle user identification
  const handleIdentifyUser = async () => {
    if (!zipCode || zipCode.length < 5) {
      toast({ variant: 'destructive', title: 'Invalid ZIP', description: 'Please enter a valid ZIP code' });
      return;
    }

    try {
      const reps = await lookupRepresentatives(zipCode);
      setRepresentatives(reps);
      
      // Load saved draft from localStorage if available
      const savedDraft = localStorage.getItem(`${STORAGE_KEYS.MESSAGE_DRAFTS}_${campaignId}`);
      if (savedDraft) {
        setMessageDraft(JSON.parse(savedDraft));
      } else {
        // Create new draft with default message
        setMessageDraft({
          campaignId: campaignId!,
          representatives: reps,
          subject: `Regarding: ${parsedCampaign?.title}`,
          body: `Dear Representative,

I am writing to you as a constituent regarding ${parsedCampaign?.title}.

${parsedCampaign?.description}

I urge you to take action on this important issue.

Sincerely,
[Your Name]`,
          customValues: {},
          userZip: zipCode,
          createdAt: Date.now(),
          lastModified: Date.now(),
        });
      }

      setActionStep('representatives');
    } catch (err) {
      toast({ variant: 'destructive', title: 'Lookup Failed', description: 'Failed to look up representatives' });
    }
  };

  // Handle message update
  const handleMessageUpdate = (field: 'subject' | 'body', value: string) => {
    if (!messageDraft) return;

    const updated = {
      ...messageDraft,
      [field]: value,
      lastModified: Date.now(),
    };
    setMessageDraft(updated);
    localStorage.setItem(`${STORAGE_KEYS.MESSAGE_DRAFTS}_${campaignId}`, JSON.stringify(updated));
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Login Required', description: 'Please log in to take action' });
      return;
    }

    if (!messageDraft || !campaign) {
      return;
    }

    setIsTakingAction(true);
    setActionStep('send');

    try {
      // Simulate message delivery (MVP - stubbed)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate action attestation
      const timestamp = Math.floor(Date.now() / 1000);
      const nonce = generateNonce();

      createEvent({
        kind: ACTION_ATTESTATION_KIND,
        content: `I contacted my representatives about "${parsedCampaign?.title}"`,
        tags: [
          ['e', campaign.id],
          ['d', campaignId!],
          ['timestamp', timestamp],
          ['nonce', nonce],
          ['rep_count', representatives.length],
          ['alt', `Action Attestation: ${genUserName(user.pubkey)} took action on ${parsedCampaign?.title}`],
        ],
      });

      setActionStep('success');
      setActionCompleted(true);
      
      // Clear draft
      localStorage.removeItem(`${STORAGE_KEYS.MESSAGE_DRAFTS}_${campaignId}`);
      
      toast({ title: 'Action Completed!', description: 'Your message has been sent to your representatives' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Action Failed', description: 'Failed to send message' });
      setActionStep('message');
    } finally {
      setIsTakingAction(false);
    }
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
  if (error || !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 px-8 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Campaign Not Found</h3>
            <p className="text-muted-foreground mb-6">
              The campaign you're looking for doesn't exist or may have been removed.
            </p>
            <Link to="/">
              <Button>Back to Campaigns</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-semibold truncate">{parsedCampaign?.title}</h1>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowShareDialog(true)}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Campaign Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Title */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {parsedCampaign?.categories.map((category) => (
                  <Badge key={category} variant="secondary">
                    {category.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {parsedCampaign?.title}
              </h2>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={metadata?.picture} alt={metadata?.name} />
                    <AvatarFallback className="text-xs">
                      {genUserName(campaign.pubkey).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm">
                    {metadata?.name || genUserName(campaign.pubkey)}
                  </span>
                </div>
                <span>•</span>
                <span className="text-sm">
                  {new Date(parsedCampaign?.createdAt! * 1000).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Campaign Description */}
            <Card>
              <CardContent className="pt-6">
                <NoteContent event={campaign} className="prose dark:prose-invert max-w-none" />
              </CardContent>
            </Card>

            {/* Social Proof */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Social Proof
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-muted-foreground">Actions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-muted-foreground">In 24h</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-sm text-muted-foreground">Shares</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Take Action */}
          <div className="space-y-4">
            <Card className="sticky top-24">
              {actionCompleted ? (
                // Success State
                <CardContent className="py-8 text-center space-y-4">
                  <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Action Completed!</h3>
                    <p className="text-sm text-muted-foreground">
                      You've successfully contacted your representatives.
                    </p>
                  </div>
                  <div className="space-y-2 pt-4">
                    <Button className="w-full" onClick={() => setShowShareDialog(true)}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Share Your Action
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => setActionCompleted(false)}>
                      Take Another Action
                    </Button>
                  </div>
                </CardContent>
              ) : (
                // Action Flow
                <>
                  <CardHeader>
                    <CardTitle>Take Action</CardTitle>
                    <CardDescription>
                      Contact your representatives about this issue
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!actionStep ? (
                      // Initial State
                      <div>
                        {user ? (
                          <Button className="w-full" onClick={() => setActionStep('identify')}>
                            <Send className="w-4 h-4 mr-2" />
                            Start Taking Action
                          </Button>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground text-center">
                              Log in to take action on this campaign
                            </p>
                            <div className="flex justify-center">
                              <div className="max-w-60">
                                {/* LoginArea would go here */}
                                <Button variant="outline" className="w-full">
                                  Login with Nostr
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : actionStep === 'identify' ? (
                      // Step 1: Identify User
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="zip">ZIP Code</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              id="zip"
                              type="text"
                              placeholder="90210"
                              value={zipCode}
                              onChange={(e) => setZipCode(e.target.value)}
                              maxLength={5}
                              className="font-mono"
                            />
                            <Button onClick={handleIdentifyUser}>
                              Find Reps
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            We'll use your ZIP code to find your representatives
                          </p>
                        </div>
                        <Button variant="outline" onClick={() => setActionStep(null)} className="w-full">
                          Cancel
                        </Button>
                      </div>
                    ) : actionStep === 'representatives' ? (
                      // Step 2: Review Representatives
                      <div className="space-y-4">
                        <div>
                          <Label>Representatives Found</Label>
                          <div className="space-y-3 mt-2">
                            {representatives.map((rep) => (
                              <div key={rep.id} className="flex items-start gap-3 p-3 rounded-lg border">
                                <Avatar className="w-10 h-10">
                                  <AvatarImage src={rep.photo} alt={rep.name} />
                                  <AvatarFallback>{rep.name.slice(0, 2)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium truncate">{rep.name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {rep.office}
                                  </div>
                                  {rep.party && (
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {rep.party}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {representatives.length} representative{representatives.length !== 1 ? 's' : ''} found
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => setActionStep('message')} className="flex-1">
                            Next: Draft Message
                          </Button>
                          <Button variant="outline" onClick={() => setActionStep('identify')} className="flex-1">
                            Back
                          </Button>
                        </div>
                      </div>
                    ) : actionStep === 'message' ? (
                      // Step 3: Draft Message
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="subject">Subject</Label>
                          <Input
                            id="subject"
                            value={messageDraft?.subject || ''}
                            onChange={(e) => handleMessageUpdate('subject', e.target.value)}
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="message">Message</Label>
                          <Textarea
                            id="message"
                            value={messageDraft?.body || ''}
                            onChange={(e) => handleMessageUpdate('body', e.target.value)}
                            rows={10}
                            className="mt-2 font-mono text-sm"
                            placeholder="Write your message to your representatives..."
                          />
                          <p className="text-xs text-muted-foreground mt-2">
                            Your message will be sent to all {representatives.length} representatives
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleSendMessage} className="flex-1">
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
                          <Button variant="outline" onClick={() => setActionStep('representatives')} className="flex-1">
                            Back
                          </Button>
                        </div>
                      </div>
                    ) : actionStep === 'send' ? (
                      // Step 4: Sending
                      <div className="py-8 text-center space-y-4">
                        <Loader2 className="w-12 h-12 mx-auto animate-spin text-muted-foreground" />
                        <div>
                          <h3 className="font-semibold mb-2">Sending Your Message</h3>
                          <p className="text-sm text-muted-foreground">
                            Contacting {representatives.length} representative{representatives.length !== 1 ? 's' : ''}...
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </>
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* Share Dialog */}
      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        campaignId={campaignId || ''}
        campaignTitle={parsedCampaign?.title || ''}
      />
    </div>
  );
}