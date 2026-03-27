"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { getCurrentUser } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { syncCurrentUserToDb } from "@/lib/sync-user";
import { authHeaders } from "@/lib/client-auth";
import { clearTokenCache } from "@/lib/client-auth";

interface UserProfile {
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
}

interface UserProfileContextValue {
  profile: UserProfile | null;
  cognitoId: string | null;
  loading: boolean;
  displayName: string;
  initials: string;
  refreshProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextValue>({
  profile: null,
  cognitoId: null,
  loading: true,
  displayName: "",
  initials: "U",
  refreshProfile: async () => {},
});

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cognitoId, setCognitoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const hasSynced = useRef(false);

  const fetchProfile = useCallback(async () => {
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/users/profile", { headers });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch {
      // silent fail
    }
  }, []);

  const init = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      const cId = currentUser.userId;
      setCognitoId(cId);

      if (!hasSynced.current) {
        const syncedId = await syncCurrentUserToDb();
        if (syncedId) {
          hasSynced.current = true;
        } else {
          console.warn("[UserProfile] User sync failed, profile fetch might fail with 401.");
        }
      }

      await fetchProfile();
    } catch {
      setCognitoId(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [fetchProfile]);

  useEffect(() => {
    init();

    const unsubscribe = Hub.listen("auth", ({ payload }) => {
      if (payload.event === "signedIn") {
        hasSynced.current = false;
        clearTokenCache();
        init();
      }
      if (payload.event === "signedOut") {
        setCognitoId(null);
        setProfile(null);
        hasSynced.current = false;
        clearTokenCache();
      }
    });

    return () => unsubscribe();
  }, [init]);

  const refreshProfile = useCallback(async () => {
    if (cognitoId) await fetchProfile();
  }, [cognitoId, fetchProfile]);

  const displayName =
    [profile?.firstName, profile?.lastName].filter(Boolean).join(" ") ||
    profile?.email?.split("@")[0] ||
    "";

  const initials =
    profile?.firstName?.[0]?.toUpperCase() ||
    profile?.email?.[0]?.toUpperCase() ||
    "U";

  return (
    <UserProfileContext.Provider
      value={{ profile, cognitoId, loading, displayName, initials, refreshProfile }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(UserProfileContext);
}
