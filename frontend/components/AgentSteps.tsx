import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { memo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { ProcessingStep } from '@/types/topicSession';

interface AgentStepsProps {
  steps: ProcessingStep[];
  currentStep: string | null;
  isProcessing: boolean;
}

function getTitle(currentStep: string | null, isProcessing: boolean) {
  if (!isProcessing) {
    return 'Assistant Steps';
  }

  if (currentStep) {
    return currentStep;
  }

  return 'Processing...';
}

function AgentSteps({ steps, currentStep, isProcessing }: AgentStepsProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (steps.length === 0 && !currentStep && !isProcessing) {
    return null;
  }

  if (steps.length === 0 && isProcessing) {
    return (
      <Card className="mb-4">
        <CardContent className="flex items-center gap-2 p-4">
          <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
          <span className="text-sm font-medium bg-linear-to-r from-primary via-#9fffff-500 to-primary bg-clip-text text-transparent animate-pulse">
            Processing...
          </span>
        </CardContent>
      </Card>
    );
  }

  const allStepsCompleted = steps.every((step) => step.status === 'completed');
  const title = getTitle(currentStep, isProcessing);
  const allCompleted = !isProcessing && allStepsCompleted;

  return (
    <Card className="mb-5 rounded-md">
      <CardContent className="p-2">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full text-left group cursor-pointer">
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
            <span
              className={`text-sm font-medium transition-colors ${
                isProcessing
                  ? 'bg-linear-to-r from-primary via-#9fffff-500 to-primary bg-clip-text text-transparent animate-pulse'
                  : 'text-muted-foreground group-hover:text-foreground'
              }`}
            >
              {title}
            </span>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <ul className="space-y-1.5 ml-6">
              {steps.map((step, index) => (
                <li key={`${step.description}-${index}`} className="flex items-start gap-2 text-sm">
                  {step.status === 'in_progress' ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary mt-0.5 shrink-0" />
                  ) : (
                    <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  )}
                  <span className={step.status === 'completed' ? 'text-muted-foreground' : ''}>{step.description}</span>
                </li>
              ))}
              {allCompleted && (
                <li className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                  <span className="text-muted-foreground">Done</span>
                </li>
              )}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

export default memo(AgentSteps);
