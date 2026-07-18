import { redirect } from "next/navigation";
import { getCurrentUserRole } from "@/lib/get-role";
import UsersClient from "./users-client";

export default async function NguoiDungPage() {
  const role = await getCurrentUserRole();
  if (role !== "admin") {
    redirect("/ho-so");
  }
  return <UsersClient />;
}
