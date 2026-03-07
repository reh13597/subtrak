"use client";

import { useState } from "react";
import { signUp, confirmSignUp, signIn } from "aws-amplify/auth";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup" | "confirm">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async () => {
    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            given_name: firstName,
            family_name: lastName,
          }
        }
      });
      setMode("confirm"); // Cognito sends a verification email
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleConfirm = async () => {
    try {
      await confirmSignUp({ username: email, confirmationCode });

      // After confirming, sign them in to get their Cognito ID
      const result = await signIn({ username: email, password });

      // Now insert into your DB
      await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, firstName, lastName }),
      });

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogin = async () => {
    try {
      await signIn({ username: email, password });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (mode === "confirm") {
    return (
      <main>
        <h1>Check your email</h1>
        <p>Enter the confirmation code sent to {email}</p>
        <input placeholder="Confirmation code" onChange={e => setConfirmationCode(e.target.value)} />
        <button onClick={handleConfirm}>Confirm</button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </main>
    );
  }

  return (
    <main>
      <h1>{mode === "login" ? "Login" : "Sign Up"}</h1>

      {mode === "signup" && (
        <>
          <input placeholder="First name" onChange={e => setFirstName(e.target.value)} />
          <input placeholder="Last name" onChange={e => setLastName(e.target.value)} />
        </>
      )}
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input placeholder="Password" type="password" onChange={e => setPassword(e.target.value)} />

      {error && <p style={{ color: "red" }}>{error}</p>}

      {mode === "login" ? (
        <>
          <button onClick={handleLogin}>Login</button>
          <p>No account? <span onClick={() => setMode("signup")} style={{ cursor: "pointer", color: "blue" }}>Sign up</span></p>
        </>
      ) : (
        <>
          <button onClick={handleSignup}>Sign Up</button>
          <p>Have an account? <span onClick={() => setMode("login")} style={{ cursor: "pointer", color: "blue" }}>Login</span></p>
        </>
      )}
    </main>
  );
}