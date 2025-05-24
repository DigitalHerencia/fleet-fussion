"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useSignIn } from "@clerk/nextjs";

// Add this at the top of the file, before any usage of window.Clerk
declare global {
  interface Window {
    Clerk?: {
      captcha?: {
        isSolved: () => boolean;
      };
    };
  }
}

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, isLoaded } = useSignIn();
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!isLoaded) return;
    
    // Enforce Clerk CAPTCHA if present
    const captcha = window.Clerk?.captcha;
    if (captcha && !captcha.isSolved()) {
      setError("Please complete the CAPTCHA challenge.");
      setLoading(false);
      return;
    }

    try {
      const res = await signIn.create({ identifier: email, password });
      
      if (res.status !== "complete") {
        // If 2FA or other verification is required, handle it
        const firstFactor = res.firstFactorVerification;
        if (firstFactor.status === "failed") {
          setError(firstFactor.error?.message || "Sign in verification failed.");
        } else {
          setError("Sign in failed. Please check your credentials.");
        }      } else {
        // Sign in successful - let middleware handle redirects based on user state
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      // Properly handle Clerk error objects
      console.error("Sign in error:", err);

      if (err?.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const clerkError = err.errors[0];

        switch(clerkError.code) {
          case "form_password_incorrect":
            setError("Incorrect password. Try again or reset your password.");
            break;
          case "form_identifier_not_found":
            setError("No account found with that email.");
            break;
          case "form_identifier_not_verified":
            setError("Please verify your email before signing in.");
            break;
          case "session_exists":
            setError("You are already signed in.");
            window.location.href = "/dashboard";
            return;
          default:
            setError(clerkError.message || "Sign in failed.");
        }
      } else if (typeof err === "string") {
        setError(err);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred during sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <Link href="/" className="flex items-center space-x-2 mb-2">
            <Image
              src="/white_logo.png"
              alt="FleetFusion Logo"
              width={220}
              height={60}
              priority
            />
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold text-white">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Or{" "}
            <Link
              href="/sign-up"
              className="font-medium text-blue-400 hover:underline"
            >
              create a new account
            </Link>
          </p>
          <p className="mt-2 text-sm text-gray-400">
            Forgot your password?{" "}
            <Link
              href="/forgot-password"
              className="font-medium text-blue-400 hover:underline"
            >
              Reset it here
            </Link>
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="mt-8 bg-neutral-900 p-6 shadow-lg rounded-lg border border-neutral-800 flex flex-col gap-4"
        >
          <label className="text-gray-200 text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className="rounded-md border border-neutral-700 bg-black text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          
          <label className="text-gray-200 text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            className="rounded-md border border-neutral-700 bg-black text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="text-sm text-red-500 mt-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !isLoaded}
            className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}