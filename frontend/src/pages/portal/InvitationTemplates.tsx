import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ImageIcon, LayoutTemplate, Pencil, Plus, Sparkles, X } from "lucide-react";
import { Card, FormError } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useActiveFilledTemplate,
  useActiveTemplatePreview,
  useDeselectActiveTemplateMutation,
  useEventStandardDefaults,
  useFillActiveTemplateMutation,
  useInvitationTemplates,
} from "@/queries/useInvitationQueries";
import { useEvents } from "@/queries/useEventQueries";
import { resolveMediaUrl } from "@/lib/media";
import { getApiErrorMessage } from "@/lib/apiError";
import { cn } from "@/lib/utils";
import { STANDARD_FIELD_LABELS } from "@/types/invitation.types";
import type {
  ActiveFilledTemplate,
  ActiveTemplatePreview,
  InvitationTemplate,
} from "@/types/invitation.types";
import UploadTemplateDialog from "@/components/membership/invitations/UploadTemplateDialog";

type FillStep = "pick-event" | "fill-fields";

const prettifyKey = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function InvitationTemplates() {
  const { data: templates, isLoading, isError } = useInvitationTemplates();
  const { data: activeTemplate, isLoading: activeLoading } = useActiveFilledTemplate();
  const deselectMutation = useDeselectActiveTemplateMutation();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [fillingTemplate, setFillingTemplate] = useState<InvitationTemplate | null>(null);

  const activeTemplateDefinition =
    templates?.find((template) => template.id === activeTemplate?.template) ?? null;

  return (
    <div className="mobile-safe-bottom px-4 py-6 sm:px-6 sm:py-10 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand-pink)]">
              Invitations
            </p>
            <h1 className="mt-2 text-xl font-bold text-[var(--brand-navy)] sm:text-2xl lg:text-3xl">
              Templates
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Select a template and fill it in once for an event. Then go to the Guests page,
              choose how to send (WhatsApp, Email, SMS or Voice Call) and send.
            </p>
          </div>
          <Button onClick={() => setUploadOpen(true)}>
            <Plus className="h-4 w-4" />
            Upload template
          </Button>
        </div>

        {/* The selected template, shown separately with the organizer's
            text drawn on it exactly as guests will receive it. */}
        {!activeLoading && activeTemplate && (
          <ActiveTemplatePanel
            template={activeTemplateDefinition}
            onEdit={() => activeTemplateDefinition && setFillingTemplate(activeTemplateDefinition)}
            onDeselect={() => deselectMutation.mutate()}
            isDeselecting={deselectMutation.isPending}
          />
        )}

        {isError && (
          <p className="mt-10 text-center text-sm text-rose-600">
            Couldn't load templates right now. Please refresh the page.
          </p>
        )}

        {isLoading && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <Skeleton className="aspect-[3/4] w-full rounded-none" />
                <div className="p-5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-2 h-3 w-full" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && !isError && templates && templates.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mt-8 flex flex-col items-center px-6 py-12 text-center sm:mt-10 sm:py-16"
          >
            <Card className="w-full max-w-md overflow-hidden p-0">
              <div
                className="flex items-center justify-center py-10"
                style={{ background: "var(--gradient-brand-soft)" }}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[var(--brand-pink)] soft-shadow">
                  <LayoutTemplate className="h-7 w-7" />
                </span>
              </div>
              <div className="p-8 pt-6">
                <h2 className="text-lg font-bold text-[var(--brand-navy)]">
                  No invitation templates yet
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Upgrade to a plan with invitation templates, or upload your own to start
                  designing beautiful invites for your guests.
                </p>
                <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                  <Link
                    to="/pricing"
                    className={buttonVariants({ variant: "outline", className: "flex-1" })}
                  >
                    <Sparkles className="h-4 w-4" />
                    View plans
                  </Link>
                  <Button className="flex-1" onClick={() => setUploadOpen(true)}>
                    <Plus className="h-4 w-4" />
                    Upload template
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {!isLoading && !isError && templates && templates.length > 0 && (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {templates.map((template) => {
              const previewUrl = resolveMediaUrl(template.preview_image);
              const isActive = activeTemplate?.template === template.id;

              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.35 }}
                >
                  <Card
                    className={cn(
                      "card-hover-lift overflow-hidden",
                      isActive && "ring-2 ring-[var(--brand-pink)]"
                    )}
                  >
                    <div className="relative flex aspect-[3/4] w-full items-center justify-center bg-slate-100">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt={template.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-10 w-10 text-slate-300" />
                      )}
                      {template.is_custom && (
                        <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-[var(--brand-navy)] shadow-sm">
                          Your upload
                        </span>
                      )}
                      {isActive && (
                        <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded-full bg-[var(--brand-pink)] px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm">
                          <Check className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </div>
                    <div className="p-4 sm:p-5">
                      <p className="font-semibold text-[var(--brand-navy)]">{template.name}</p>
                      {template.description && (
                        <p className="mt-1.5 text-sm text-slate-500">{template.description}</p>
                      )}
                      {!template.in_library && (
                        <p className="mt-1 text-xs text-slate-400">New · uses a slot</p>
                      )}
                      <Button
                        variant={isActive ? "outline" : "primary"}
                        className="mt-3.5 w-full"
                        onClick={() => setFillingTemplate(template)}
                      >
                        {isActive ? "Edit filled details" : "Select & fill"}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <UploadTemplateDialog open={uploadOpen} onClose={() => setUploadOpen(false)} />

      {fillingTemplate && (
        <FillTemplateDialog
          template={fillingTemplate}
          initial={
            activeTemplate && activeTemplate.template === fillingTemplate.id
              ? activeTemplate
              : undefined
          }
          onClose={() => setFillingTemplate(null)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// The filled invitation, as guests will see it
// ---------------------------------------------------------------------

function PreviewCard({
  preview,
  isLoading,
  fallbackUrl,
}: {
  preview: ActiveTemplatePreview | null | undefined;
  isLoading: boolean;
  fallbackUrl: string | null;
}) {
  if (isLoading) {
    return <Skeleton className="aspect-[3/4] w-full rounded-2xl" />;
  }

  if (preview?.image) {
    return (
      <img
        src={preview.image}
        alt="Your filled invitation"
        className="w-full rounded-2xl object-contain shadow-sm"
      />
    );
  }

  if (preview?.text) {
    return (
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <p className="whitespace-pre-line text-sm text-slate-600">{preview.text}</p>
      </div>
    );
  }

  if (fallbackUrl) {
    return <img src={fallbackUrl} alt="Template" className="w-full rounded-2xl object-cover" />;
  }

  return (
    <div className="flex aspect-[3/4] w-full items-center justify-center rounded-2xl bg-slate-100">
      <ImageIcon className="h-8 w-8 text-slate-300" />
    </div>
  );
}

// ---------------------------------------------------------------------
// Active template panel - the selected template, filled in
// ---------------------------------------------------------------------

function ActiveTemplatePanel({
  template,
  onEdit,
  onDeselect,
  isDeselecting,
}: {
  template: InvitationTemplate | null;
  onEdit: () => void;
  onDeselect: () => void;
  isDeselecting: boolean;
}) {
  const { data: active } = useActiveFilledTemplate();
  const { data: preview, isLoading: previewLoading } = useActiveTemplatePreview(active?.updated_at);

  if (!active) return null;

  const labelForCustom = (key: string) =>
    template?.custom_fields.find((field) => field.field_key === key)?.label ?? prettifyKey(key);

  const detailRows: Array<[string, string]> = [
    ...Object.entries(active.standard_values).map(
      ([key, value]) => [STANDARD_FIELD_LABELS[key] ?? prettifyKey(key), value] as [string, string]
    ),
    ...Object.entries(active.custom_values).map(
      ([key, value]) => [labelForCustom(key), value] as [string, string]
    ),
  ].filter(([, value]) => !!value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mt-6"
    >
      <Card className="overflow-hidden border-2 border-[var(--brand-pink)]/30 bg-[var(--brand-pink)]/[0.03]">
        <div className="grid gap-6 p-5 sm:grid-cols-[minmax(0,280px)_1fr] sm:p-6">
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
              Your invitation, as guests will see it
            </p>
            <PreviewCard
              preview={preview}
              isLoading={previewLoading}
              fallbackUrl={resolveMediaUrl(active.template_preview_image)}
            />
          </div>

          <div className="flex flex-col">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--brand-pink)]">
              <Check className="h-3.5 w-3.5" />
              Currently active
            </p>
            <p className="mt-1 text-lg font-semibold text-[var(--brand-navy)]">
              {active.template_name}
            </p>
            <p className="text-sm text-slate-500">
              Set up for <span className="font-medium">{active.event_name}</span>
            </p>

            {detailRows.length > 0 && (
              <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                {detailRows.map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-xs text-slate-400">{label}</dt>
                    <dd className="font-medium text-[var(--brand-navy)]">{value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <p className="mt-4 text-sm text-slate-500">
              Next: open the Guests page, choose WhatsApp, Email, SMS or Voice Call, and send.
            </p>

            <div className="mt-auto flex flex-wrap gap-2 pt-5">
              <Button variant="outline" onClick={onEdit} disabled={!template}>
                <Pencil className="h-4 w-4" />
                Edit details
              </Button>
              <Button variant="outline" onClick={onDeselect} isLoading={isDeselecting}>
                <X className="h-4 w-4" />
                Deselect
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// ---------------------------------------------------------------------
// Fill dialog - select event, then fill standard + custom fields, then confirm
// ---------------------------------------------------------------------

function FillTemplateDialog({
  template,
  initial,
  onClose,
}: {
  template: InvitationTemplate;
  /** The organizer's existing fill of THIS template, when editing it. */
  initial?: ActiveFilledTemplate;
  onClose: () => void;
}) {
  const { data: eventsPage, isLoading: eventsLoading } = useEvents(1);

  // Editing an existing fill skips straight to the form with its values.
  const [step, setStep] = useState<FillStep>(initial ? "fill-fields" : "pick-event");
  const [eventId, setEventId] = useState<number | null>(initial ? initial.event : null);
  const [standardValues, setStandardValues] = useState<Record<string, string>>(
    initial ? initial.standard_values : {}
  );
  const [customValues, setCustomValues] = useState<Record<string, string>>(
    initial ? initial.custom_values : {}
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedActive, setConfirmedActive] = useState<ActiveFilledTemplate | null>(null);

  const { data: defaults, isLoading: defaultsLoading } = useEventStandardDefaults(eventId);
  const fillMutation = useFillActiveTemplateMutation();

  const events = eventsPage?.events ?? [];

  // Event defaults pre-fill a fresh form. They must NOT overwrite the
  // organizer's saved values while they are editing an existing fill.
  useEffect(() => {
    if (!defaults) return;
    if (initial && eventId === initial.event) return;
    setStandardValues({ ...defaults });
  }, [defaults, eventId, initial]);

  const handlePickEvent = (id: number) => {
    setEventId(id);
    setStep("fill-fields");
  };

  const missingCustomField = template.custom_fields.some(
    (field) => !(customValues[field.field_key] ?? "").trim()
  );

  const canConfirm = !missingCustomField;

  const handleConfirm = () => {
    if (!eventId) return;
    setErrorMessage(null);

    fillMutation.mutate(
      {
        template_id: template.id,
        event_id: eventId,
        standard_values: standardValues,
        custom_values: customValues,
      },
      {
        onSuccess: (active) => {
          setConfirmedActive(active);
        },
        onError: (error) => {
          setErrorMessage(getApiErrorMessage(error, "Couldn't fill in this template."));
        },
      }
    );
  };

  const confirmed = confirmedActive !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.15 }}
        className="premium-card relative max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 sm:p-8"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-[var(--brand-navy)]">
              {confirmed ? "Template confirmed" : `Fill in "${template.name}"`}
            </h2>
            {!confirmed && (
              <p className="mt-1 text-sm text-slate-500">
                {step === "pick-event"
                  ? "Which event is this invitation for?"
                  : "Review and edit the details, then confirm."}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {confirmedActive && (
          <ConfirmedStep active={confirmedActive} onClose={onClose} />
        )}

        {!confirmed && step === "pick-event" && (
          <div className="mt-6">
            {eventsLoading && <p className="text-sm text-slate-400">Loading your events...</p>}

            {!eventsLoading && events.length === 0 && (
              <div className="rounded-2xl bg-amber-50 p-4">
                <p className="text-sm text-amber-800">
                  You don't have any events yet. Create one first.
                </p>
                <Link
                  to="/portal/events/new"
                  className="mt-2 inline-block text-sm font-semibold text-[var(--brand-pink)]"
                >
                  Create an event
                </Link>
              </div>
            )}

            {!eventsLoading && events.length > 0 && (
              <div className="space-y-2">
                {events.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => handlePickEvent(event.id)}
                    className="flex w-full items-center justify-between rounded-2xl border border-slate-200 p-3.5 text-left hover:border-[var(--brand-pink)]"
                  >
                    <div>
                      <p className="font-medium text-[var(--brand-navy)]">{event.name}</p>
                      <p className="text-xs text-slate-500">{event.venue_name || "No venue set"}</p>
                    </div>
                    <span className="text-xs text-slate-400">{event.event_date}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!confirmed && step === "fill-fields" && (
          <div className="mt-6 space-y-5">
            {defaultsLoading && !initial && (
              <p className="text-sm text-slate-400">Loading event details...</p>
            )}

            {(!defaultsLoading || !!initial) && (
              <>
                <div className="space-y-3">
                  <p className="text-sm font-medium text-[var(--brand-navy)]">
                    Standard details (auto-filled, editable)
                  </p>
                  {Object.keys(STANDARD_FIELD_LABELS).map((key) => (
                    <div key={key} className="space-y-1.5">
                      <Label htmlFor={`standard-${key}`}>{STANDARD_FIELD_LABELS[key]}</Label>
                      <Input
                        id={`standard-${key}`}
                        value={standardValues[key] ?? ""}
                        onChange={(e) =>
                          setStandardValues((values) => ({ ...values, [key]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                </div>

                {template.custom_fields.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-[var(--brand-navy)]">
                      This template's own fields
                    </p>
                    {template.custom_fields.map((field) => (
                      <div key={field.id} className="space-y-1.5">
                        <Label htmlFor={`custom-${field.field_key}`}>{field.label}</Label>
                        <Input
                          id={`custom-${field.field_key}`}
                          value={customValues[field.field_key] ?? ""}
                          onChange={(e) =>
                            setCustomValues((values) => ({
                              ...values,
                              [field.field_key]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}

                {template.body_text ? (
                  <div className="rounded-2xl bg-slate-50 p-3.5">
                    <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                      Preview
                    </p>
                    <p className="whitespace-pre-line text-sm text-slate-600">
                      {renderLivePreview(template.body_text, standardValues, customValues)}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    After you confirm, your details are drawn onto the invitation and you can see
                    the result on this page.
                  </p>
                )}

                {errorMessage && <FormError message={errorMessage} />}

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1" onClick={() => setStep("pick-event")}>
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleConfirm}
                    disabled={!canConfirm}
                    isLoading={fillMutation.isPending}
                  >
                    Confirm
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function ConfirmedStep({
  active,
  onClose,
}: {
  active: ActiveFilledTemplate;
  onClose: () => void;
}) {
  const { data: preview, isLoading } = useActiveTemplatePreview(active.updated_at);

  return (
    <div className="mt-6">
      <div className="rounded-2xl bg-emerald-50 p-4">
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-800">
          <Check className="h-4 w-4" />
          This is now your active template.
        </p>
        <p className="mt-1 text-sm text-emerald-700">
          Go to the Guests page, choose how to send, and send this invitation.
        </p>
      </div>

      <div className="mt-4 max-h-80 overflow-y-auto rounded-2xl">
        <PreviewCard
          preview={preview}
          isLoading={isLoading}
          fallbackUrl={resolveMediaUrl(active.template_preview_image)}
        />
      </div>

      <Button className="mt-5 w-full" onClick={onClose}>
        Done
      </Button>
    </div>
  );
}

// Client-side approximation of the server's render, for a live preview
// while typing - guest_name stays literal since there's no single guest
// yet (this is filled once, for all guests).
function renderLivePreview(
  bodyText: string,
  standardValues: Record<string, string>,
  customValues: Record<string, string>
): string {
  const context: Record<string, string> = {
    guest_name: "{guest_name}",
    ...standardValues,
    ...customValues,
  };

  return bodyText.replace(/\{(\w+)\}/g, (match, key) =>
    key in context ? context[key] : match
  );
}