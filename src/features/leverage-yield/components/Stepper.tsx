import { CheckIcon, XIcon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { ThinkingOrb } from '@/components/ui/thinking-orb';
import { cn } from '@/lib/utils';

export type StepStatus = 'pending' | 'active' | 'done' | 'skipped' | 'error';

export function Stepper({ steps }: { steps: { label: string; status: StepStatus; detail?: ReactNode }[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map(step => (
        <li key={step.label} className="flex items-start gap-3">
          <span
            className={cn(
              'mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border text-xs',
              step.status === 'done' && 'border-primary bg-primary text-primary-foreground',
              step.status === 'active' && 'border-primary bg-card',
              step.status === 'error' && 'border-destructive bg-destructive text-destructive-foreground',
              (step.status === 'pending' || step.status === 'skipped') && 'text-subtle-foreground',
            )}
          >
            {step.status === 'done' && <CheckIcon weight="duotone" className="size-3.5" />}
            {step.status === 'active' && <ThinkingOrb state="connecting" size={20} decorative />}
            {step.status === 'error' && <XIcon weight="duotone" className="size-3.5" />}
          </span>
          <div className="flex flex-col">
            <span
              className={cn(
                'text-sm',
                step.status === 'active' && 'font-semibold',
                (step.status === 'pending' || step.status === 'skipped') && 'text-muted-foreground',
              )}
            >
              {step.label}
              {step.status === 'skipped' && ' (not needed)'}
            </span>
            {step.detail && <span className="text-xs text-muted-foreground">{step.detail}</span>}
          </div>
        </li>
      ))}
    </ol>
  );
}
