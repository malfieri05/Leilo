import { redirect } from "next/navigation";
import { salesChannelRedirect } from "@/lib/sales-channel";

export const instant = false;

export default async function DsdPage({ searchParams }: PageProps<"/dsd">) {
  redirect(salesChannelRedirect("dsd", await searchParams));
}