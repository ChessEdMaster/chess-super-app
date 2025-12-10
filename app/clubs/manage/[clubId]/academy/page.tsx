'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AcademyManager } from '@/components/clubs/academy-manager';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function ClubAcademyPage() {
    const params = useParams();
    const clubId = params.clubId as string;
    const { user } = useAuth();
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && clubId) {
            checkRole();
        }
    }, [user, clubId]);

    const checkRole = async () => {
        try {
            const { data, error } = await supabase
                .from('club_members')
                .select('role')
                .eq('club_id', clubId)
                .eq('user_id', user!.id)
                .single();

            if (data) {
                setRole(data.role);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Loader2 className="animate-spin text-yellow-500" />;
    }

    if (!role || !['owner', 'admin', 'teacher'].includes(role)) {
        return <div>No tens permisos per veure aquesta pàgina.</div>;
    }

    return <AcademyManager clubId={clubId} currentUserRole={role} />;
}
