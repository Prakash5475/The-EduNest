import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, FileSpreadsheet, X, Plus, Trash2, Send } from "lucide-react";
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
import { products } from "@/data/products";
import { formatCurrency } from "@/lib/utils";

interface BulkLine {
  id: string;
  productId: string;
  qty: number;
}

export default function BulkOrders() {
  const [file, setFile] = useState<File | null>(null);
  const [lines, setLines] = useState<BulkLine[]>([
    { id: crypto.randomUUID(), productId: products[0].id, qty: products[0].minOrderQty },
  ]);

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setFile(accepted[0]);
      toast.success(`${accepted[0].name} uploaded — parsing line items…`);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"], "application/vnd.ms-excel": [".xls", ".xlsx"] },
    maxFiles: 1,
  });

  function addLine() {
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

  function handleSubmit() {
    toast.success("Bulk order request submitted. Our team will confirm dealer allocation shortly.");
    setLines([{ id: crypto.randomUUID(), productId: products[0].id, qty: products[0].minOrderQty }]);
    setFile(null);
  }

  return (
    <div className="container py-10">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Procurement</p>
        <h1 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">Bulk Orders</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Upload a spreadsheet of required items, or build your order line by line below. Our team
          will match the best available dealer pricing for your school.
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
          <p className="text-sm font-medium">Drag & drop a CSV or Excel file here, or click to browse</p>
          <p className="text-xs text-muted-foreground">Supported formats: .csv, .xls, .xlsx — max 1 file</p>
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
          <Button variant="outline" size="sm" className="gap-1.5" onClick={addLine}>
            <Plus className="h-3.5 w-3.5" /> Add Line
          </Button>
        </div>

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

        <div className="mt-6 flex flex-col items-end gap-4 border-t border-border pt-5 sm:flex-row sm:justify-between sm:items-center">
          <p className="text-sm text-muted-foreground">
            Estimated Total: <span className="font-display text-lg font-semibold text-primary">{formatCurrency(total)}</span>
          </p>
          <Button size="lg" className="gap-2" onClick={handleSubmit}>
            <Send className="h-4 w-4" /> Submit Bulk Order Request
          </Button>
        </div>
      </Card>
    </div>
  );
}
