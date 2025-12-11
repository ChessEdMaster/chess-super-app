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
                <div className="mb-6 border-b border-slate-800">
                    <nav className="-mb-px flex gap-6">
                        <AdminNavLink href="/admin/users">Usuaris</AdminNavLink>
                        <AdminNavLink href="/admin/roles">Rols</AdminNavLink>
                        <AdminNavLink href="/admin/permissions">Permisos</AdminNavLink>
                    </nav>
                </div>
                {children}
            </div>
        </div>
    )
}

function AdminNavLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <a
            href={href}
            className="pb-3 text-sm font-medium border-b-2 border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors aria-[current=page]:border-indigo-500 aria-[current=page]:text-indigo-400"
        >
            {children}
        </a>
    )
}
