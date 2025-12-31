/**
 * Create Campaign Page
 * 
 * Campaign creation flow:
 * 1. Campaign Details (title, pitch, category, target levels)
 * 2. Message Template (draft message to representatives)
 * 3. Optional Cashu Stake (anti-spam measure)
 * 4. Review & Publish
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  MapPin,
  DollarSign,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/useToast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { CAMPAIGN_KIND } from '@/types/nostr';
import type { CampaignCategory, TargetLevel, CashuStakeConfig } from '@/types/nostr';
import { DEFAULT_CASHU_STAKE_CONFIG } from '@/types/representative';

/**
 * Creation flow steps
 */
type CreateStep = 'details' | 'template' | 'stake' | 'review';

/**
 * Form validation schema
 */
const campaignSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(100, 'Title must be under 100 characters'),
  pitch: z.string().min(20, 'Pitch must be at least 20 characters').max(280, 'Pitch must be under 280 characters'),
  description: z.string().min(50, 'Description must be at least 50 characters').max(5000, 'Description must be under 5000 characters'),
  category: z.enum([
    'environment', 'healthcare', 'education', 'civil_rights', 'economy',
    'immigration', 'gun_control', 'housing', 'transportation', 'technology',
    'criminal_justice', 'election_reform', 'government_transparency',
    'public_safety', 'community'
  ]),
  targetLevels: z.array(z.enum(['federal', 'state', 'local'])).min(1, 'Select at least one target level'),
  templateSubject: z.string().max(100, 'Subject must be under 100 characters'),
  templateBody: z.string().min(50, 'Message template must be at least 50 characters').max(2000, 'Message must be under 2000 characters'),
});

type CampaignFormData = z.infer<typeof campaignSchema>;

/**
 * Campaign categories
 */
const CATEGORIES: { value: CampaignCategory; label: string }[] = [
  { value: 'environment', label: 'Environment' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'civil_rights', label: 'Civil Rights' },
  { value: 'economy', label: 'Economy' },
  { value: 'immigration', label: 'Immigration' },
  { value: 'gun_control', label: 'Gun Control' },
  { value: 'housing', label: 'Housing' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'technology', label: 'Technology' },
  { value: 'criminal_justice', label: 'Criminal Justice' },
  { value: 'election_reform', label: 'Election Reform' },
  { value: 'government_transparency', label: 'Government Transparency' },
  { value: 'public_safety', label: 'Public Safety' },
  { value: 'community', label: 'Community' },
];

/**
 * Target levels
 */
const TARGET_LEVELS: { value: TargetLevel; label: string; description: string }[] = [
  { value: 'federal', label: 'Federal', description: 'Congress, Senate, President' },
  { value: 'state', label: 'State', description: 'Governor, State Legislature' },
  { value: 'local', label: 'Local', description: 'Mayor, City Council, School Board' },
];

/**
 * Create campaign page
 */
