import { redirect } from "next/navigation";
import { salesChannelRedirect } from "@/lib/sales-channel";

export default async function DsdPage({ searchParams }: PageProps<"/dsd">) {
  redirect(salesChannelRedirect("dsd", await searchParams));
}