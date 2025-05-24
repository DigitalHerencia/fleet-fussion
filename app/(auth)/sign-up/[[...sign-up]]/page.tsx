"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useSignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp, isLoaded } = useSignUp();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!isLoaded) return;
    // Enforce Clerk CAPTCHA if present
    const captcha = (window as Window).Clerk?.captcha;
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
      
      if (res.status === "complete") {
        // Sign up complete - user is now authenticated, redirect to onboarding
        window.location.href = "/onboarding";
      } else if (res.status === "missing_requirements") {
        // Email verification required - attempt to prepare verification
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setError("Please check your email and click the verification link to complete your account setup.");
      } else {
        // Handle other statuses - account created but needs verification
        setError("Account created but verification is required. Please check your email and follow the verification link.");
      }
    } catch (err: any) {
      // Clerk error handling
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
        setError("Sign up failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black px-4 py-12 sm:px-6 lg:px-8">
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
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-400">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-blue-400 hover:underline"
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
            className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}