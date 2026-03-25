// components/CredentialSelector.tsx
"use client";

import { useEffect, useState } from "react";
import { KeyRound, Plus, Trash2, ChevronDown, Loader2 } from "lucide-react";
import { createCredential, deleteCredential, fetchCredentials } from "@/actions/actions";

type Credential = { id: string; name: string; service: string };

const SERVICE_FIELDS: Record<string, { key: string; label: string; placeholder: string; type?: string }[]> = {
  telegram: [
    { key: "bot_token", label: "Bot Token", placeholder: "8489443586:AAGlW4lf..." },
  ],
  groq: [
    { key: "api_key", label: "API Key", placeholder: "gsk_..." },
  ],
  gemini: [
    { key: "api_key", label: "API Key", placeholder: "AIzaSy..." },
  ],
  gmail: [
    { key: "smtp_email", label: "Gmail Address", placeholder: "you@gmail.com" },
    { key: "smtp_password", label: "App Password", placeholder: "xxxx xxxx xxxx xxxx", type: "password" },
  ],
};

type Props = {
  service: string;
  selectedId: string;
  onSelect: (id: string) => void;
};

export function CredentialSelector({ service, selectedId, onSelect }: Props) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFields, setNewFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fields = SERVICE_FIELDS[service] || [];

  const load = async () => {
    setLoading(true);
    const res = await fetchCredentials({ service });
    if (res.success && res.data.data) {
      setCredentials(res.data.data);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [service]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const res = await createCredential({ name: newName, service, data: newFields });
    if (res.success && res.data.data) {
      const created = res.data.data;
      setCredentials((prev) => [...prev, created]);
      onSelect(created.id);
      setShowCreate(false);
      setNewName("");
      setNewFields({});
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    await deleteCredential({ id });
    setCredentials((prev) => prev.filter((c) => c.id !== id));
    if (selectedId === id) onSelect("");
    setDeleting(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1.5">
          <KeyRound className="h-3 w-3" /> Credential
        </label>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
        >
          <Plus className="h-3 w-3" />
          New
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading...
        </div>
      ) : (
        <div className="space-y-1.5">
          {credentials.length === 0 && !showCreate && (
            <div className="rounded-lg border border-dashed border-white/10 p-3 text-center text-[10px] text-gray-500">
              No credentials yet. Click New to add one.
            </div>
          )}

          {credentials.map((cred) => (
            <div
              key={cred.id}
              onClick={() => onSelect(cred.id)}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 cursor-pointer transition-all ${
                selectedId === cred.id
                  ? "border-indigo-500 bg-indigo-500/10 text-white"
                  : "border-white/10 bg-[#121216] text-gray-400 hover:border-white/20"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${selectedId === cred.id ? "bg-indigo-400" : "bg-gray-600"}`} />
                <span className="text-xs font-medium">{cred.name}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(cred.id); }}
                className="text-gray-600 hover:text-red-400 transition-colors p-0.5"
              >
                {deleting === cred.id
                  ? <Loader2 className="h-3 w-3 animate-spin" />
                  : <Trash2 className="h-3 w-3" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="rounded-xl border border-white/10 bg-[#121216]/80 p-4 space-y-3 animate-in fade-in slide-in-from-top-1">
          <input
            className="w-full rounded-md border border-white/10 bg-[#0a0a0c] px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            placeholder="Credential name (e.g. My Telegram Bot)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          {fields.map((f) => (
            <div key={f.key} className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 uppercase">{f.label}</label>
              <input
                type={f.type || "text"}
                className="w-full rounded-md border border-white/10 bg-[#0a0a0c] px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder={f.placeholder}
                value={newFields[f.key] || ""}
                onChange={(e) => setNewFields((prev) => ({ ...prev, [f.key]: e.target.value }))}
              />
            </div>
          ))}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-md bg-indigo-600 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3 w-3 animate-spin" />}
              Save
            </button>
            <button
              onClick={() => setShowCreate(false)}
              className="rounded-md border border-white/10 px-3 py-2 text-xs text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}