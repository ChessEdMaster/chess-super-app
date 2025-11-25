import { SiteHeader } from "@/components/site-header"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col min-h-screen bg-slate-950">
            <SiteHeader />
            <div className="flex-1 container mx-auto py-8 px-4">
                {children}
            </div>
        </div>
    )
}
