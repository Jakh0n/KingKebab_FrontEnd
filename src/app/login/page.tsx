"use client";

import { AuthShell } from "@/components/auth/AuthShell";
import { useTelegram } from "@/components/providers/telegram-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  attachTelegramAccount,
  linkTelegramAccount,
  login,
  loginWithTelegram,
  logout,
} from "@/lib/api";
import {
  getTelegramInitData,
  isTelegramSignedOut,
  loadTelegramSession,
  saveTelegramSession,
} from "@/lib/telegram";
import Cookies from "js-cookie";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

const MIN_ATTEMPT_INTERVAL_MS = 2000;

interface JwtPayload {
  exp?: number;
  isAdmin?: boolean;
}

function decodeToken(token: string): JwtPayload {
  return JSON.parse(atob(token.split(".")[1]));
}

function isTokenValid(token: string): boolean {
  try {
    const payload = decodeToken(token);
    return Boolean(payload.exp && Date.now() < payload.exp * 1000);
  } catch {
    return false;
  }
}

function redirectAfterAuth(token: string, router: ReturnType<typeof useRouter>) {
  const payload = decodeToken(token);
  if (!payload.exp || Date.now() >= payload.exp * 1000) {
    throw new Error("Token has expired");
  }
  router.push(payload.isAdmin ? "/admin" : "/dashboard");
}

function restoreLocalSession(token: string, position?: string) {
  localStorage.setItem("token", token);
  if (position) localStorage.setItem("position", position);
  Cookies.set("token", token, { expires: 7, sameSite: "lax" });
  saveTelegramSession(token, position);
}

function isTelegramConfigError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("invalid or expired telegram data") ||
    lower.includes("mini app bot is not configured") ||
    lower.includes("telegram mini app bot")
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { isTelegram, isReady, initData: contextInitData } = useTelegram();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTelegramChecking, setIsTelegramChecking] = useState(false);
  const [needsTelegramLink, setNeedsTelegramLink] = useState(false);

  useEffect(() => {
    if (!isReady) return;

    let cancelled = false;

    async function tryAutoEnter() {
      setIsTelegramChecking(true);
      setError("");

      try {
        // User explicitly signed out — stay on login until they sign in again
        if (await isTelegramSignedOut()) {
          const initData = contextInitData || getTelegramInitData();
          if (initData) setNeedsTelegramLink(true);
          return;
        }

        const initData = contextInitData || getTelegramInitData();

        // 1) Preferred: Telegram initData → backend issues fresh JWT
        if (initData) {
          try {
            const response = await loginWithTelegram(initData);
            if (cancelled) return;
            toast.success("Welcome back", {
              description: `Signed in as ${response.username}`,
            });
            redirectAfterAuth(response.token, router);
            return;
          } catch (err) {
            if (cancelled) return;
            const message = err instanceof Error ? err.message : "Login failed";
            if (
              message.toLowerCase().includes("not linked") ||
              message.toLowerCase().includes("telegram account is not linked")
            ) {
              setNeedsTelegramLink(true);
            } else if (!isTelegramConfigError(message)) {
              console.warn("Telegram auto-login failed:", message);
            }
          }
        }

        // 2) Fallback: restore token from Telegram CloudStorage (survives app kill)
        if (isTelegram || initData) {
          const cloudSession = await loadTelegramSession();
          if (cancelled) return;
          if (cloudSession?.token && isTokenValid(cloudSession.token)) {
            restoreLocalSession(cloudSession.token, cloudSession.position);
            // Best-effort re-link so next cold start can use initData login
            if (initData) {
              try {
                await attachTelegramAccount(initData);
              } catch {
                // ignore — session restore is enough for now
              }
            }
            toast.success("Welcome back");
            redirectAfterAuth(cloudSession.token, router);
            return;
          }
        }
      } finally {
        if (!cancelled) setIsTelegramChecking(false);
      }
    }

    void tryAutoEnter();

    return () => {
      cancelled = true;
    };
  }, [isReady, isTelegram, contextInitData, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError("");
    logout({ preserveTelegramCloud: true });

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

      const initData = contextInitData || getTelegramInitData();
      let response;
      let linked = false;

      // Always try to link when opened inside Telegram Mini App
      if (initData) {
        try {
          response = await linkTelegramAccount(initData, username, password);
          linked = true;
        } catch (linkErr) {
          const linkMessage =
            linkErr instanceof Error ? linkErr.message : "Link failed";
          if (isTelegramConfigError(linkMessage)) {
            response = await login(username, password);
            try {
              await attachTelegramAccount(initData);
              linked = true;
            } catch {
              // password login still ok
            }
          } else {
            throw linkErr;
          }
        }
      } else {
        response = await login(username, password);
      }

      if (!response?.token) {
        throw new Error("Invalid response from server");
      }

      toast.success("Welcome back", {
        description: linked
          ? `Telegram linked · signed in as ${username}`
          : `Signed in as ${username}`,
      });

      redirectAfterAuth(response.token, router);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setError(message);
      toast.error("Sign in failed", { description: message });
    } finally {
      setIsLoading(false);
    }
  }

  if (isTelegramChecking) {
    return (
      <AuthShell
        title="Opening King Kebab"
        subtitle="Signing you in with Telegram…"
      >
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Connecting…
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title={needsTelegramLink ? "Link your account" : "Welcome back"}
      subtitle={
        needsTelegramLink
          ? "Sign in once to connect this Telegram account. Next time you’ll open straight into the app."
          : isTelegram
            ? "Sign in to continue inside Telegram."
            : "Sign in to continue to King Kebab."
      }
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
              {needsTelegramLink ? "Linking…" : "Signing in…"}
            </>
          ) : needsTelegramLink ? (
            "Link & sign in"
          ) : (
            "Sign in"
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
