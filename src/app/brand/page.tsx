import type { Metadata } from "next";
import { ScaffoldPage } from "@/components/scaffold-page";

export const metadata: Metadata = { title: "Brand kit" };

export default function BrandPage() {
  return (
    <ScaffoldPage
      title="Leilo Brand Kit / Marketing Materials"
      description="The files the sales team hands a buyer. This shelf is for assets, not orders. Nothing is uploaded yet."
      panels={[
        {
          title: "Kit",
          action: "Empty shelf",
          cards: [
            { title: "Logo pack", detail: "Wordmark and mark, light and dark." },
            { title: "Sell sheets", detail: "One-pagers by can, stick, and variety." },
            { title: "Photography", detail: "Product, lifestyle, and in-store shots." },
            { title: "Wholesale leave-behind", detail: "Pricing story, case counts, and where to order." },
          ],
        },
      ]}
    />
  );
}
