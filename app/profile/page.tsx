'use client';

import { UserProfile } from '@/components/profile/user-profile';

export default function ProfilePage() {
  return (
    <div className="h-full w-full bg-zinc-950 overflow-y-auto">
      <UserProfile />
    </div>
  );
}
