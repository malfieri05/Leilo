import type { Metadata } from "next";
import { BrandKitView } from "@/components/brand-kit-view";

export const metadata: Metadata = { title: "Marketing Kit" };

export default function BrandPage() {
  return <BrandKitView />;
}