import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { ContactImportRow } from "@/types/guest.types";
import type { GuestCategory } from "@/types/guest.types";

interface ContactImportReviewTableProps {
  rows: ContactImportRow[];
  categories: GuestCategory[];
  onChange: (localId: string, field: keyof ContactImportRow, value: string | number | null) => void;
  onRemove: (localId: string) => void;
}

/**
 * Editable table for reviewing contacts picked from the phone before
 * submitting the bulk import. Every field here maps 1:1 to
 * ContactImportRowSerializer on the backend - name/mobile_number are
 * required, email/category/family_member_count are optional per row.
 */
export default function ContactImportReviewTable({
  rows,
  categories,
  onChange,
  onRemove,
}: ContactImportReviewTableProps) {
  if (rows.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">
        No contacts selected yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <th className="px-3 py-2.5">Name</th>
            <th className="px-3 py-2.5">Mobile number</th>
            <th className="px-3 py-2.5">Email</th>
            <th className="px-3 py-2.5">Category</th>
            <th className="px-3 py-2.5">Guests</th>
            <th className="px-3 py-2.5" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.localId} className="border-b border-slate-50 last:border-0">
              <td className="px-3 py-2">
                <Input
                  value={row.name}
                  onChange={(e) => onChange(row.localId, "name", e.target.value)}
                  placeholder="Name"
                  className="h-10"
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  value={row.mobile_number}
                  onChange={(e) => onChange(row.localId, "mobile_number", e.target.value)}
                  placeholder="10-15 digits"
                  className="h-10"
                />
              </td>
              <td className="px-3 py-2">
                <Input
                  value={row.email}
                  onChange={(e) => onChange(row.localId, "email", e.target.value)}
                  placeholder="Optional"
                  type="email"
                  className="h-10"
                />
              </td>
              <td className="px-3 py-2">
                <Select
                  value={row.category ?? ""}
                  onChange={(e) =>
                    onChange(
                      row.localId,
                      "category",
                      e.target.value === "" ? null : Number(e.target.value)
                    )
                  }
                  className="h-10"
                >
                  <option value="">Uncategorized</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </td>
              <td className="px-3 py-2">
                <Input
                  type="number"
                  min={0}
                  max={50}
                  value={row.family_member_count}
                  onChange={(e) =>
                    onChange(row.localId, "family_member_count", Number(e.target.value))
                  }
                  className="h-10 w-20"
                />
              </td>
              <td className="px-3 py-2 text-right">
                <button
                  type="button"
                  onClick={() => onRemove(row.localId)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                  aria-label={`Remove ${row.name || "row"}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}