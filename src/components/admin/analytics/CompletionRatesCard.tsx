import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

type CompletionRatesCardProps = {
  onboardingCompletion: number;
  activationRate: number;
  feedbackCount: number;
  title?: string;
};

export function CompletionRatesCard({
  onboardingCompletion,
  activationRate,
  feedbackCount,
  title = 'Completion Rates',
}: CompletionRatesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Onboarding Completion */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Onboarding Completion
            </span>
            <span className="text-lg font-semibold">
              {onboardingCompletion}
              %
            </span>
          </div>
          <Progress value={onboardingCompletion} className="h-2" />
        </div>

        {/* Activation Rate */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Activation Rate
            </span>
            <span className="text-lg font-semibold">
              {activationRate}
              %
            </span>
          </div>
          <Progress value={activationRate} className="h-2" />
        </div>

        {/* Feedback Count */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Feedback Submitted
            </span>
            <span className="text-lg font-semibold">
              {feedbackCount}
              {' '}
              total
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
