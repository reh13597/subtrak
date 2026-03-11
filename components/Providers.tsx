"use client";

import { UserProfileProvider } from "@/hooks/useUserProfile";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <UserProfileProvider>{children}</UserProfileProvider>;
}
