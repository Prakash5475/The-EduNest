import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate, useLocation } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { useAuth } from "@/context/AuthContext";
import { listCategoryNames } from "@/services/productService";
import { createQuotationRequest, type ApiQuotationRequest } from "@/services/quotationService";

const quotationSchema = z.object({
  category: z.string().min(1, "Select a category"),
  estimatedQty: z.coerce.number().int().positive("Enter a valid quantity"),
  requirements: z.string().min(10, "Please describe your requirements (min. 10 characters)"),
});

type QuotationForm = z.infer<typeof quotationSchema>;

export default function RequestQuotation() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const [submitted, setSubmitted] = useState<ApiQuotationRequest | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["categories", "names"],
    queryFn: listCategoryNames,
    staleTime: 5 * 60 * 1000,
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuotationForm>({ resolver: zodResolver(quotationSchema) });

  const submitMutation = useMutation({
    mutationFn: (values: QuotationForm) =>
      createQuotationRequest({
        title: `${values.category} — bulk quote`,
        notes: values.requirements,
        items: [
          {
            customItemDescription: `${values.category}: ${values.requirements}`,
            quantity: values.estimatedQty,
          },
        ],
      }),
    onSuccess: (request) => {
      setSubmitted(request);
      toast.success(`Quotation request ${request.requestNumber} submitted`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Couldn't submit your quotation request");
    },
  });

  if (authLoading) {
    return (
      <div className="container py-16">
        <p className="text-center text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated || user?.userType !== "school") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (submitted) {
    return (
      <div className="container flex flex-col items-center py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold">Quotation Request Received</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Reference <span className="font-semibold text-foreground">{submitted.requestNumber}</span> — our
          procurement team will compare pricing across partner dealers and send your best quote soon.
        </p>
        <Button
          className="mt-7"
          onClick={() => {
            setSubmitted(null);
            reset();
          }}
        >
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
          <form onSubmit={handleSubmit((v) => submitMutation.mutate(v))} className="space-y-5">
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
                <Input type="number" min={1} {...register("estimatedQty")} placeholder="e.g. 200" />
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

            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || submitMutation.isPending}>
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

