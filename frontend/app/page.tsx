import { DepositCard } from './components/DepositCard';
import { StrategyAllocation } from './components/StrategyAllocation';
import { BoostPanel } from './components/BoostPanel';
import { Navbar } from './components/Navbar';

export default function Page() {
  return (
    <main className="min-h-screen p-8 max-w-5xl mx-auto">
      <Navbar />
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