import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Card, FormError } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/apiError";
import { toastStore } from "@/stores/toast.store";
import {
  useAdminMembershipPlans,
  useCreateAdminMembershipPlanMutation,
  useDeleteAdminMembershipPlanMutation,
  useUpdateAdminMembershipPlanMutation,
} from "@/queries/useAdminQueries";
import type { AdminMembershipPlan } from "@/types/admin.types";

// Matches AdminMembershipPlanSerializer exactly (backend/admin_panel/serializers.py).
// Phase 17: added total_invitations / template_limit / voice_call_limit -
// the shared-pool quota fields that replaced the old per-plan template M2M.
// All three are optional text fields; an empty string means "unlimited"
// (serialized as null), matching how event_limit/guest_limit/
// storage_limit_mb already behave.
const planSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z
    .string()
    .min(1, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  description: z.string().optional(),
  price: z.string().min(1, "Price is required"),
  duration_days: z.string().min(1, "Duration is required"),
  event_limit: z.string().optional(),
  guest_limit: z.string().optional(),
  storage_limit_mb: z.string().optional(),
  total_invitations: z.string().optional(),
  template_limit: z.string().optional(),
  voice_call_limit: z.string().optional(),
  gallery_enabled: z.boolean(),
  qr_code_enabled: z.boolean(),
  photographer_access_enabled: z.boolean(),
  is_active: z.boolean(),
});

type PlanFormValues = z.infer<typeof planSchema>;

