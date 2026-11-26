import { redirect } from "next/navigation";
import { salesChannelRedirect } from "@/lib/sales-channel";

export default async function UnfiPage({ searchParams }: PageProps<"/unfi">) {
  redirect(salesChannelRedirect("unfi", await searchParams));
}