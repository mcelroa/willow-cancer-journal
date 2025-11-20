import { useEffect, useState } from "react";
import type { Entry } from "../types";
import { toISO, todayISO, clamp, formatDate } from "../types.ts";
import { useConfirm } from "../confirm";

export function JournalForm({
  initial,
  getByDate,
  savedAt,
  onSave,
  onClearEdit,
}: {
  initial?: Entry;
  getByDate: (date: string) => Entry | undefined;
  savedAt?: number;
  onSave: (e: Omit<Entry, "id" | "createdAt" | "updatedAt">) => void;
  onClearEdit?: () => void;
}) {
  const isEditing = Boolean(initial);
  const [date, setDate] = useState<string>(initial?.date ?? todayISO());
  const [mood, setMood] = useState<number>(initial?.mood ?? 1);
  const [pain, setPain] = useState<number>(initial?.pain ?? 0);
  const [fatigue, setFatigue] = useState<number>(initial?.fatigue ?? 0);
  const [nausea, setNausea] = useState<number>(initial?.nausea ?? 0);
  const [notes, setNotes] = useState<string>(initial?.notes ?? "");
  const [tags, setTags] = useState<string>((initial?.tags ?? []).join(", "));

  useEffect(() => {
    if (!initial) return;
    setDate(initial.date);
    setMood(initial.mood);
    setPain(initial.pain);
    setFatigue(initial.fatigue);
    setNausea(initial.nausea);
    setNotes(initial.notes ?? "");
    setTags((initial.tags ?? []).join(", "));
  }, [initial]);

  const confirm = useConfirm();
  const [showSaved, setShowSaved] = useState(false);
  useEffect(() => {
    if (savedAt) {
      setShowSaved(true);
      const t = window.setTimeout(() => setShowSaved(false), 3000);
      return () => window.clearTimeout(t);
    }
  }, [savedAt]);

  const resetFields = (nextDate: string) => {
    setDate(nextDate);
    setMood(1);
    setPain(0);
    setFatigue(0);
    setNausea(0);
    setNotes("");
    setTags("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      date,
      mood: clamp(mood, 1, 10),
      pain: clamp(pain, 0, 10),
      fatigue: clamp(fatigue, 0, 10),
      nausea: clamp(nausea, 0, 10),
      notes: notes.trim() || undefined,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
    const existing = getByDate(date);
    const isSame = existing && initial && existing.id === initial.id;
    if (existing && !isSame) {
      const ok = await confirm({
        message: `An entry for ${date} already exists. Overwrite it?`,
        confirmText: "Overwrite",
        cancelText: "Cancel",
        destructive: true,
      });
      if (!ok) return;
    }
    onSave(payload);
  };

  return (
    <form className={"card" + (isEditing ? " editing" : "")} onSubmit={submit}>
      {isEditing && initial && (
        <div className="mode-banner editing">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M4 20h4l10-10-4-4L4 16v4Zm12.5-11.5-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div className="mode-text">
            <strong>Editing entry</strong>
            <span className="muted">{formatDate(initial.date)}</span>
          </div>
          <button type="button" className="tab" onClick={onClearEdit} style={{marginLeft:'auto'}}>
            New entry
          </button>
        </div>
      )}
      <div className="grid">
        <Field label="Date">
          <input
            aria-label="Date"
            type="date"
            value={date}
            onChange={(e) => resetFields(e.target.value)}
            max={toISO(new Date())}
            required
          />
        </Field>
        <fieldset
          style={{
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: ".75rem",
          }}>
          <legend>Today's symptoms</legend>
          <div className="grid">
            <Field label={`Mood: ${mood}`} hint="1 (low) – 10 (high)">
              <input
                aria-label="Mood"
                type="range"
                min={1}
                max={10}
                value={mood}
                onChange={(e) => setMood(parseInt(e.target.value))}
              />
            </Field>
            <Field label={`Pain: ${pain}`} hint="0 (none) – 10 (severe)">
              <input
                aria-label="Pain"
                type="range"
                min={0}
                max={10}
                value={pain}
                onChange={(e) => setPain(parseInt(e.target.value))}
              />
            </Field>
            <Field label={`Fatigue: ${fatigue}`} hint="0 (none) – 10 (severe)">
              <input
                aria-label="Fatigue"
                type="range"
                min={0}
                max={10}
                value={fatigue}
                onChange={(e) => setFatigue(parseInt(e.target.value))}
              />
            </Field>
            <Field label={`Nausea: ${nausea}`} hint="0 (none) – 10 (severe)">
              <input
                aria-label="Nausea"
                type="range"
                min={0}
                max={10}
                value={nausea}
                onChange={(e) => setNausea(parseInt(e.target.value))}
              />
            </Field>
          </div>
        </fieldset>
      </div>
      <Field label="Notes">
        <textarea
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything notable today?"
        />
      </Field>
      <Field label="Tags" hint="Comma-separated (e.g., chemo, headache)">
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
      </Field>
      <div className="actions">
        {(() => {
          const existing = getByDate(date);
          const isSame = existing && initial && existing.id === initial.id;
          const overwrite = Boolean(existing && !isSame);
          let label = "Save Entry";
          let klass = "primary";
          if (isEditing && !overwrite) label = "Update Entry";
          if (overwrite) { label = "Overwrite Entry"; klass = "danger"; }
          return (
            <button type="submit" className={klass}>
              {label}
            </button>
          );
        })()}
      </div>
      {showSaved && (
        <div className="banner success" role="status" aria-live="polite">
          Entry saved
        </div>
      )}
      {(() => {
        const existing = getByDate(date);
        const isSame = existing && initial && existing.id === initial.id;
        if (!existing || isSame) return null;
        return (
          <div className="callout warning" role="note" aria-live="polite">
            <div className="callout-head">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 9v4m0 4h.01M12 3l9 18H3L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              <strong>Already logged</strong>
              <span className="muted">{formatDate(date)}</span>
            </div>
            <div className="callout-grid">
              <div>Mood: {existing.mood}</div>
              <div>Pain: {existing.pain}</div>
              <div>Fatigue: {existing.fatigue}</div>
              <div>Nausea: {existing.nausea}</div>
            </div>
            {existing.tags && existing.tags.length > 0 && (
              <div><strong>Tags:</strong> {existing.tags.join(", ")}</div>
            )}
            {existing.notes && (
              <div><strong>Notes:</strong> <em>{existing.notes}</em></div>
            )}
            <div className="callout-sep" />
            <div className="fine-print">Saving will overwrite the existing entry for this date.</div>
          </div>
        );
      })()}
    </form>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <div className="field-label">
        <span>{label}</span>
        {hint && <em>{hint}</em>}
      </div>
      {children}
    </label>
  );
}
