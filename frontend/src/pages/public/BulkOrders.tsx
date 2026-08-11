import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { Navigate, useLocation } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { UploadCloud, FileSpreadsheet, X, Plus, Trash2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { listProducts } from "@/services/productService";
import { createQuotationRequest } from "@/services/quotationService";
import { formatCurrency } from "@/lib/utils";

interface BulkLine {
  id: string;
  productId: string;
  qty: number;
}

export default function BulkOrders() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const location = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [lines, setLines] = useState<BulkLine[]>([]);

  const { data: catalog, isLoading: catalogLoading } = useQuery({
    queryKey: ["products", "bulk-order-catalog"],
    queryFn: () => listProducts({ limit: 100 }),
    enabled: isAuthenticated && user?.userType === "school",
  });
  const products = catalog?.items ?? [];

  const submitMutation = useMutation({
    mutationFn: () =>
      createQuotationRequest({
        title: "Bulk order request",
        notes: file ? `Uploaded sheet: ${file.name}` : undefined,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.qty })),
      }),
    onSuccess: (request) => {
      toast.success(`Bulk order request ${request.requestNumber} submitted — our team will confirm dealer allocation shortly.`);
      setLines(products.length > 0 ? [{ id: crypto.randomUUID(), productId: products[0].id, qty: products[0].minOrderQty }] : []);
      setFile(null);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Couldn't submit your bulk order request");
    },
  });

  const onDrop = useCallback(
    (accepted: File[]) => {
      const csvFile = accepted[0];
      if (!csvFile) return;
      setFile(csvFile);
      Papa.parse<Record<string, string>>(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const matched: BulkLine[] = [];
          let unmatchedCount = 0;
          for (const row of result.data) {
            const sku = (row.sku ?? row.SKU ?? row.Sku ?? "").trim();
            const qtyRaw = row.quantity ?? row.qty ?? row.Quantity ?? row.Qty ?? "";
            const qty = parseInt(qtyRaw, 10);
            const product = products.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
            if (product && qty > 0) {
              matched.push({ id: crypto.randomUUID(), productId: product.id, qty: Math.max(qty, product.minOrderQty) });
            } else {
              unmatchedCount += 1;
            }
          }
          if (matched.length > 0) {
            setLines((prev) => [...prev, ...matched]);
            toast.success(`Matched ${matched.length} line item${matched.length === 1 ? "" : "s"} from ${csvFile.name}`);
          }
          if (unmatchedCount > 0) {
            toast.error(`${unmatchedCount} row(s) couldn't be matched — check the "sku" and "quantity" columns`);
          }
        },
        error: () => toast.error("Couldn't read that file — please upload a valid CSV"),
      });
    },
    [products],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
  });

  function addLine() {
    if (products.length === 0) return;
    setLines((prev) => [...prev, { id: crypto.randomUUID(), productId: products[0].id, qty: products[0].minOrderQty }]);
  }

  function updateLine(id: string, patch: Partial<BulkLine>) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  const total = lines.reduce((sum, l) => {
    const product = products.find((p) => p.id === l.productId);
    return sum + (product ? product.price * l.qty : 0);
  }, 0);

  if (authLoading) {
    return (
      <div className="container py-10">
        <Skeleton className="h-8 w-64" />
      </div>
    );
  }

  if (!isAuthenticated || user?.userType !== "school") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Procurement</p>
        <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Bulk Orders</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Upload a CSV of required items (columns: <code>sku</code>, <code>quantity</code>), or build your
          order line by line below. Our team will match the best available dealer pricing for your school.
        </p>
      </div>

      <Card className="p-6">
        <p className="mb-3 text-sm font-semibold">Upload Order Sheet</p>
        <div
          {...getRootProps()}
          className={`flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="h-8 w-8 text-primary" />
          <p className="text-sm font-medium">Drag & drop a CSV file here, or click to browse</p>
          <p className="text-xs text-muted-foreground">Columns: sku, quantity — max 1 file</p>
        </div>

        {file && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-border p-3">
            <span className="flex items-center gap-2.5 text-sm">
              <FileSpreadsheet className="h-4 w-4 text-primary" /> {file.name}
            </span>
            <button onClick={() => setFile(null)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label="Remove file">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </Card>

      <Card className="mt-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold">Or Build Your Order Manually</p>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={addLine} disabled={catalogLoading}>
            <Plus className="h-3.5 w-3.5" /> Add Line
          </Button>
        </div>

        {catalogLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : lines.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add a line item or upload a sheet to get started.</p>
        ) : (
          <div className="space-y-3">
            {lines.map((line) => {
              const product = products.find((p) => p.id === line.productId);
              return (
                <div key={line.id} className="grid grid-cols-1 gap-3 rounded-xl border border-border p-3 sm:grid-cols-[1fr_140px_120px_40px] sm:items-end">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Product</Label>
                    <Select value={line.productId} onValueChange={(v) => updateLine(line.id, { productId: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Quantity</Label>
                    <Input
                      type="number"
                      min={product?.minOrderQty ?? 1}
                      value={line.qty}
                      onChange={(e) => updateLine(line.id, { qty: Math.max(product?.minOrderQty ?? 1, Number(e.target.value)) })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Line Total</Label>
                    <p className="flex h-11 items-center text-sm font-semibold">
                      {formatCurrency((product?.price ?? 0) * line.qty)}
                    </p>
                  </div>
                  <button
                    onClick={() => removeLine(line.id)}
                    disabled={lines.length === 1}
                    className="flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:pointer-events-none disabled:opacity-30"
                    aria-label="Remove line"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex flex-col items-end gap-4 border-t border-border pt-5 sm:flex-row sm:justify-between sm:items-center">
          <p className="text-sm text-muted-foreground">
            Estimated Total: <span className="font-display text-lg font-semibold text-primary">{formatCurrency(total)}</span>
          </p>
          <Button
            size="lg"
            className="gap-2"
            onClick={() => submitMutation.mutate()}
            disabled={lines.length === 0 || submitMutation.isPending}
          >
            <Send className="h-4 w-4" /> Submit Bulk Order Request
          </Button>
        </div>
      </Card>
    </div>
  );
}

