import { redirect } from "next/navigation";
import { salesChannelRedirect } from "@/lib/sales-channel";

/** Legacy URL alias; always redirects with request search params. */
export const instant = false;

export default async function DirectPage({ searchParams }: PageProps<"/direct">) {
  redirect(salesChannelRedirect("direct", await searchParams));
}