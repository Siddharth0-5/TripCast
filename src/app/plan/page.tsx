import type { Metadata } from "next";
import { Questionnaire } from "@/components/plan/Questionnaire";

export const metadata: Metadata = { title: "Plan a trip · Tripcast" };

export default function PlanPage() {
  return (
    <main className="flex-1">
      <Questionnaire />
    </main>
  );
}
