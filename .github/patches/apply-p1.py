from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    p = Path(path)
    text = p.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(
            f"PATCH_GUARD_FAIL {path}: expected 1 occurrence, found {count}: {old[:80]!r}"
        )
    p.write_text(text.replace(old, new, 1), encoding="utf-8")


replace_once(
    "lib/i18n.tsx",
    'import { formatCurrency, isSupportedCurrency } from "@/lib/i18n/currency";\n',
    'import { formatCurrency, isSupportedCurrency } from "@/lib/i18n/currency";\nimport { turkishMessages } from "@/lib/i18n/tr";\n',
)
replace_once(
    "lib/i18n.tsx",
    'export type Locale = "en" | "pt-BR";',
    'export type Locale = "tr-TR" | "en" | "pt-BR";',
)
replace_once(
    "lib/i18n.tsx",
    '''function resolveLocale(value?: string | null): Locale {\n  return value?.toLowerCase().startsWith("pt") ? "pt-BR" : "en";\n}''',
    '''function resolveLocale(value?: string | null): Locale {\n  const normalized = value?.toLowerCase() ?? "";\n  if (normalized.startsWith("tr")) return "tr-TR";\n  if (normalized.startsWith("pt")) return "pt-BR";\n  return "en";\n}''',
)
replace_once(
    "lib/i18n.tsx",
    '''  if (isSupportedCurrency(candidate)) return candidate;\n  return locale === "pt-BR" ? "BRL" : "USD";''',
    '''  if (isSupportedCurrency(candidate)) return candidate;\n  if (locale === "tr-TR") return "TRY";\n  return locale === "pt-BR" ? "BRL" : "USD";''',
)
replace_once(
    "lib/i18n.tsx",
    '''function translateMessage(locale: Locale, key: string): string {\n  return (''',
    '''function translateMessage(locale: Locale, key: string): string {\n  if (locale === "tr-TR") {\n    return (\n      turkishMessages[key] ??\n      turkishMessages[`data.category.${key}`] ??\n      turkishMessages[`data.group.${key}`] ??\n      turkishMessages[`common.${key}`] ??\n      messages.en[key as keyof Messages] ??\n      messages.en[`data.category.${key}` as keyof Messages] ??\n      messages.en[`data.group.${key}` as keyof Messages] ??\n      messages.en[`common.${key}` as keyof Messages] ??\n      key\n    );\n  }\n\n  return (''',
)

replace_once(
    "lib/finance/transactions.ts",
    '  return paymentMethod.type === "cash" || paymentMethod.type === "pix";',
    '  return paymentMethod.type === "cash";',
)

replace_once(
    "tests/lib/finance/transactions-crud.test.ts",
    '''  it("throws for a protected payment method", async () => {\n    setup([qb({ data: paymentMethodRow({ type: "pix" }), error: null })]);\n    await expect(updatePaymentMethod(validInput)).rejects.toThrow(\n      "This payment method cannot be edited.",\n    );\n  });''',
    '''  it("throws for a protected payment method", async () => {\n    setup([qb({ data: paymentMethodRow({ type: "cash" }), error: null })]);\n    await expect(updatePaymentMethod(validInput)).rejects.toThrow(\n      "This payment method cannot be edited.",\n    );\n  });\n\n  it("allows a legacy pix payment method to be converted", async () => {\n    setup([\n      qb({ data: paymentMethodRow({ type: "pix" }), error: null }),\n      qb({ error: null }),\n    ]);\n    await expect(updatePaymentMethod(validInput)).resolves.toBeUndefined();\n  });''',
)
replace_once(
    "tests/lib/finance/transactions-crud.test.ts",
    '''  it("deletes a non-protected payment method", async () => {\n    const supabase = setup([\n      qb({ data: paymentMethodRow(), error: null }),\n      qb({ error: null }),\n    ]);\n    await expect(\n      deletePaymentMethod(PAYMENT_METHOD_ID),\n    ).resolves.toBeUndefined();\n    expect(supabase.from).toHaveBeenCalledWith("payment_methods");\n  });''',
    '''  it("deletes a non-protected payment method", async () => {\n    const supabase = setup([\n      qb({ data: paymentMethodRow(), error: null }),\n      qb({ error: null }),\n    ]);\n    await expect(\n      deletePaymentMethod(PAYMENT_METHOD_ID),\n    ).resolves.toBeUndefined();\n    expect(supabase.from).toHaveBeenCalledWith("payment_methods");\n  });\n\n  it("deletes a legacy pix payment method", async () => {\n    setup([\n      qb({ data: paymentMethodRow({ type: "pix" }), error: null }),\n      qb({ error: null }),\n    ]);\n    await expect(deletePaymentMethod(PAYMENT_METHOD_ID)).resolves.toBeUndefined();\n  });''',
)

print("P1_TURKEY_PATCH_APPLIED")
