/**
 * Create Campaign Page - Redesigned
 * 
 * Beautiful campaign creation wizard with:
 * - Animated progress steps
 * - Category card selection with icons
 * - Gradient accents
 * - Smooth transitions
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  MapPin,
  DollarSign,
  Loader2,
  AlertCircle,
  Sparkles,
  Target,
  MessageSquare,
  Mic,
  Heart,
  Scale,
  Zap,
  TrendingUp,
  Building2,
  Globe,
  Shield,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/useToast';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { CAMPAIGN_KIND } from '@/types/nostr';
import type { CampaignCategory, TargetLevel } from '@/types/nostr';
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
 * Category configuration with icons and colors
 */
const CATEGORIES: { 
  value: CampaignCategory; 
  label: string; 
  icon: any;
  color: string;
  bgGradient: string;
}[] = [
  { value: 'environment', label: 'Environment', icon: Globe, color: 'text-emerald-600', bgGradient: 'from-emerald-500 to-teal-500' },
  { value: 'healthcare', label: 'Healthcare', icon: Heart, color: 'text-rose-600', bgGradient: 'from-rose-500 to-red-500' },
  { value: 'education', label: 'Education', icon: Zap, color: 'text-blue-600', bgGradient: 'from-blue-500 to-indigo-500' },
  { value: 'civil_rights', label: 'Civil Rights', icon: Scale, color: 'text-purple-600', bgGradient: 'from-purple-500 to-violet-500' },
  { value: 'economy', label: 'Economy', icon: TrendingUp, color: 'text-amber-600', bgGradient: 'from-amber-500 to-yellow-500' },
  { value: 'immigration', label: 'Immigration', icon: Building2, color: 'text-orange-600', bgGradient: 'from-orange-500 to-amber-500' },
  { value: 'gun_control', label: 'Gun Control', icon: Shield, color: 'text-red-600', bgGradient: 'from-red-500 to-rose-500' },
  { value: 'housing', label: 'Housing', icon: Building2, color: 'text-cyan-600', bgGradient: 'from-cyan-500 to-sky-500' },
  { value: 'transportation', label: 'Transportation', icon: TrendingUp, color: 'text-indigo-600', bgGradient: 'from-indigo-500 to-blue-500' },
  { value: 'technology', label: 'Technology', icon: Sparkles, color: 'text-violet-600', bgGradient: 'from-violet-500 to-purple-500' },
  { value: 'criminal_justice', label: 'Criminal Justice', icon: Scale, color: 'text-slate-600', bgGradient: 'from-slate-500 to-gray-500' },
  { value: 'election_reform', label: 'Election Reform', icon: Mic, color: 'text-amber-600', bgGradient: 'from-amber-500 to-orange-500' },
  { value: 'government_transparency', label: 'Government', icon: Shield, color: 'text-teal-600', bgGradient: 'from-teal-500 to-cyan-500' },
  { value: 'public_safety', label: 'Public Safety', icon: Shield, color: 'text-pink-600', bgGradient: 'from-pink-500 to-rose-500' },
  { value: 'community', label: 'Community', icon: Users, color: 'text-lime-600', bgGradient: 'from-lime-500 to-green-500' },
];

/**
 * Target levels with icons
 */
const TARGET_LEVELS: { value: TargetLevel; label: string; description: string; icon: any }[] = [
  { value: 'federal', label: 'Federal', description: 'Congress, Senate, President', icon: Building2 },
  { value: 'state', label: 'State', description: 'Governor, State Legislature', icon: Target },
  { value: 'local', label: 'Local', description: 'Mayor, City Council, School Board', icon: Users },
];

/**
 * Step configuration
 */
