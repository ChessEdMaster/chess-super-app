import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SchoolDashboard } from "@/components/clubs/dashboard/SchoolDashboard";
import { ClubDashboard } from "@/components/clubs/dashboard/ClubDashboard";
import { OnlineDashboard } from "@/components/clubs/dashboard/OnlineDashboard";
import { ClubType } from "@/types/club";

export default async function ClubManagePage({
    params,
}: {
    params: { clubId: string };
}) {
    const supabase = await createClient();
    const { clubId } = await params;

    // 1. Obtenir el tipus de club
    const { data: club, error } = await supabase
        .from("clubs")
        .select("type, name")
        .eq("id", clubId)
        .single();

    if (error || !club) {
        redirect("/clubs"); // O pàgina d'error 404
    }

    const type = (club.type as ClubType) || 'online';

    // 2. Renderitzar el dashboard correcte
    switch (type) {
        case 'school':
            return <SchoolDashboard clubId={clubId} />;
        case 'physical_club':
            return <ClubDashboard clubId={clubId} />;
        case 'online':
        default:
            return <OnlineDashboard clubId={clubId} />;
    }
}

