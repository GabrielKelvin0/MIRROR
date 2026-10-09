"use client";
import type { UserRole } from "@prisma/client";
import { changeUserRole } from "@/app/(admin)/actions";
import { AdminChangeForm } from "@/components/admin/AdminChangeForm";
import { USER_ROLES } from "@/lib/services/moderation-rules";

export default function RoleForm({ userId, role }: { userId: string; role: UserRole }) {
  return (
    <AdminChangeForm
      key={role}
      action={changeUserRole.bind(null, userId)}
      label="Change role"
      field="role"
      options={USER_ROLES.filter((value) => value !== role).map((value) => ({
        value,
        label: value.toLowerCase(),
      }))}
      hidden={{ expectedRole: role }}
      help="Review the access this role grants and record why it is needed."
    />
  );
}
