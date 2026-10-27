import { redirect } from "next/navigation";

// Legacy path from before the schedule route moved under the (practitioner) group.
export default function LegacyScheduleRedirect() {
  redirect("/practitioner/schedule");
}
