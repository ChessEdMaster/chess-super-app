import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { Plus, Users, School, Building2 } from "lucide-react";
import Link from "next/link";
import { CreateSubClubModal } from "@/components/business/create-sub-club-modal";

export default async function BusinessDashboardPage() {
    const supabase = await createClient(); // Should await in Next 15 with server utils typically
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch only "organization" or top-level clubs owned by user
    // For now, we fetch ALL owned clubs to let them choose which one is the "HQ"
    const { data: clubs } = await supabase
        .from("clubs")
        .select("*, club_members(count)")
        .eq("owner_id", user.id)
        .is("parent_id", null) // Only show top-level clubs here
        .order("created_at", { ascending: false });

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent">
                        My Education Business
                    </h1>
                    <p className="text-slate-400 mt-2">Manage your chess schools, clubs, and students.</p>
                </div>
                <CreateSubClubModal ownerId={user.id} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs?.map((club) => (
                    <Link href={`/business/manage/${club.id}`} key={club.id}>
                        <Card className="hover:bg-slate-800/50 transition-colors cursor-pointer border-slate-700 bg-slate-900/50 backdrop-blur">
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-xl font-bold text-white">{club.name}</CardTitle>
                                <School className="h-5 w-5 text-amber-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-slate-400 mb-4">{club.description || "No description"}</div>

                                <div className="flex justify-between items-center mt-4">
                                    <div className="flex items-center text-sm text-slate-300">
                                        <Users className="mr-2 h-4 w-4 text-emerald-400" />
                                        {club.member_count || 0} Members
                                    </div>
                                    <div className="text-xs px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-300 capitalize">
                                        {club.type || "Club"}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {(!clubs || clubs.length === 0) && (
                    <div className="col-span-full text-center py-12 border-2 border-dashed border-slate-700 rounded-lg">
                        <h3 className="text-lg font-medium text-slate-300">No organizations found</h3>
                        <p className="text-slate-500 mb-4">Start by creating your first Chess School or Club.</p>
                        <CreateSubClubModal ownerId={user.id} />
                    </div>
                )}
            </div>
        </div>
    );
}
