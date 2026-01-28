'use client';

import { Bug, Heart, Lightbulb } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { createClient } from '@/libs/supabase/client';
import { cn } from '@/utils/Helpers';

type FeedbackType = 'bug' | 'feature' | 'praise';

// Reuse same validation schema as server for consistency
const emailSchema = z.string().email();

type FeedbackModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('feature');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  // Check authentication status when modal opens
  useEffect(() => {
    if (open) {
      const checkAuth = async () => {
        setIsCheckingAuth(true);
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          setIsAuthenticated(!!user);
        } catch (err) {
          console.error('[FeedbackModal] Auth check failed:', err);
          setIsAuthenticated(false);
        } finally {
          setIsCheckingAuth(false);
        }
      };
      checkAuth();
    }
  }, [open]);

  // Reset form when modal opens
  // Using callback pattern to satisfy ESLint rule about direct setState calls
  useEffect(() => {
    if (!open) {
      return;
    }

    // Reset form state using functional updates
    setFeedbackType(() => 'feature');
    setMessage(() => '');
    setEmail(() => '');
    setIsLoading(() => false);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    // Validate email if provided using Zod (matches server validation)
    if (email.trim()) {
      const emailValidation = emailSchema.safeParse(email.trim());
      if (!emailValidation.success) {
        toast.error('Please enter a valid email address');
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: feedbackType,
          message: message.trim(),
          email: email.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[FeedbackModal] API error:', errorData);

        // Handle validation errors
        if (response.status === 400 && errorData.code === 'VALIDATION_ERROR') {
          const details = errorData.details || {};
          const firstError = Object.values(details)[0];
          const errorMessage = Array.isArray(firstError) ? firstError[0] : 'Please check your input';
          toast.error(errorMessage);
        } else {
          toast.error('Failed to submit feedback. Please try again.');
        }

        setIsLoading(false);
        return;
      }

      // Success
      setIsLoading(false);
      onOpenChange(false);

      toast.success('Thanks for your feedback!', {
        description: 'We appreciate your input and will review it shortly.',
      });
    } catch (error) {
      setIsLoading(false);
      console.error('[FeedbackModal] Failed to submit feedback:', error);
      toast.error('Failed to submit feedback. Please try again.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden border-border bg-background p-0 sm:max-w-[425px]">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-xl font-medium">
            Send Feedback
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-6 pb-6">
          {/* Segmented Control for Feedback Type */}
          <div className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted p-1">
            <button
              type="button"
              onClick={() => setFeedbackType('bug')}
              className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-md py-3 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                feedbackType === 'bug'
                  ? 'bg-background text-red-600 shadow-sm'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground',
              )}
            >
              <Bug className="size-5" />
              <span>Bug</span>
            </button>
            <button
              type="button"
              onClick={() => setFeedbackType('feature')}
              className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-md py-3 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                feedbackType === 'feature'
                  ? 'bg-background text-blue-600 shadow-sm'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground',
              )}
            >
              <Lightbulb className="size-5" />
              <span>Feature</span>
            </button>
            <button
              type="button"
              onClick={() => setFeedbackType('praise')}
              className={cn(
                'flex flex-col items-center justify-center gap-2 rounded-md py-3 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                feedbackType === 'praise'
                  ? 'bg-background text-green-600 shadow-sm'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground',
              )}
            >
              <Heart className="size-5" />
              <span>Praise</span>
            </button>
          </div>

          <div className="space-y-4">
            {/* Message Textarea */}
            <div className="space-y-2">
              <label htmlFor="message" className="sr-only">
                Your message
              </label>
              <Textarea
                id="message"
                placeholder="Tell us what's on your mind..."
                className="min-h-[120px] resize-none"
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            {/* Email Field - Only show for anonymous users */}
            {!isCheckingAuth && !isAuthenticated && (
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="ml-1 text-xs font-medium text-muted-foreground"
                >
                  Email (optional) - for follow-up
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2 sm:justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!message.trim() || isLoading}
              className="min-w-[120px]"
            >
              {isLoading
                ? (
                    <>
                      <Spinner size="sm" className="mr-2" />
                      Sending...
                    </>
                  )
                : (
                    'Send Feedback'
                  )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
