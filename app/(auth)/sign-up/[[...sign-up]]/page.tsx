"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSignUp, useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { MapPinned } from "lucide-react";

interface WindowWithClerk {
  Clerk?: {
    captcha?: { isSolved: () => boolean }
  }
}

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp, isLoaded, setActive } = useSignUp();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isSignedIn } = useAuth();
  const router = useRouter();

  // Redirect already signed-in users away from sign-up page
  useEffect(() => {
    if (isSignedIn && isUserLoaded && user) {
      const onboardingComplete = user.publicMetadata?.onboardingComplete as boolean | undefined;
      const organizationId = user.publicMetadata?.organizationId as string | undefined;
      const userId = user.id;
      if (onboardingComplete && organizationId && userId) {
        router.replace(`/${organizationId}/dashboard/${userId}`);
      } else {
        router.replace('/onboarding');
      }
    }
  }, [isSignedIn, isUserLoaded, user, router]);

  if (isSignedIn && isUserLoaded && user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 text-center">
          <span className="text-white">Redirecting...</span>
        </div>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    if (!isLoaded) return;
    
    // Enforce Clerk CAPTCHA if present
    const captcha = (window as WindowWithClerk).Clerk?.captcha;
    if (captcha && !captcha.isSolved()) {
      setError("Please complete the CAPTCHA challenge.");
      setLoading(false);
      return;
    }

    try {
      const res = await signUp.create({
        emailAddress: email,
        password,
        firstName: name.split(" ")[0] || name,
        lastName: name.split(" ").slice(1).join(" ") || undefined,
      });

      // Handle verification if needed
      if (res.status === "complete") {
        await setActive({ session: res.createdSessionId });
        router.replace("/onboarding");
        return;
      } else {
        // Handle email verification flow
        router.replace("/verify-email");
        return;
      }
    } catch (err: any) {
      console.error("Sign up error:", err);
      if (err?.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const clerkError = err.errors[0];
        switch(clerkError.code) {
          case "form_password_pwned":
            setError("This password is too common. Please choose a stronger password.");
            break;
          case "form_password_length":
            setError("Password is too short. Minimum 8 characters required.");
            break;
          case "form_identifier_exists":
            setError("An account with this email already exists. Please sign in.");
            break;
          case "form_password_validation":
            setError("Password must contain at least 8 characters with letters and numbers.");
            break;
          default:
            setError(clerkError.message || "Sign up failed. Please try again.");
        }
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError("Sign up failed. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="flex flex-1 items-center">
            <Link 
              className="flex items-center justify-center hover:text-blue-500 hover:underline underline-offset-4" 
              href="/"
            >
              <MapPinned className="h-6 w-6 text-blue-500 mr-1" />
              <span className="font-extrabold text-white dark:text-white text-2xl">FleetFusion</span>
            </Link>
          </div> 
          <h1 className="mt-2 text-3xl font-extrabold text-white">
            CREATE YOUR ACCOUNT
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-blue-500 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="mt-8 bg-neutral-900 p-6 shadow-lg rounded-lg border border-neutral-800 flex flex-col gap-4"
        >
          <label className="text-gray-200 text-sm font-medium" htmlFor="name">
            Full Name
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            required
            className="rounded-md border border-neutral-700 bg-black text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          
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
            autoComplete="new-password"
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
            className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}