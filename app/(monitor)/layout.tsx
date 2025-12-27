import { ReactNode } from 'react';

export default function MonitorLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col h-screen bg-[#020617]">
            <header className="h-16 border-b border-amber-500/30 flex items-center px-6 bg-slate-900/50 backdrop-blur-md">
                <h1 className="text-xl font-bold text-amber-500 tracking-wider">MONITOR CONTROL TOWER</h1>
                <nav className="ml-auto flex gap-6">
                    <a href="/monitor/dashboard" className="text-sm font-medium hover:text-amber-400 transition-colors">GRUPS</a>
                    <a href="/monitor/attendance" className="text-sm font-medium hover:text-amber-400 transition-colors">ASSISTÈNCIA</a>
                </nav>
            </header>
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