export default function CreateCampaign() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useCurrentUser();
  const { mutate: createEvent, isPending: isPublishing } = useNostrPublish();
  
  const [currentStep, setCurrentStep] = useState<CreateStep>('details');
  const [stakeEnabled, setStakeEnabled] = useState(false);
  const [isPublishingCampaign, setIsPublishingCampaign] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      pitch: '',
      description: '',
      category: undefined,
      targetLevels: [],
      templateSubject: '',
      templateBody: '',
    },
  });

  const formData = watch();

  // Check if user is logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <Card className="max-w-md">
          <CardContent className="py-12 px-8 text-center space-y-4">
            <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground" />
            <h3 className="text-lg font-semibold">Login Required</h3>
            <p className="text-muted-foreground">
              You need to log in with Nostr to create a campaign.
            </p>
            <Link to="/">
              <Button className="w-full">Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Handle step navigation
  const goToNextStep = async () => {
    let valid = false;
    
    if (currentStep === 'details') {
      valid = await trigger(['title', 'pitch', 'description', 'category', 'targetLevels']);
    } else if (currentStep === 'template') {
      valid = await trigger(['templateSubject', 'templateBody']);
    } else if (currentStep === 'review') {
      valid = isValid;
    }
    
    if (valid) {
      const steps: CreateStep[] = ['details', 'template', 'stake', 'review'];
      const currentIndex = steps.indexOf(currentStep);
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1]);
      }
    }
  };

  const goToPreviousStep = () => {
    const steps: CreateStep[] = ['details', 'template', 'stake', 'review'];
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  // Handle campaign publishing
  const onSubmit = async (data: CampaignFormData) => {
    if (!user) return;

    setIsPublishingCampaign(true);

    try {
      // Generate unique campaign ID
      const campaignId = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Date.now().toString().slice(-6);

      // Create campaign event
      createEvent({
        kind: CAMPAIGN_KIND,
        content: data.description,
        tags: [
          ['d', campaignId],
          ['title', data.title],
          ['category', data.category],
          ...data.targetLevels.map(level => ['target_level', level] as const),
          ['created_at', Math.floor(Date.now() / 1000)],
          ['status', 'active'],
          ['alt', `Campaign: ${data.title}`],
        ],
      });

      toast({
        title: 'Campaign Published!',
        description: 'Your campaign is now live and can be shared.',
      });

      // Navigate to campaign page
      navigate(`/campaign/${campaignId}`);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Failed to Publish',
        description: 'There was an error publishing your campaign. Please try again.',
      });
    } finally {
      setIsPublishingCampaign(false);
    }
  };

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
              <h1 className="text-xl font-semibold">Create Campaign</h1>
            </div>
            <div className="text-sm text-muted-foreground">
              Step {['details', 'template', 'stake', 'review'].indexOf(currentStep) + 1} of 4
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="h-1 bg-muted">
        <motion.div
          className="h-full bg-blue-500"
          initial={{ width: '25%' }}
          animate={{ width: `${(['details', 'template', 'stake', 'review'].indexOf(currentStep) + 1) * 25}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-8">
            {/* Step 1: Campaign Details */}
            {currentStep === 'details' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Campaign Details
                    </CardTitle>
                    <CardDescription>
                      Tell people what your campaign is about
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Campaign Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Save the Local Park"
                        {...register('title')}
                      />
                      {errors.title && (
                        <p className="text-sm text-destructive">{errors.title.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pitch">Short Pitch *</Label>
                      <Textarea
                        id="pitch"
                        placeholder="A brief description (max 280 characters)"
                        maxLength={280}
                        rows={3}
                        {...register('pitch')}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {formData.pitch.length}/280
                      </p>
                      {errors.pitch && (
                        <p className="text-sm text-destructive">{errors.pitch.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Full Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Tell the full story of your campaign. Why does this matter? What are you asking for?"
                        rows={8}
                        {...register('description')}
                      />
                      {errors.description && (
                        <p className="text-sm text-destructive">{errors.description.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setValue('category', value as CampaignCategory)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.category && (
                        <p className="text-sm text-destructive">{errors.category.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Target Government Levels *</Label>
                      <div className="grid gap-3 mt-2">
                        {TARGET_LEVELS.map((level) => (
                          <div
                            key={level.value}
                            className="flex items-center space-x-3 p-4 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                            onClick={() => {
                              const current = formData.targetLevels;
                              if (current.includes(level.value)) {
                                setValue('targetLevels', current.filter(l => l !== level.value));
                              } else {
                                setValue('targetLevels', [...current, level.value]);
                              }
                            }}
                          >
                            <Checkbox
                              checked={formData.targetLevels.includes(level.value)}
                              onCheckedChange={() => {
                                const current = formData.targetLevels;
                                if (current.includes(level.value)) {
                                  setValue('targetLevels', current.filter(l => l !== level.value));
                                } else {
                                  setValue('targetLevels', [...current, level.value]);
                                }
                              }}
                            />
                            <div className="flex-1">
                              <div className="font-medium">{level.label}</div>
                              <div className="text-sm text-muted-foreground">{level.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {errors.targetLevels && (
                        <p className="text-sm text-destructive">{errors.targetLevels.message}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 2: Message Template */}
            {currentStep === 'template' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Message Template
                    </CardTitle>
                    <CardDescription>
                      Draft a template that supporters will send to their representatives
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="templateSubject">Message Subject *</Label>
                      <Input
                        id="templateSubject"
                        placeholder="e.g., Support for Local Park Protection"
                        {...register('templateSubject')}
                      />
                      {errors.templateSubject && (
                        <p className="text-sm text-destructive">{errors.templateSubject.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="templateBody">Message Body *</Label>
                      <Textarea
                        id="templateBody"
                        placeholder="Write your message template. Use placeholders like [NAME], [LOCATION], etc."
                        rows={12}
                        {...register('templateBody')}
                      />
                      <div className="text-xs text-muted-foreground mt-2">
                        Available placeholders: [NAME] (your name), [LOCATION] (city/ZIP), [CAMPAIGN_TITLE]
                      </div>
                      {errors.templateBody && (
                        <p className="text-sm text-destructive">{errors.templateBody.message}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Cashu Stake (Optional) */}
            {currentStep === 'stake' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Anti-Spam Stake (Optional)
                    </CardTitle>
                    <CardDescription>
                      Help prevent spam by placing a small refundable stake
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex items-center space-x-4 p-4 rounded-lg border">
                      <Checkbox
                        id="stake"
                        checked={stakeEnabled}
                        onCheckedChange={(checked) => setStakeEnabled(checked === true)}
                      />
                      <div className="flex-1">
                        <Label htmlFor="stake" className="font-medium cursor-pointer">
                          Place a spam-prevention stake
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Stake {DEFAULT_CASHU_STAKE_CONFIG.amount} sats (~$0.03) to create this campaign
                        </p>
                      </div>
                    </div>

                    {stakeEnabled && (
                      <div className="p-4 rounded-lg bg-muted space-y-3">
                        <h4 className="font-medium">Stake Details</h4>
                        <ul className="text-sm space-y-2 text-muted-foreground">
                          <li>• Stake amount: {DEFAULT_CASHU_STAKE_CONFIG.amount} sats</li>
                          <li>• Refund delay: 24 hours</li>
                          <li>• Refunded if no abuse is reported</li>
                          <li>• Forfeited if spam/abuse is detected</li>
                        </ul>
                        <div className="pt-2">
                          <Button variant="outline" className="w-full" disabled>
                            <DollarSign className="w-4 h-4 mr-2" />
                            Connect Cashu Wallet (Coming Soon)
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 4: Review */}
            {currentStep === 'review' && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      Review & Publish
                    </CardTitle>
                    <CardDescription>
                      Review your campaign before publishing to Nostr
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4 p-4 rounded-lg border">
                      <div>
                        <div className="text-sm text-muted-foreground">Title</div>
                        <div className="font-medium">{formData.title}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Pitch</div>
                        <div>{formData.pitch}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Category</div>
                        <div className="capitalize">{formData.category?.replace('_', ' ')}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Target Levels</div>
                        <div className="flex gap-2 flex-wrap">
                          {formData.targetLevels.map((level) => (
                            <span key={level} className="capitalize badge">
                              {level}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Stake</div>
                        <div>{stakeEnabled ? 'Yes' : 'No'}</div>
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      By publishing this campaign, you agree that:
                    </div>
                    <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                      <li>This campaign follows our community guidelines</li>
                      <li>You're the creator or authorized representative</li>
                      <li>The information provided is accurate</li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={goToPreviousStep}
                disabled={currentStep === 'details'}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              
              {currentStep === 'review' ? (
                <Button
                  type="submit"
                  disabled={isPublishingCampaign}
                >
                  {isPublishingCampaign ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      Publish Campaign
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button type="button" onClick={goToNextStep}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}