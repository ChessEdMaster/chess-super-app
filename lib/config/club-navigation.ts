import {
    Trophy,
    Users,
    Settings,
    LayoutDashboard,
    GraduationCap,
    LineChart,
    Mail,
    CreditCard,
    FileText,
    Swords
} from 'lucide-react';
import { ClubType } from '@/types/club';

type NavItem = {
    label: string;
    href: (clubId: string) => string;
    icon: any;
};

const BASE_ITEMS: NavItem[] = [
    {
        label: 'Configuració',
        href: (id) => `/clubs/manage/${id}/settings`,
        icon: Settings
    }
];

export const CLUB_NAVIGATION: Record<ClubType, NavItem[]> = {
    online: [
        { label: 'Resum', href: (id) => `/clubs/manage/${id}`, icon: LayoutDashboard },
        { label: 'Torneigs', href: (id) => `/clubs/manage/${id}/tournaments`, icon: Trophy },
        { label: 'Arena', href: (id) => `/clubs/manage/${id}/matches`, icon: Swords },
        { label: 'Membres', href: (id) => `/clubs/manage/${id}/members`, icon: Users },
        ...BASE_ITEMS
    ],
    school: [
        { label: 'Aula Virtual', href: (id) => `/clubs/manage/${id}`, icon: LayoutDashboard }, // School Dashboard
        { label: 'Alumnes', href: (id) => `/clubs/manage/${id}/members`, icon: GraduationCap }, // Reutilitzem members però li diem Alumnes
        { label: 'Grups/Classes', href: (id) => `/clubs/manage/${id}/groups`, icon: Users },
        { label: 'Progrés', href: (id) => `/clubs/manage/${id}/progress`, icon: LineChart }, // Nou
        { label: 'Comunicats', href: (id) => `/clubs/manage/${id}/communications`, icon: Mail }, // Nou
        ...BASE_ITEMS
    ],
    physical_club: [
        { label: 'Administració', href: (id) => `/clubs/manage/${id}`, icon: LayoutDashboard },
        { label: 'Socis', href: (id) => `/clubs/manage/${id}/members`, icon: Users },
        { label: 'Quotes', href: (id) => `/clubs/manage/${id}/plans`, icon: CreditCard },
        { label: 'Federació', href: (id) => `/clubs/manage/${id}/federation`, icon: FileText },
        ...BASE_ITEMS
    ]
};
