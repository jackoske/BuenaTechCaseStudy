"use client";

import { useActionState } from "react";
import { login } from "./actions";
import Image from "next/image";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <Image src="/icon.png" alt="Buena" width={48} height={48} className="rounded-lg" />
          <div className="text-center">
            <h1 className="text-xl font-semibold text-foreground">Buena Property</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your password to continue</p>
          </div>
        </div>

        {/* Form */}
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <input
              type="password"
              name="password"
              placeholder="Password"
              autoFocus
              required
              className="w-full px-3 py-2 rounded-md border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {state?.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full py-2 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
