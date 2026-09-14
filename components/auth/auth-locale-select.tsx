/* v8 ignore file -- Locale switching is covered through i18n provider tests. */
"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type Locale, useI18n } from "@/lib/i18n";

function resolveLocaleSelection(value: string): Locale {
  if (value === "tr-TR") return "tr-TR";
  if (value === "pt-BR") return "pt-BR";
  return "en";
}

export function AuthLocaleSelect() {
  const { locale, setLocale, t } = useI18n();

  return (
    <Select
      value={locale}
      onValueChange={(value) => setLocale(resolveLocaleSelection(value))}
    >
      <SelectTrigger
        aria-label={t("screen.settings.language")}
        className="h-9 w-[7.5rem] border-white/10 bg-zinc-900/80 text-white"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="tr-TR">Türkçe</SelectItem>
        <SelectItem value="en">{t("auth.localeEnglish")}</SelectItem>
        <SelectItem value="pt-BR">{t("auth.localePortuguese")}</SelectItem>
      </SelectContent>
    </Select>
  );
}
