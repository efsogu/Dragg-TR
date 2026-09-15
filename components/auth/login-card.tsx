"use client";

import { AuthCardHeader } from "@/components/auth/auth-card-header";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { useI18n } from "@/lib/i18n";

export function LoginCard() {
  const { t } = useI18n();

  return (
    <section className="w-full max-w-md rounded-lg border border-white/10 bg-zinc-950/88 p-6 shadow-2xl shadow-green-950/30 backdrop-blur md:p-8">
      <AuthCardHeader />

      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-normal text-white">
          {t("auth.signIn")}
        </h1>
        <p className="text-sm leading-6 text-zinc-300">
          {t("auth.description")}
        </p>
      </div>

      <div className="my-7 grid grid-cols-4 gap-2" aria-hidden="true">
        <div className="h-1.5 rounded-full bg-primary" />
        <div className="h-1.5 rounded-full bg-orange-500" />
        <div className="h-1.5 rounded-full bg-pink-500" />
        <div className="h-1.5 rounded-full bg-purple-500" />
      </div>

      <GoogleLoginButton />

      <p className="mt-6 text-center text-xs leading-5 text-zinc-500">
        {t("auth.footer")}
      </p>
    </section>
  );
}
