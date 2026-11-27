import { redirect } from "next/navigation";
import { salesChannelRedirect } from "@/lib/sales-channel";

export const instant = false;

export default async function KehePage({ searchParams }: PageProps<"/kehe">) {
  redirect(salesChannelRedirect("kehe", await searchParams));
}