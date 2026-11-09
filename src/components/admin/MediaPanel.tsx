import { cookies } from "next/headers";
import { csrfCookie } from "@/lib/admin/security";
import { MediaManager } from "./MediaManager";
export async function MediaPanel({
  kind,
  id,
  role,
}: {
  kind: "product" | "brand" | "category" | "banner";
  id: string;
  role: string;
}) {
  const csrf = (await cookies()).get(csrfCookie)?.value || "";
  return (
    <MediaManager kind={kind} id={id} csrf={csrf} editable={role === "admin"} />
  );
}
