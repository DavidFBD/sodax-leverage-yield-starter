import { Button } from '@/components/ui/button';

export function QuoteError({ message, onRetry }: { message: string; onRetry: () => unknown }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-destructive bg-destructive-muted p-3 text-sm text-foreground">
      <span>{message}</span>
      <Button size="sm" variant="outline" onClick={() => void onRetry()}>
        Retry
      </Button>
    </div>
  );
}
