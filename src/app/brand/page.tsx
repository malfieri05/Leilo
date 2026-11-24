import type { Metadata } from "next";
import { BrandKitView } from "@/components/brand-kit-view";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Brand kit" };

export default function BrandPage() {
  return (
    <>
      <PageHeader
        title="Leilo Brand Kit / Marketing Materials"
        description="The files the sales team hands a buyer. This shelf is for assets, not orders. Each section opens the live Google Drive folder or file the marketing team maintains."
      />
      <BrandKitView />
    </>
  );
}