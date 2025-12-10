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
    Swords,
    BookOpen
} from 'lucide-react';

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

const CLUB_ITEMS: NavItem[] = [
    { label: 'Administració', href: (id) => `/clubs/manage/${id}`, icon: LayoutDashboard },
    { label: 'Socis', href: (id) => `/clubs/manage/${id}/members`, icon: Users },
    { label: 'Gestió Acadèmica', href: (id) => `/clubs/manage/${id}/academy`, icon: BookOpen },
    { label: 'Quotes', href: (id) => `/clubs/manage/${id}/plans`, icon: CreditCard },
    { label: 'Federació', href: (id) => `/clubs/manage/${id}/federation`, icon: FileText },
    ...BASE_ITEMS
];

export const CLUB_NAVIGATION: Record<string, NavItem[]> = {
    online: [
        { label: 'Resum', href: (id) => `/clubs/manage/${id}`, icon: LayoutDashboard },
        { label: 'Torneigs', href: (id) => `/clubs/manage/${id}/tournaments`, icon: Trophy },
        { label: 'Arena', href: (id) => `/clubs/manage/${id}/matches`, icon: Swords },
        { label: 'Membres', href: (id) => `/clubs/manage/${id}/members`, icon: Users },
        ...BASE_ITEMS
    ],
    school: [
        { label: 'Aula Virtual', href: (id) => `/clubs/manage/${id}`, icon: LayoutDashboard },
        { label: 'Alumnes', href: (id) => `/clubs/manage/${id}/members`, icon: GraduationCap },
        { label: 'Gestió Acadèmica', href: (id) => `/clubs/manage/${id}/academy`, icon: BookOpen },
        { label: 'Grups/Classes', href: (id) => `/clubs/manage/${id}/groups`, icon: Users },
        { label: 'Progrés', href: (id) => `/clubs/manage/${id}/progress`, icon: LineChart },
        { label: 'Comunicats', href: (id) => `/clubs/manage/${id}/communications`, icon: Mail },
        ...BASE_ITEMS
    ],
    club: CLUB_ITEMS,
    physical_club: CLUB_ITEMS // Alias for safety
};
