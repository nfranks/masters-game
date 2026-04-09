import { Header } from '@/components/shared/header';
import { ScoringRulesPage } from '@/components/shared/scoring-rules';

export default function ScoringPage() {
  return (
    <div className="min-h-screen bg-masters-dark">
      <Header />
      <main className="px-4 py-8">
        <ScoringRulesPage />
      </main>
    </div>
  );
}
