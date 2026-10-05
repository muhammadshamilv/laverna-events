import { z } from "zod";

export const guestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Guest name is required.")
    .max(150, "Name must be 150 characters or fewer."),
  // Same pattern as schemas/auth.schema.ts's mobile_number validator.
  mobile_number: z
    .string()
    .trim()
    .regex(/^\d{10,15}$/, "Mobile number must be 10-15 digits."),
  email: z
    .union([z.string().trim().toLowerCase().email("Enter a valid email address."), z.literal("")])
    .optional(),
  // Hard boundary matches the backend's own validate_family_member_count
  // exactly (0-50, same message) - the "friendly near 50" nudge is a
  // separate, softer inline hint rendered by the form UI as the value
  // approaches this ceiling, not a second validation rule here.
  family_member_count: z.coerce
    .number()
    .int("Enter a whole number.")
    .min(0, "Can't be negative.")
    .max(50, "Family member count seems unusually high. Please double check.")
    .optional(),
  notes: z.string().trim().max(255, "Notes must be 255 characters or fewer.").optional(),
});

// z.coerce.number() means the schema's INPUT type (what the raw, unparsed
// form field values look like - number input elements) differs from its
// OUTPUT type (what comes out after Zod coerces the string to a number).
// react-hook-form's useForm() needs both: GuestFormInput types the actual
// registered fields, GuestFormValues (the output/z.infer type) types what
// onSubmit receives after zodResolver runs. Using only one or the other
// here produces a real TS error against the installed resolver version,
// not just a style preference.
export type GuestFormValues = z.infer<typeof guestSchema>;
export type GuestFormInput = z.input<typeof guestSchema>;
