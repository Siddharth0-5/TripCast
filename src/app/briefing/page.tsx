/**
 * /briefing?id=…: "sample" renders the bundled demo (no key or network needed);
 * any other id is read from localStorage on the client.
 */
import type { Metadata } from "next";
import { BriefingLoader } from "@/components/briefing/BriefingLoader";
import { Dashboard } from "@/components/briefing/Dashboard";
import { SAMPLE_BRIEFING } from "@/lib/sample/sample-briefing";

export const metadata: Metadata = { title: "Your briefing · Tripcast" };

export default async function BriefingPage({ searchParams }: PageProps<"/briefing">) {
  const { id } = await searchParams;
  const briefingId = typeof id === "string" ? id : "";
  if (briefingId === "sample") return <Dashboard b={SAMPLE_BRIEFING} />;
  return <BriefingLoader id={briefingId} />;
}
