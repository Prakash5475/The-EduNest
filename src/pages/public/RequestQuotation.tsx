import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { categories } from "@/data/products";

const quotationSchema = z.object({
  schoolName: z.string().min(2, "School name is required"),
  contactName: z.string().min(2, "Contact person name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(10, "Enter a valid phone number").max(15),
  category: z.string().min(1, "Select a category"),
  estimatedQty: z.string().min(1, "Estimated quantity is required"),
  requirements: z.string().min(10, "Please describe your requirements (min. 10 characters)"),
});

type QuotationForm = z.infer<typeof quotationSchema>;

export default function RequestQuotation() {
  const [submitted, setSubmitted] = useState(false);
  const [quoteRef, setQuoteRef] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<QuotationForm>({ resolver: zodResolver(quotationSchema) });

  function onSubmit() {
    const ref = `QTN-2024-${String(Math.floor(10000 + Math.random() * 89999))}`;
    setQuoteRef(ref);
    setSubmitted(true);
    toast.success(`Quotation request ${ref} submitted`);
  }

  if (submitted) {
    return (
      <div className="container flex flex-col items-center py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold">Quotation Request Received</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Reference <span className="font-semibold text-foreground">{quoteRef}</span> — our procurement
          team will compare pricing across partner dealers and send your best quote within 24 hours.
        </p>
        <Button className="mt-7" onClick={() => setSubmitted(false)}>
          Submit Another Request
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileText className="h-6 w-6" />
          </span>
          <h1 className="mt-4 font-display text-2xl font-semibold sm:text-3xl">Request a Quotation</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tell us what your school needs — we'll compare pricing across our dealer network and get
            back to you with the best offer.
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField label="School Name" error={errors.schoolName?.message}>
                <Input {...register("schoolName")} placeholder="Greenfield Academy" />
              </FormField>
              <FormField label="Contact Person" error={errors.contactName?.message}>
                <Input {...register("contactName")} placeholder="Full name" />
              </FormField>
              <FormField label="Email Address" error={errors.email?.message}>
                <Input type="email" {...register("email")} placeholder="you@school.edu.in" />
              </FormField>
              <FormField label="Phone Number" error={errors.phone?.message}>
                <Input {...register("phone")} placeholder="+91 98765 43210" />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField label="Product Category" error={errors.category?.message}>
                <Select value={watch("category")} onValueChange={(v) => setValue("category", v)}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Estimated Quantity" error={errors.estimatedQty?.message}>
                <Input {...register("estimatedQty")} placeholder="e.g. 200 units" />
              </FormField>
            </div>

            <FormField label="Requirements" error={errors.requirements?.message}>
              <textarea
                {...register("requirements")}
                rows={4}
                placeholder="Describe the items, specifications, and delivery timeline you need..."
                className="flex w-full rounded-xl border border-input bg-card px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </FormField>

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
              Submit Quotation Request
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
