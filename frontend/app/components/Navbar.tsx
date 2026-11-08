'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function Navbar() {
  const { address, isConnected } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();

  return (
    <header className="flex justify-between items-center mb-8 pb-4 border-b border-[var(--border)]">
      <div>
        <h1 className="text-3xl font-bold">MezoYield Navigator</h1>
        <p className="text-[var(--fg-muted)]">Automated MUSD yield on Mezo</p>
      </div>

      <div>
        {isConnected ? (
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-[var(--bg)] border border-[var(--border)]">
              {address?.slice(0, 6)}…{address?.slice(-4)}
            </span>
            <button
              onClick={() => disconnect()}
              className="btn btn-secondary text-xs"
              style={{ width: 'auto', padding: '0.5rem 1rem' }}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            {connectors.map((connector) => (
              <button
                key={connector.uid}
                onClick={() => connect({ connector })}
                className="btn btn-primary text-xs"
                style={{ width: 'auto', padding: '0.5rem 1rem' }}
              >
                Connect {connector.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}