from pathlib import Path


def replace_once(path: str, old: str, new: str) -> None:
    target = Path(path)
    text = target.read_text(encoding="utf-8")
    count = text.count(old)
    if count != 1:
        raise SystemExit(
            f"PATCH_GUARD_FAIL {path}: expected exactly 1 occurrence, found {count}: {old[:100]!r}"
        )
    target.write_text(text.replace(old, new, 1), encoding="utf-8")


path = "components/dashboard/transaction-form.tsx"

replace_once(
    path,
    'import { useI18n } from "@/lib/i18n";\n',
    'import { useI18n } from "@/lib/i18n";\nimport { getCurrencySymbol } from "@/lib/i18n/currency";\n',
)

replace_once(
    path,
    'function TransactionAmountSection({ formData, setFormData, error, t }: TransactionAmountSectionProps) {\n  return (',
    'function TransactionAmountSection({ formData, setFormData, error, t }: TransactionAmountSectionProps) {\n  const { currency } = useI18n();\n\n  return (',
)

replace_once(
    path,
    '<span className={`text-md font-semibold pt-1.5 ${getAmountColorClass(formData.type)}`}>R$</span>',
    '<span className={`text-md font-semibold pt-1.5 ${getAmountColorClass(formData.type)}`}>{getCurrencySymbol(currency)}</span>',
)

print("TRANSACTION_CURRENCY_PATCH_PASS")
