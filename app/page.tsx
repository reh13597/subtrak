"use client";

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <main>
      <h1>Subscription Tracker</h1>
      <button onClick={() => router.push("/login")}>Get Started</button>
    </main>
  );
}