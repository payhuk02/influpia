"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";

export type FormField = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "select" | "datetime-local" | "number" | "hidden";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: string;
};

type FormModalProps = {
  label: string;
  title: string;
  description?: string;
  fields: FormField[];
  submitLabel?: string;
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  variant?: "default" | "outline";
  size?: "default" | "sm";
  className?: string;
  icon?: ReactNode;
};

export function FormModal({
  label,
  title,
  description,
  fields,
  submitLabel = "Créer",
  action,
  variant = "default",
  size = "default",
  className,
  icon,
}: FormModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const result = await action(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Créé avec succès");
        setOpen(false);
        router.refresh();
      }
    } catch {
      toast.error("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        size={size}
        variant={variant === "outline" ? "outline" : "default"}
        className={
          variant === "default"
            ? `bg-primary hover:bg-primary/90 ${className ?? ""}`
            : className
        }
        onClick={() => setOpen(true)}
      >
        {icon ?? <Plus className="w-4 h-4 mr-2" />}
        {label}
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => !loading && setOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#0b0b0f] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-1">{title}</h2>
            {description && <p className="text-sm text-white/50 mb-6">{description}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map((field) =>
                field.type === "hidden" ? (
                  <input key={field.name} type="hidden" name={field.name} defaultValue={field.defaultValue} />
                ) : (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={field.name}>{field.label}</Label>
                  {field.type === "textarea" ? (
                    <textarea
                      id={field.name}
                      name={field.name}
                      required={field.required}
                      placeholder={field.placeholder}
                      defaultValue={field.defaultValue}
                      rows={3}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-primary/50"
                    />
                  ) : field.type === "select" ? (
                    <select
                      id={field.name}
                      name={field.name}
                      required={field.required}
                      defaultValue={field.defaultValue ?? ""}
                      className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm text-white outline-none focus:border-primary/50"
                    >
                      <option value="" disabled>
                        Sélectionner…
                      </option>
                      {field.options?.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-black">
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={field.name}
                      name={field.name}
                      type={field.type ?? "text"}
                      required={field.required}
                      placeholder={field.placeholder}
                      defaultValue={field.defaultValue}
                      className="bg-white/5 border-white/10"
                    />
                  )}
                </div>
                )
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-white/10"
                  disabled={loading}
                  onClick={() => setOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : submitLabel}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
