import type { ReactNode } from "react";
import { isAdmin } from "@/lib/auth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!(await isAdmin())) return <AdminLogin />;
  return <AdminShell>{children}</AdminShell>;
}
