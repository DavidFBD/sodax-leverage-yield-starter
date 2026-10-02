import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Hero } from '@/components/layout/Hero';
import { MotionProvider } from '@/components/ui/motion';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LeverageYieldPage } from '@/features/leverage-yield/LeverageYieldPage';

export function App() {
  return (
    <MotionProvider>
      <TooltipProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            <Hero />
            <div className="mx-auto max-w-page px-4 py-14 sm:px-6">
              <LeverageYieldPage />
            </div>
          </main>
          <Footer />
        </div>
      </TooltipProvider>
    </MotionProvider>
  );
}
