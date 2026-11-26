import type { Metadata } from "next";
import { BrandKitView } from "@/components/brand-kit-view";

export const metadata: Metadata = { title: "Brand kit" };

export default function BrandPage() {
  return <BrandKitView />;
}