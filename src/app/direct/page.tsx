import { redirect } from "next/navigation";
import { salesChannelRedirect } from "@/lib/sales-channel";

export default async function DirectPage({ searchParams }: PageProps<"/direct">) {
  redirect(salesChannelRedirect("direct", await searchParams));
}