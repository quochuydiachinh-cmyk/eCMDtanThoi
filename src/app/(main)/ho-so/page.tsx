import { getCurrentUserRole } from "@/lib/get-role";
import { canEditRole } from "@/lib/role";
import HoSoGrid from "./ho-so-grid";

export default async function HoSoPage() {
  const role = await getCurrentUserRole();
  return <HoSoGrid canEdit={canEditRole(role)} />;
}
