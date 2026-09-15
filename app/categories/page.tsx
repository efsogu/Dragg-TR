import { AppShell } from "@/components/dashboard/app-shell"
import { CategoriesScreen } from "@/components/dashboard/categories-screen"
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
} from "@/app/transactions/actions"
import { listCategoryOverview } from "@/lib/finance/transactions"
import { getTurkeyMonthValue } from "@/lib/time/turkey-calendar"

type CategoriesPageProps = {
  searchParams?: Promise<{
    month?: string | string[];
  }>;
};

export default async function CategoriesPage({
  searchParams,
}: CategoriesPageProps) {
  const resolvedSearchParams = await searchParams;
  const selectedMonthParam = Array.isArray(resolvedSearchParams?.month)
    ? resolvedSearchParams.month[0]
    : resolvedSearchParams?.month;
  const selectedMonth = selectedMonthParam ?? getTurkeyMonthValue();
  const categories = await listCategoryOverview(selectedMonth)

  return (
    <AppShell>
      <CategoriesScreen
        categories={categories}
        createCategoryAction={createCategoryAction}
        deleteCategoryAction={deleteCategoryAction}
        updateCategoryAction={updateCategoryAction}
      />
    </AppShell>
  )
}
