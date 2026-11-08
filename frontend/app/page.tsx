import { DepositCard } from './components/DepositCard';
import { StrategyAllocation } from './components/StrategyAllocation';
import { BoostPanel } from './components/BoostPanel';

export default function Page() {
  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">MezoYield Navigator</h1>
        <p className="text-[var(--fg-muted)]">
          Automated MUSD yield on Mezo
        </p>
      </header>
      <div className="grid md:grid-cols-2 gap-6">
        <DepositCard />
        <StrategyAllocation />
      </div>
      <div className="mt-6">
        <BoostPanel />
      </div>
    </main>
  );
}