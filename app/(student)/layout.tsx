import { ReactNode } from 'react';
import { SiteHeader } from '@/components/site-header';

export default function StudentLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex flex-col h-screen bg-[#020617]">
            <SiteHeader />
            {/* Note: SiteHeader might need to be adapted or a simpler one used as per request */}
            <main className="flex-1 overflow-hidden">
                {children}
            </main>
        </div>
    );
}
