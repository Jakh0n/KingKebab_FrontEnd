"use client";

import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, logout } from "@/lib/api";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { toast } from "sonner";

const MIN_ATTEMPT_INTERVAL_MS = 2000;

interface JwtPayload {
  exp?: number;
  isAdmin?: boolean;
}

function decodeToken(token: string): JwtPayload {
  return JSON.parse(atob(token.split(".")[1]));
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    logout();

    try {
      if (!username || !password) {
        throw new Error("Username and password are required");
      }

      const lastAttempt = localStorage.getItem("lastLoginAttempt");
      if (lastAttempt) {
        const diff = Date.now() - parseInt(lastAttempt, 10);
        if (diff < MIN_ATTEMPT_INTERVAL_MS) {
          throw new Error("Please wait before trying again");
        }
      }
      localStorage.setItem("lastLoginAttempt", Date.now().toString());

      const response = await login(username, password);
      if (!response?.token) {
        throw new Error("Invalid response from server");
      }

      const payload = decodeToken(response.token);
      if (!payload.exp || Date.now() >= payload.exp * 1000) {
        throw new Error("Token has expired");
      }

      localStorage.setItem("token", response.token);
      localStorage.setItem("position", response.position);

      toast.success("Welcome back", {
        description: `Signed in as ${username}`,
      });

      router.push(payload.isAdmin ? "/admin" : "/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      toast.error("Sign in failed", { description: message });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue to King Kebab."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:underline"
          >
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            autoComplete="username"
            placeholder="Your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              Forgot?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
          />
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="w-full rounded-full"
          size="lg"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
