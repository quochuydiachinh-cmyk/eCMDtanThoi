export type Role = "admin" | "editor" | "viewer";

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Quản trị",
  editor: "Có thể sửa",
  viewer: "Chỉ xem",
};

export function canEditRole(role: Role | null | undefined): boolean {
  return role === "admin" || role === "editor";
}

export function isAdminRole(role: Role | null | undefined): boolean {
  return role === "admin";
}