function PlanFormDialog({
  plan,
  onClose,
}: {
  plan: AdminMembershipPlan | null;
  onClose: () => void;
}) {
  const isEditing = !!plan;
  const createMutation = useCreateAdminMembershipPlanMutation();
  const updateMutation = useUpdateAdminMembershipPlanMutation();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: plan?.name ?? "",
      slug: plan?.slug ?? "",
      description: plan?.description ?? "",
      price: plan?.price ?? "",
      duration_days: plan?.duration_days != null ? String(plan.duration_days) : "30",
      event_limit: plan?.event_limit != null ? String(plan.event_limit) : "",
      guest_limit: plan?.guest_limit != null ? String(plan.guest_limit) : "",
      storage_limit_mb: plan?.storage_limit_mb != null ? String(plan.storage_limit_mb) : "",
      total_invitations: plan?.total_invitations != null ? String(plan.total_invitations) : "",
      template_limit: plan?.template_limit != null ? String(plan.template_limit) : "",
      voice_call_limit: plan?.voice_call_limit != null ? String(plan.voice_call_limit) : "",
      gallery_enabled: plan?.gallery_enabled ?? true,
      qr_code_enabled: plan?.qr_code_enabled ?? true,
      photographer_access_enabled: plan?.photographer_access_enabled ?? false,
      is_active: plan?.is_active ?? true,
    },
  });

  const onSubmit = (values: PlanFormValues) => {
    const payload = {
      name: values.name,
      slug: values.slug,
      description: values.description || "",
      price: values.price,
      duration_days: Number(values.duration_days),
      event_limit: values.event_limit ? Number(values.event_limit) : null,
      guest_limit: values.guest_limit ? Number(values.guest_limit) : null,
      storage_limit_mb: values.storage_limit_mb ? Number(values.storage_limit_mb) : null,
      total_invitations: values.total_invitations ? Number(values.total_invitations) : null,
      template_limit: values.template_limit ? Number(values.template_limit) : null,
      voice_call_limit: values.voice_call_limit ? Number(values.voice_call_limit) : null,
      gallery_enabled: values.gallery_enabled,
      qr_code_enabled: values.qr_code_enabled,
      photographer_access_enabled: values.photographer_access_enabled,
      is_active: values.is_active,
    };

    const onSuccess = () => {
      toastStore.show(isEditing ? "Plan updated." : "Plan created.");
      onClose();
    };
    const onError = (error: unknown) => {
      const fieldErrors = getApiFieldErrors(error);
      for (const [field, message] of Object.entries(fieldErrors)) {
        setError(field as keyof PlanFormValues, { message });
      }
      toastStore.show(getApiErrorMessage(error, "Could not save plan."), "error");
    };

    if (isEditing) {
      updateMutation.mutate({ planId: plan.id, payload }, { onSuccess, onError });
    } else {
      createMutation.mutate(payload, { onSuccess, onError });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <Card className="relative w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-[var(--brand-navy)]">
          {isEditing ? "Edit plan" : "Add plan"}
        </h2>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-4 max-h-[70vh] space-y-4 overflow-y-auto pr-1"
        >
          <div className="space-y-1.5">
            <Label htmlFor="name">Plan name</Label>
            <Input id="name" hasError={!!errors.name} {...register("name")} />
            <FormError message={errors.name?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" hasError={!!errors.slug} {...register("slug")} />
            <FormError message={errors.slug?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Input id="description" {...register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="price">Price</Label>
              <Input id="price" hasError={!!errors.price} {...register("price")} />
              <FormError message={errors.price?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duration_days">Duration (days)</Label>
              <Input
                id="duration_days"
                type="number"
                hasError={!!errors.duration_days}
                {...register("duration_days")}
              />
              <FormError message={errors.duration_days?.message} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="event_limit">Event limit</Label>
              <Input id="event_limit" type="number" placeholder="Unlimited" {...register("event_limit")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guest_limit">Guest limit</Label>
              <Input id="guest_limit" type="number" placeholder="Unlimited" {...register("guest_limit")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="storage_limit_mb">Storage limit (MB)</Label>
            <Input
              id="storage_limit_mb"
              type="number"
              placeholder="Unlimited"
              {...register("storage_limit_mb")}
            />
          </div>

          <div className="space-y-3 rounded-2xl bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Invitation quotas
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="total_invitations">
                Total invitations (shared across WhatsApp/Email/SMS)
              </Label>
              <Input
                id="total_invitations"
                type="number"
                placeholder="Unlimited"
                {...register("total_invitations")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="template_limit">Template library limit</Label>
              <Input
                id="template_limit"
                type="number"
                placeholder="Unlimited"
                {...register("template_limit")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="voice_call_limit">
                Voice call limit (0 disables voice calling)
              </Label>
              <Input
                id="voice_call_limit"
                type="number"
                placeholder="Unlimited"
                {...register("voice_call_limit")}
              />
            </div>
          </div>

          <div className="space-y-2 rounded-2xl bg-slate-50 p-3">
            <label className="flex items-center gap-2 text-sm text-[var(--brand-navy)]">
              <input type="checkbox" className="h-4 w-4 rounded" {...register("gallery_enabled")} />
              Gallery enabled
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--brand-navy)]">
              <input type="checkbox" className="h-4 w-4 rounded" {...register("qr_code_enabled")} />
              QR code enabled
            </label>
            <label className="flex items-center gap-2 text-sm text-[var(--brand-navy)]">
              <input
                type="checkbox"
                className="h-4 w-4 rounded"
                {...register("photographer_access_enabled")}
              />
              Photographer access enabled
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm text-[var(--brand-navy)]">
            <input type="checkbox" className="h-4 w-4 rounded" {...register("is_active")} />
            Active (visible on pricing page)
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isPending}>
              {isEditing ? "Save changes" : "Create plan"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function MembershipPlans() {
  const { data: plans, isLoading, isError } = useAdminMembershipPlans();
  const deleteMutation = useDeleteAdminMembershipPlanMutation();

  const [formPlan, setFormPlan] = useState<AdminMembershipPlan | "new" | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<AdminMembershipPlan | null>(null);

  const handleDelete = () => {
    if (!deletingPlan) return;
    deleteMutation.mutate(deletingPlan.id, {
      onSuccess: () => {
        toastStore.show("Plan deleted.");
        setDeletingPlan(null);
      },
      onError: (error) => {
        toastStore.show(getApiErrorMessage(error, "Could not delete plan."), "error");
        setDeletingPlan(null);
      },
    });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--brand-navy)]">Membership Plans</h1>
          <p className="mt-1 text-sm text-slate-500">Create and manage subscription plans.</p>
        </div>
        <Button onClick={() => setFormPlan("new")}>
          <Plus className="h-4 w-4" />
          Add plan
        </Button>
      </div>

      {isError ? (
        <Card className="p-8 text-center text-sm text-slate-500">
          We couldn't load plans right now. Please refresh the page.
        </Card>
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-3xl" />
          ))}
        </div>
      ) : plans && plans.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-[var(--brand-navy)]">{plan.name}</h3>
                  <p className="text-xs text-slate-400">{plan.slug}</p>
                </div>
                {plan.is_active ? (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    Active
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                    Inactive
                  </span>
                )}
              </div>

              <p className="mt-3 text-2xl font-bold text-[var(--brand-navy)]">
                ₹{plan.price}
                <span className="text-sm font-medium text-slate-400">
                  {" "}
                  / {plan.duration_days} days
                </span>
              </p>

              {plan.description && (
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">{plan.description}</p>
              )}

              <div className="mt-3 flex-1 space-y-1 text-sm text-slate-500">
                <p>Events: {plan.event_limit ?? "Unlimited"}</p>
                <p>Guests: {plan.guest_limit ?? "Unlimited"}</p>
                <p>Storage: {plan.storage_limit_mb != null ? `${plan.storage_limit_mb} MB` : "Unlimited"}</p>
                <p>Invitations: {plan.total_invitations ?? "Unlimited"}</p>
                <p>Templates: {plan.template_limit ?? "Unlimited"}</p>
                <p>Voice calls: {plan.voice_call_limit ?? "Unlimited"}</p>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {plan.gallery_enabled && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                    Gallery
                  </span>
                )}
                {plan.qr_code_enabled && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                    QR Code
                  </span>
                )}
                {plan.photographer_access_enabled && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-500">
                    Photographer Access
                  </span>
                )}
              </div>

              <div className="mt-4 flex gap-2 border-t border-slate-100 pt-4">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => setFormPlan(plan)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeletingPlan(plan)}
                  aria-label="Delete plan"
                >
                  <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-8 text-center text-sm text-slate-500">
          No plans yet. Click "Add plan" to create one.
        </Card>
      )}

      {formPlan && (
        <PlanFormDialog
          plan={formPlan === "new" ? null : formPlan}
          onClose={() => setFormPlan(null)}
        />
      )}

      <ConfirmDialog
        open={!!deletingPlan}
        title="Delete this plan?"
        description={`"${deletingPlan?.name}" will no longer be available for new subscriptions.`}
        confirmLabel="Delete"
        destructive
        isLoading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeletingPlan(null)}
      />
    </div>
  );
}