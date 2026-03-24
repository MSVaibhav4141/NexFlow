// app/form/[formId]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";

type FormElement = { label: string; type: string };
type FormSchema = {
  form_id: string;
  form_title: string;
  form_description: string;
  form_elements: FormElement[];
};

export default function PublicFormPage() {
  const { formId } = useParams<{ formId: string }>();
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8084";

  useEffect(() => {
    fetch(`${backendUrl}/api/v0/execution/form/${formId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Form not found");
        return r.json();
      })
      .then((data) => {
        setSchema(data);
        // Pre-populate empty values keyed by label
        const initial: Record<string, string> = {};
        data.form_elements.forEach((el: FormElement) => {
          initial[el.label] = "";
        });
        setValues(initial);
      })
      .catch(() => setError("This form doesn't exist or has been removed."))
      .finally(() => setLoading(false));
  }, [formId]);

  const handleSubmit = async () => {
    if (!schema) return;
    setSubmitting(true);
    try {
      const res = await fetch(
        `${backendUrl}/api/v0/execution/form/${formId}/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        }
      );
      if (!res.ok) throw new Error("Submission failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !schema) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c]">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c]">
        <div className="text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto" />
          <h1 className="text-xl font-bold text-white">Submitted!</h1>
          <p className="text-sm text-gray-400">Your response has been recorded.</p>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0c] p-6">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#121216] p-8 shadow-2xl space-y-6">
        
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-white">
            {schema.form_title || "Untitled Form"}
          </h1>
          {schema.form_description && (
            <p className="text-sm text-gray-400">{schema.form_description}</p>
          )}
        </div>

        {/* Fields */}
        <div className="space-y-5">
          {schema.form_elements.map((el, i) => (
            <div key={i} className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase">
                {el.label}
              </label>

              {el.type === "textarea" ? (
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] px-4 py-2.5 text-sm text-white resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={values[el.label] || ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [el.label]: e.target.value }))
                  }
                />
              ) : (
                <input
                  type={el.type || "text"}
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a0c] px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  value={values[el.label] || ""}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, [el.label]: e.target.value }))
                  }
                />
              )}
            </div>
          ))}
        </div>

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}