const STEPS: { key: CreateStep; label: string; icon: any }[] = [
  { key: 'details', label: 'Details', icon: FileText },
  { key: 'template', label: 'Template', icon: MessageSquare },
  { key: 'stake', label: 'Stake', icon: DollarSign },
  { key: 'review', label: 'Review', icon: CheckCircle2 },
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
  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep);

  // Check if user is logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] opacity-20" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          <Card className="max-w-md text-center p-8 bg-white/5 backdrop-blur-xl border-white/10">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Login Required</h3>
            <p className="text-slate-400 mb-6">
              You need to log in with Nostr to create a campaign.
            </p>
            <Link to="/">
              <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-500">
                Back to Home
              </Button>
            </Link>
          </Card>
        </motion.div>
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
      const campaignId = data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Date.now().toString().slice(-6);

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

      navigate(`/campaign/${campaignId}`);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Failed to Publish',
        description: 'There was an error publishing your campaign.',
      });
    } finally {
      setIsPublishingCampaign(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Movement</h1>
              </div>
            </Link>
            <div className="text-sm text-muted-foreground">
              Create Campaign
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-100 dark:bg-slate-800">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
          initial={{ width: '25%' }}
          animate={{ width: `${(currentStepIndex + 1) * 25}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Step Indicators */}
      <div className="border-b bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
              return (
                <motion.div
                  key={step.key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center"
                >
                  <div className={`flex items-center gap-2 ${isCurrent ? 'text-blue-500' : 'text-muted-foreground'}`}>
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all
                      ${isCompleted ? 'bg-green-500 text-white' : ''}
                      ${isCurrent ? 'bg-blue-500 text-white ring-4 ring-blue-500/20' : ''}
                      ${!isCompleted && !isCurrent ? 'bg-slate-100 dark:bg-slate-800' : ''}
                    `}>
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className="hidden sm:block font-medium">{step.label}</span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-12 sm:w-24 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <AnimatePresence mode="wait">
            {/* Step 1: Campaign Details */}
            {currentStep === 'details' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Tell Us About Your Campaign</h2>
                  <p className="text-muted-foreground">Share your cause with the world</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-500" />
                      Campaign Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Campaign Title *</Label>
                      <Input
                        id="title"
                        placeholder="e.g., Save the Local Park from Development"
                        {...register('title')}
                        className="text-lg"
                      />
                      {errors.title && (
                        <p className="text-sm text-destructive">{errors.title.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="pitch">Short Pitch *</Label>
                      <Textarea
                        id="pitch"
                        placeholder="A compelling summary that captures attention (max 280 characters)"
                        maxLength={280}
                        rows={3}
                        {...register('pitch')}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{280 - formData.pitch.length} characters remaining</span>
                      </div>
                      {errors.pitch && (
                        <p className="text-sm text-destructive">{errors.pitch.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Category *</Label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-2">
                        {CATEGORIES.map((cat) => {
                          const Icon = cat.icon;
                          return (
                            <motion.button
                              key={cat.value}
                              type="button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setValue('category', cat.value)}
                              className={`
                                relative p-4 rounded-xl border-2 transition-all text-center
                                ${formData.category === cat.value 
                                  ? `border-transparent bg-gradient-to-br ${cat.bgGradient} text-white shadow-lg` 
                                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                }
                              `}
                            >
                              <Icon className={`w-6 h-6 mx-auto mb-2 ${formData.category === cat.value ? 'text-white' : cat.color}`} />
                              <span className={`text-xs font-medium ${formData.category === cat.value ? 'text-white' : ''}`}>
                                {cat.label}
                              </span>
                              {formData.category === cat.value && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white text-green-500 flex items-center justify-center shadow"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </motion.div>
                              )}
                            </motion.button>
                          );
                        })}
                      </div>
                      {errors.category && (
                        <p className="text-sm text-destructive">{errors.category.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Full Description *</Label>
                      <Textarea
                        id="description"
                        placeholder="Tell the full story. Why does this matter? What are you asking for? What actions should people take?"
                        rows={8}
                        {...register('description')}
                      />
                      {errors.description && (
                        <p className="text-sm text-destructive">{errors.description.message}</p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Target Government Levels *
                      </Label>
                      <div className="grid gap-3 mt-2">
                        {TARGET_LEVELS.map((level) => {
                          const Icon = level.icon;
                          return (
                            <motion.button
                              key={level.value}
                              type="button"
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={() => {
                                const current = formData.targetLevels;
                                if (current.includes(level.value)) {
                                  setValue('targetLevels', current.filter(l => l !== level.value));
                                } else {
                                  setValue('targetLevels', [...current, level.value]);
                                }
                              }}
                              className={`
                                flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left
                                ${formData.targetLevels.includes(level.value)
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                }
                              `}
                            >
                              <div className={`p-2 rounded-lg ${formData.targetLevels.includes(level.value) ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{level.label}</div>
                                <div className="text-sm text-muted-foreground">{level.description}</div>
                              </div>
                              <div className={`
                                w-6 h-6 rounded-full border-2 flex items-center justify-center
                                ${formData.targetLevels.includes(level.value) ? 'border-blue-500 bg-blue-500' : 'border-slate-300 dark:border-slate-600'}
                              `}>
                                {formData.targetLevels.includes(level.value) && (
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                )}
                              </div>
                            </motion.button>
                          );
                        })}
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
                key="template"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Draft Your Message Template</h2>
                  <p className="text-muted-foreground">Supporters will use this template to contact their representatives</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                      Message Template
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="templateSubject">Message Subject *</Label>
                      <Input
                        id="templateSubject"
                        placeholder="e.g., Support for Local Park Protection Act"
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
                        placeholder={`Dear Representative,

I'm writing as your constituent about [CAMPAIGN_TITLE].

[CAMPAIGN_DESCRIPTION]

I urge you to take action on this important issue by [SPECIFIC_REQUEST].

Thank you for your time and consideration.

Sincerely,
[Your Name]`}
                        rows={12}
                        {...register('templateBody')}
                        className="font-mono text-sm"
                      />
                      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm">
                        <div className="font-medium mb-2">Available Placeholders:</div>
                        <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                          <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">[CAMPAIGN_TITLE]</code>
                          <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">[CAMPAIGN_DESCRIPTION]</code>
                          <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">[SPECIFIC_REQUEST]</code>
                          <code className="bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">[YOUR_NAME]</code>
                        </div>
                      </div>
                      {errors.templateBody && (
                        <p className="text-sm text-destructive">{errors.templateBody.message}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 3: Cashu Stake */}
            {currentStep === 'stake' && (
              <motion.div
                key="stake"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">Anti-Spam Protection</h2>
                  <p className="text-muted-foreground">Help keep Movement spam-free with a small refundable stake</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-amber-500" />
                      Stake Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setStakeEnabled(!stakeEnabled)}
                      className={`
                        flex items-center gap-4 p-6 rounded-xl border-2 cursor-pointer transition-all
                        ${stakeEnabled 
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/30' 
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }
                      `}
                    >
                      <div className={`
                        w-8 h-8 rounded-full border-2 flex items-center justify-center
                        ${stakeEnabled ? 'border-amber-500 bg-amber-500' : 'border-slate-300 dark:border-slate-600'}
                      `}>
                        {stakeEnabled && <CheckCircle2 className="w-5 h-5 text-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-lg">Enable Spam Protection</div>
                        <div className="text-muted-foreground">
                          Stake {DEFAULT_CASHU_STAKE_CONFIG.amount} sats (~$0.03) to create this campaign
                        </div>
                      </div>
                      <div className="text-2xl">🔒</div>
                    </motion.div>

                    <AnimatePresence>
                      {stakeEnabled && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-6 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 space-y-4"
                        >
                          <h4 className="font-semibold">How It Works:</h4>
                          <ul className="space-y-3 text-sm">
                            <li className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-amber-600 dark:text-amber-400 font-bold">1</span>
                              </div>
                              <span>You stake {DEFAULT_CASHU_STAKE_CONFIG.amount} sats to create this campaign</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-amber-600 dark:text-amber-400 font-bold">2</span>
                              </div>
                              <span>If no abuse is reported within 24 hours, your stake is automatically refunded</span>
                            </li>
                            <li className="flex items-start gap-3">
                              <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <span className="text-amber-600 dark:text-amber-400 font-bold">3</span>
                              </div>
                              <span>Forfeited stakes support Movement's infrastructure costs</span>
                            </li>
                          </ul>
                          <div className="pt-4 border-t border-amber-200 dark:border-amber-800">
                            <Button disabled className="w-full" variant="outline">
                              <DollarSign className="w-4 h-4 mr-2" />
                              Connect Cashu Wallet (Coming Soon)
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {!stakeEnabled && (
                      <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800 text-sm text-muted-foreground">
                        💡 You can skip this step and create your campaign without a stake. 
                        Campaigns with stakes may receive more trust from supporters.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Step 4: Review */}
            {currentStep === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Review & Publish</h2>
                  <p className="text-muted-foreground">Almost done! Review your campaign details before publishing.</p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-500" />
                      Campaign Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-6">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Title</div>
                        <div className="text-xl font-semibold">{formData.title || '—'}</div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Category</div>
                        <div className="flex items-center gap-2">
                          {formData.category ? (
                            <>
                              {(() => {
                                const cat = CATEGORIES.find(c => c.value === formData.category);
                                const Icon = cat?.icon || Sparkles;
                                return (
                                  <Badge className={`bg-gradient-to-r ${cat?.bgGradient} text-white border-0`}>
                                    <Icon className="w-3 h-3 mr-1" />
                                    {cat?.label}
                                  </Badge>
                                );
                              })()}
                            </>
                          ) : (
                            '—'
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Target Levels</div>
                        <div className="flex flex-wrap gap-2">
                          {formData.targetLevels.length > 0 ? (
                            formData.targetLevels.map((level) => (
                              <Badge key={level} variant="outline" className="capitalize">
                                {level}
                              </Badge>
                            ))
                          ) : (
                            '—'
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Spam Protection</div>
                        <Badge variant={stakeEnabled ? 'default' : 'secondary'}>
                          {stakeEnabled ? 'Enabled (1000 sats)' : 'Skipped'}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-sm">
                      <div className="font-medium mb-2">By publishing this campaign, you agree that:</div>
                      <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                        <li>This campaign follows our community guidelines</li>
                        <li>You're the creator or authorized representative</li>
                        <li>The information provided is accurate</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-8 mt-8 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={goToPreviousStep}
              disabled={currentStep === 'details'}
              className="px-6"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            {currentStep === 'review' ? (
              <Button
                type="submit"
                disabled={isPublishingCampaign}
                className="px-8 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                {isPublishingCampaign ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Publish Campaign
                  </>
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={goToNextStep}
                className="px-6 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              >
                Next Step
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}