import { SiteHeader } from "@/components/site-header"
import Link from "next/link"
import { Users, Shield, Lock, LayoutDashboard } from "lucide-react"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-col min-h-screen bg-zinc-950 font-sans">
            <SiteHeader />
            <div className="flex-1 container mx-auto py-8 px-4">
                <div className="mb-8 p-1 bg-zinc-900/50 rounded-xl border border-zinc-800 flex overflow-x-auto">
                    <AdminNavLink href="/admin" icon={LayoutDashboard} exact>Dashboard</AdminNavLink>
                    <div className="w-px bg-zinc-800 mx-1"></div>
                    <AdminNavLink href="/admin/users" icon={Users}>Usuaris</AdminNavLink>
                    <AdminNavLink href="/admin/roles" icon={Shield}>Rols</AdminNavLink>
                    <AdminNavLink href="/admin/permissions" icon={Lock}>Permisos</AdminNavLink>
                </div>
                {children}
            </div>
        </div>
    )
}

function AdminNavLink({ href, children, icon: Icon, exact }: { href: string; children: React.ReactNode, icon: any, exact?: boolean }) {
    // Note: In a layout server component we can't easily get active state without client hook. 
    // For now we'll use a generic style. If active state is needed, this needs to be a client component.
    // Given the previous code didn't use "use client", we'll keep it server but style it nicely.

    return (
        <Link
            href={href}
            className="flex-1 min-w-[120px] px-4 py-3 flex items-center justify-center gap-2 text-sm font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all group"
        >
            <Icon size={16} className="group-hover:text-indigo-400 transition-colors" />
            {children}
        </Link>
    )
}
