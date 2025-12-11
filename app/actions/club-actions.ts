'use server'

import { createClient } from "@/lib/supabase/server";

export type ImportResult = {
    success: number;
    errors: string[];
};

export async function importStudentsAction(clubId: string, students: any[]): Promise<ImportResult> {
    const supabase = await createClient();
    const errors: string[] = [];
    let successCount = 0;

    // 1. Verificació de seguretat (Ets admin d'aquest club?)
    // (Aquí hauries de fer una query per comprovar que l'usuari actual és owner/admin del clubId)

    for (const row of students) {
        const { nom, cognom, email, grup, email_pare } = row;

        if (!nom || !grup) {
            errors.push(`Fila ignorada: Manca nom o grup.`);
            continue;
        }

        try {
            // A. Gestionar el Grup (Classe)
            // Busquem si existeix el grup per nom dins d'aquest club
            let groupId;
            const { data: existingGroup } = await supabase
                .from('club_groups') // Assumint que tens aquesta taula
                .select('id')
                .eq('club_id', clubId)
                .eq('name', grup)
                .single();

            if (existingGroup) {
                groupId = existingGroup.id;
            } else {
                // Si no existeix, el creem al moment!
                const { data: newGroup, error: groupError } = await supabase
                    .from('club_groups')
                    .insert({ club_id: clubId, name: grup })
                    .select()
                    .single();

                if (groupError) throw new Error(`Error creant grup ${grup}`);
                groupId = newGroup.id;
            }

            // B. Gestionar l'Usuari (Simplificat)
            // En un cas real, aquí faries un 'inviteUserByEmail' de Supabase Auth Admin.
            // Per ara, crearem una entrada a la taula de membres directament.

            // Busquem si l'usuari ja existeix a la plataforma pel seu email (si en té)
            const userId = null;
            if (email) {
                // Lògica per buscar userId per email...
                // Si no trobem userId, potser creem un "Shadow User" o placeholder
            }

            // C. Inserir a la taula de membres del club
            const { error: memberError } = await supabase
                .from('club_members')
                .insert({
                    club_id: clubId,
                    user_id: userId, // Pot ser null si és un alumne sense compte encara (només fitxa)
                    group_id: groupId,
                    first_name: nom, // Guardem les dades 'raw' si no tenen usuari real
                    last_name: cognom,
                    parent_email: email_pare,
                    role: 'student',
                    status: 'active'
                });

            if (memberError) throw memberError;

            successCount++;

        } catch (err: any) {
            console.error(err);
            errors.push(`Error amb l'alumne ${nom} ${cognom}: ${err.message}`);
        }
    }

    return { success: successCount, errors };
}
