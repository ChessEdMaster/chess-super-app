import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, School, Users, Settings, Briefcase, GraduationCap } from "lucide-react";
import Link from "next/link";
import { CreateSubClubModal } from "@/components/business/create-sub-club-modal";
import { StudentManager } from "@/components/business/student-manager";
import { Panel } from "@/components/ui/design-system/Panel";
import { GameCard } from "@/components/ui/design-system/GameCard";
import { ShinyButton } from "@/components/ui/design-system/ShinyButton";

async function getClub(clubId: string) {
    const supabase = await createClient();
    const { data: club } = await supabase.from("clubs").select("*").eq("id", clubId).single();
    return club;
}

async function getChildClubs(clubId: string) {
    const supabase = await createClient();
    const { data: children } = await supabase
        .from("clubs")
        .select("*, club_members(count)")
        .eq("parent_id", clubId)
        .order("created_at", { ascending: false });
    return children || [];
}

export default async function BusinessManagePage({ params }: { params: Promise<{ clubId: string }> }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");

    const { clubId } = await params;
    const club = await getClub(clubId);
    if (!club) notFound();

    // Security check: Must be owner or have valid RLS access
    if (club.owner_id !== user.id) {
        if (club.parent_id) {
            const parent = await supabase.from("clubs").select("owner_id").eq("id", club.parent_id).single();
            if (parent.data?.owner_id !== user.id) {
                // Optionally redirect or show unauthorized
                // redirect("/business/dashboard"); 
            }
        } else {
            // redirect("/business/dashboard");
        }
    }

    const isOrganization = club.type === 'organization';
    const children = isOrganization ? await getChildClubs(club.id) : [];

    return (
        <div className="container mx-auto py-8 px-4 font-sans">
            {/* Header Section */}
            <div className="mb-8">
                <Link href={club.parent_id ? `/business/manage/${club.parent_id}` : "/business/dashboard"} className="inline-block mb-4">
                    <span className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider">
                        <ArrowLeft size={16} />
                        Back to {club.parent_id ? "Parent Organization" : "Dashboard"}
                    </span>
                </Link>

                <Panel className="p-8 relative overflow-hidden border-indigo-500/20">
                    <div className="absolute top-0 right-0 p-32 bg-indigo-600/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${isOrganization ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    }`}>
                                    {club.type}
                                </span>
                                {club.parent_id && <span className="text-zinc-500 text-[10px] font-bold uppercase">Sub-Club</span>}
                            </div>
                            <h1 className="text-4xl font-black text-white uppercase tracking-wide font-display text-stroke mb-2">
                                {club.name}
                            </h1>
                            <p className="text-zinc-400 font-medium max-w-2xl">{club.description || "Manage your club details here."}</p>
                        </div>

                        <div className="flex gap-3">
                            <ShinyButton variant="neutral" className="px-4 py-2">
                                <Settings size={18} className="mr-2" /> Settings
                            </ShinyButton>
                        </div>
                    </div>
                </Panel>
            </div>

            {isOrganization ? (
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-2 px-2">
                        <h2 className="text-xl font-black text-zinc-300 uppercase tracking-wide flex items-center gap-2">
                            <School className="text-amber-500" size={24} /> Schools & Clubs
                        </h2>
                        <CreateSubClubModal ownerId={user.id} parentId={club.id} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {children.map((child) => (
                            <Link href={`/business/manage/${child.id}`} key={child.id}>
                                <GameCard variant="default" className="h-full hover:bg-zinc-800 transition-all duration-300 cursor-pointer border-zinc-700 hover:border-indigo-500/50 group">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 group-hover:border-indigo-500/30 transition-colors">
                                            <GraduationCap size={24} className="text-indigo-400" />
                                        </div>
                                        <Users size={16} className="text-emerald-500" />
                                    </div>

                                    <h3 className="text-lg font-black text-white uppercase tracking-wide mb-2 group-hover:text-indigo-400 transition-colors">
                                        {child.name}
                                    </h3>

                                    <p className="text-zinc-500 text-xs font-bold leading-relaxed mb-4 line-clamp-2">
                                        {child.description || "No description"}
                                    </p>

                                    <div className="mt-auto flex items-center gap-2">
                                        <span className="text-[9px] font-black uppercase tracking-widest bg-zinc-900 text-zinc-400 px-2 py-1 rounded border border-zinc-800">
                                            {child.type}
                                        </span>
                                    </div>
                                </GameCard>
                            </Link>
                        ))}

                        {children.length === 0 && (
                            <Panel className="col-span-full py-12 flex flex-col items-center justify-center text-center opacity-70 border-dashed">
                                <p className="text-zinc-500 font-bold mb-4">No schools or clubs in this organization yet.</p>
                                <CreateSubClubModal ownerId={user.id} parentId={club.id} />
                            </Panel>
                        )}
                    </div>
                </div>
            ) : (
                /* LEAF NODE: SCHOOL/CLUB -> MANAGE STUDENTS */
                <div className="space-y-6">
                    <Panel className="p-6">
                        <div className="flex items-center gap-3 mb-6 border-b border-zinc-800 pb-4">
                            <Users className="text-blue-400" size={24} />
                            <h2 className="text-xl font-black text-white uppercase tracking-wide font-display">Student Management</h2>
                        </div>
                        <StudentManager clubId={club.id} />
                    </Panel>
                </div>
            )}
        </div>
    );
}
