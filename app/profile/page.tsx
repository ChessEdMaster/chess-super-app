'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/social?tab=profile');
  }, [router]);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-500">
      <Loader2 className="animate-spin mr-2" /> Redirecting...
    </div>
  );
}
