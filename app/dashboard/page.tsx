"use client";

import { getCurrentUser, signOut } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getCurrentUser();
        setEmail(user.signInDetails?.loginId ?? "");
      } catch {
        // No user logged in, redirect to login
        router.push("/login");
      }
    };
    checkUser();
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <main>
      <h1>Dashboard</h1>
      <p>Welcome, {email}</p>
      <button onClick={handleSignOut}>Sign Out</button>
    </main>
  );
}