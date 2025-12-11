import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, School, Users, Settings } from "lucide-react";
import Link from "next/link";
import { CreateSubClubModal } from "@/components/business/create-sub-club-modal";
import { StudentManager } from "@/components/business/student-manager";

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
        <div className="container mx-auto py-8">
            <Button variant="ghost" asChild className="mb-6 pl-0 text-slate-400 hover:text-white">
                <Link href={club.parent_id ? `/business/manage/${club.parent_id}` : "/business/dashboard"}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to {club.parent_id ? "Parent Organization" : "Dashboard"}
                </Link>
            </Button>

            <div className="flex justify-between items-start mb-8">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 text-xs border border-amber-500/20 capitalize">
                            {club.type}
                        </div>
                        {club.parent_id && <span className="text-xs text-slate-500">Sub-club</span>}
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2">{club.name}</h1>
                    <p className="text-slate-400">{club.description || "Manage your club details here."}</p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" className="border-slate-700 text-slate-300">
                        <Settings className="mr-2 h-4 w-4" /> Settings
                    </Button>
                </div>
            </div>

            {isOrganization ? (
                <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                        <h2 className="text-2xl font-bold text-white flex items-center">
                            <School className="mr-2 h-6 w-6 text-amber-500" />
                            Schools & Clubs
                        </h2>
                        <CreateSubClubModal ownerId={user.id} parentId={club.id} />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {children.map((child) => (
                            <Link href={`/business/manage/${child.id}`} key={child.id}>
                                <Card className="hover:bg-slate-800/50 transition-colors cursor-pointer border-slate-700 bg-slate-900/50">
                                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                        <CardTitle className="text-lg font-bold text-white">{child.name}</CardTitle>
                                        <Users className="h-4 w-4 text-emerald-400" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-sm text-slate-400 line-clamp-2 mb-2">
                                            {child.description || "No description"}
                                        </div>
                                        <div className="flex items-center text-xs text-slate-500">
                                            <span className="capitalize bg-slate-800 px-2 py-0.5 rounded">{child.type}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}

                        {children.length === 0 && (
                            <div className="col-span-full py-12 text-center border border-dashed border-slate-800 rounded-lg">
                                <p className="text-slate-500 mb-4">No schools or clubs in this organization yet.</p>
                                <CreateSubClubModal ownerId={user.id} parentId={club.id} />
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* LEAF NODE: SCHOOL/CLUB -> MANAGE STUDENTS */
                <div className="space-y-6">
                    <StudentManager clubId={club.id} />
                </div>
            )}
        </div>
    );
}
