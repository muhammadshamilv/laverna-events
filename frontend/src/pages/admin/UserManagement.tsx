import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Ban, CheckCircle2, Pencil, Search, Trash2 } from "lucide-react";
import { Card, FormError } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/apiError";
import { toastStore } from "@/stores/toast.store";
import {
  useAdminUsers,
  useDeleteAdminUserMutation,
  useSuspendAdminUserMutation,
  useUnsuspendAdminUserMutation,
  useUpdateAdminUserMutation,
} from "@/queries/useAdminQueries";
import type { AdminUser } from "@/types/admin.types";
import type { UserRole } from "@/types/auth.types";

const editUserSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  mobile_number: z.string().min(10, "Enter a valid mobile number"),
  role: z.enum(["ADMIN", "ORGANIZER", "PHOTOGRAPHER", "GUEST"]),
});

type EditUserFormValues = z.infer<typeof editUserSchema>;

function EditUserDialog({ user, onClose }: { user: AdminUser; onClose: () => void }) {
  const updateMutation = useUpdateAdminUserMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      full_name: user.full_name,
      email: user.email,
      mobile_number: user.mobile_number,
      role: user.role,
    },
  });

  const onSubmit = (values: EditUserFormValues) => {
    updateMutation.mutate(
      { userId: user.id, payload: values },
      {
        onSuccess: () => {
          toastStore.show("User updated successfully.");
          onClose();
        },
        onError: (error) => {
          const fieldErrors = getApiFieldErrors(error);
          for (const [field, message] of Object.entries(fieldErrors)) {
            setError(field as keyof EditUserFormValues, { message });
          }
          toastStore.show(getApiErrorMessage(error, "Could not update user."), "error");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <Card className="relative w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-[var(--brand-navy)]">Edit user</h2>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="full_name">Full name</Label>
            <Input id="full_name" hasError={!!errors.full_name} {...register("full_name")} />
            <FormError message={errors.full_name?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" hasError={!!errors.email} {...register("email")} />
            <FormError message={errors.email?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mobile_number">Mobile number</Label>
            <Input id="mobile_number" hasError={!!errors.mobile_number} {...register("mobile_number")} />
            <FormError message={errors.mobile_number?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="role">Role</Label>
            <Select id="role" hasError={!!errors.role} {...register("role")}>
              <option value="ADMIN">Admin</option>
              <option value="ORGANIZER">Organizer</option>
              <option value="PHOTOGRAPHER">Photographer</option>
              <option value="GUEST">Guest</option>
            </Select>
            <FormError message={errors.role?.message} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={updateMutation.isPending}>
              Save changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function roleBadgeClass(role: UserRole): string {
  switch (role) {
    case "ADMIN":
      return "bg-[var(--brand-navy)]/8 text-[var(--brand-navy)]";
    case "ORGANIZER":
      return "bg-[var(--brand-pink)]/8 text-[var(--brand-pink)]";
    case "PHOTOGRAPHER":
      return "bg-emerald-50 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export default function UserManagement() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 400);

  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

  const { data, isLoading, isError } = useAdminUsers({
    page,
    search: debouncedSearch || undefined,
    role: roleFilter || undefined,
  });

  const suspendMutation = useSuspendAdminUserMutation();
  const unsuspendMutation = useUnsuspendAdminUserMutation();
  const deleteMutation = useDeleteAdminUserMutation();

  const handleToggleSuspend = (user: AdminUser) => {
    const mutation = user.is_suspended ? unsuspendMutation : suspendMutation;
    mutation.mutate(user.id, {
      onSuccess: () => {
        toastStore.show(
          user.is_suspended ? "User unsuspended." : "User suspended."
        );
      },
      onError: (error) => {
        toastStore.show(getApiErrorMessage(error, "Could not update user status."), "error");
      },
    });
  };

  const handleDelete = () => {
    if (!deletingUser) return;
    deleteMutation.mutate(deletingUser.id, {
      onSuccess: () => {
        toastStore.show("User deleted.");
        setDeletingUser(null);
      },
      onError: (error) => {
        toastStore.show(getApiErrorMessage(error, "Could not delete user."), "error");
        setDeletingUser(null);
      },
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--brand-navy)]">User Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Search, filter, suspend, or remove any user on the platform.
        </p>
      </div>

      <Card className="mb-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Search by name, email, or mobile number"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-11"
            />
          </div>
          <Select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as UserRole | "");
              setPage(1);
            }}
            className="sm:w-48"
          >
            <option value="">All roles</option>
            <option value="ADMIN">Admin</option>
            <option value="ORGANIZER">Organizer</option>
            <option value="PHOTOGRAPHER">Photographer</option>
            <option value="GUEST">Guest</option>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {isError ? (
          <div className="p-8 text-center text-sm text-slate-500">
            We couldn't load users right now. Please refresh the page.
          </div>
        ) : isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : data && data.users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.users.map((user) => (
                  <tr key={user.id}>
                    <td className="px-4 py-3 font-medium text-[var(--brand-navy)]">
                      {user.full_name}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      <div>{user.email}</div>
                      <div className="text-xs text-slate-400">{user.mobile_number}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${roleBadgeClass(user.role)}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.is_suspended ? (
                        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">
                          Suspended
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingUser(user)}
                          aria-label="Edit user"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleSuspend(user)}
                          aria-label={user.is_suspended ? "Unsuspend user" : "Suspend user"}
                        >
                          {user.is_suspended ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Ban className="h-4 w-4 text-amber-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingUser(user)}
                          aria-label="Delete user"
                        >
                          <Trash2 className="h-4 w-4 text-rose-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-slate-500">No users found.</div>
        )}
      </Card>

      {data && data.pagination.total_pages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-slate-500">
            Page {data.pagination.current_page} of {data.pagination.total_pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.pagination.total_pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {editingUser && (
        <EditUserDialog user={editingUser} onClose={() => setEditingUser(null)} />
      )}

      <ConfirmDialog
        open={!!deletingUser}
        title="Delete this user?"
        description={`This permanently deletes "${deletingUser?.full_name}" and cannot be undone.`}
        confirmLabel="Delete"
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeletingUser(null)}
      />
    </div>
  );
}