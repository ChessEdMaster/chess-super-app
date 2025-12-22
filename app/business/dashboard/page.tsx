import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Users, School, Briefcase } from "lucide-react";
import Link from "next/link";
import { CreateSubClubModal } from "@/components/business/create-sub-club-modal";
import { Panel } from "@/components/ui/design-system/Panel";
import { GameCard } from "@/components/ui/design-system/GameCard";

export default async function BusinessDashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch only "organization" or top-level clubs owned by user
    const { data: clubs } = await supabase
        .from("clubs")
        .select("*, club_members(count)")
        .eq("owner_id", user.id)
        .is("parent_id", null) // Only show top-level clubs here
        .order("created_at", { ascending: false });

    return (
        <div className="container mx-auto py-8 px-4 h-full overflow-y-auto">
            <Panel className="mb-8 p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-amber-500/20 bg-gradient-to-r from-[var(--card-bg)] to-[var(--background)]">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center border border-amber-500/30">
                        <Briefcase size={32} className="text-amber-500" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-[var(--foreground)] uppercase tracking-wide font-display text-stroke shadow-black drop-shadow-md">
                            Business Center
                        </h1>
                        <p className="text-[var(--color-secondary)] font-bold text-sm">Manage your chess schools & organizations</p>
                    </div>
                </div>
                <CreateSubClubModal ownerId={user.id} />
            </Panel>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs?.map((club) => (
                    <Link href={`/business/manage/${club.id}`} key={club.id}>
                        <GameCard variant="default" className="h-full flex flex-col p-0 overflow-hidden group hover:scale-[1.02] transition-transform duration-300 border-[var(--border)] hover:border-amber-500/50">
                            <div className="p-6 bg-gradient-to-br from-[var(--card-bg)] to-[var(--background)] flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-black text-[var(--foreground)] uppercase tracking-wide group-hover:text-amber-400 transition-colors line-clamp-1">
                                        {club.name}
                                    </h3>
                                    <School className="text-[var(--color-secondary)] group-hover:text-amber-500 transition-colors" size={24} />
                                </div>

                                <p className="text-[var(--color-secondary)] text-sm font-medium leading-relaxed mb-6 line-clamp-2 min-h-[40px]">
                                    {club.description || "No description provided."}
                                </p>

                                <div className="flex justify-between items-center mt-auto border-t border-[var(--border)] pt-4">
                                    <div className="flex items-center gap-2">
                                        <Users className="text-emerald-500" size={16} />
                                        <span className="text-sm font-bold text-[var(--color-muted)]">
                                            {club.club_members?.[0]?.count || 0} Members
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest bg-[var(--background)] text-[var(--color-secondary)] px-2 py-1 rounded">
                                        {club.type || "Club"}
                                    </span>
                                </div>
                            </div>
                        </GameCard>
                    </Link>
                ))}

                {(!clubs || clubs.length === 0) && (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center text-center opacity-70">
                        <School size={48} className="text-zinc-600 mb-4" />
                        <h3 className="text-xl font-black text-zinc-400 uppercase tracking-wide mb-2">No organizations found</h3>
                        <p className="text-zinc-500 max-w-md mb-6 font-medium">Start by creating your first Chess School or Organization to manage your students and content.</p>
                        <CreateSubClubModal ownerId={user.id} />
                    </div>
                )}
            </div>
        </div>
    );
}
