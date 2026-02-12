'use client';

import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { Globe } from 'lucide-react';

export default function LocaleSwitcher() {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const localActive = useLocale();

    const onSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const nextLocale = e.target.value;
        startTransition(() => {
            // router.replace(`/${nextLocale}`); // This is too simple for complex routes
            // Ideally use next-intl's Link or a path rewriter.
            // For MVP foundation, we just reload to the new locale prefix.
            window.location.href = `/${nextLocale}`;
        });
    };

    return (
        <div className="flex items-center gap-2">
            <Globe size={16} className="text-zinc-500" />
            <select
                defaultValue={localActive}
                className="bg-transparent text-xs font-bold text-zinc-500 uppercase tracking-wider focus:outline-none"
                onChange={onSelectChange}
                disabled={isPending}
            >
                <option value="ca">CAT</option>
                <option value="es">ES</option>
                <option value="en">EN</option>
            </select>
        </div>
    );
}
