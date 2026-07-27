import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate, useNavigate } from "react-router-dom";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useState } from "react";
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
import { useCart } from "@/context/CartContext";
import { paths } from "@/routes/paths";
import { formatCurrency } from "@/lib/utils";

const checkoutSchema = z.object({
  schoolName: z.string().min(2, "School name is required"),
  contactName: z.string().min(2, "Contact person name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().min(10, "Enter a valid 10-digit phone number").max(15),
  addressLine1: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  paymentMethod: z.enum(["bank-transfer", "upi", "cheque", "cod"]),
  gstNumber: z.string().optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

const GST_PCT = 18;

export default function Checkout() {
  const { lines, subTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [placed, setPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { paymentMethod: "bank-transfer" },
  });

  const gst = (subTotal * GST_PCT) / 100;
  const total = subTotal + gst;

  function onSubmit() {
    const id = `ORD-2024-${String(Math.floor(1000 + Math.random() * 9000))}`;
    setOrderId(id);
    setPlaced(true);
    clearCart();
    toast.success(`Order ${id} placed successfully`);
  }

  if (lines.length === 0 && !placed) {
    return <Navigate to={paths.cart} replace />;
  }

  if (placed) {
    return (
      <div className="container flex flex-col items-center py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold">Order Placed Successfully!</h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Your order <span className="font-semibold text-foreground">{orderId}</span> has been received. Our
          team will confirm dealer allocation and share an invoice shortly.
        </p>
        <div className="mt-7 flex gap-3">
          <Button onClick={() => navigate(paths.shop)}>Continue Shopping</Button>
          <Button variant="outline" onClick={() => navigate(paths.home)}>Back to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10">
      <h1 className="mb-8 font-display text-2xl font-semibold sm:text-3xl">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="p-6">
            <p className="mb-4 text-sm font-semibold">School & Contact Details</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <FormField label="GST Number (optional)">
                <Input {...register("gstNumber")} placeholder="27ABCDE1234F1Z5" />
              </FormField>
            </div>
          </Card>

          <Card className="p-6">
            <p className="mb-4 text-sm font-semibold">Delivery Address</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FormField label="Address Line" error={errors.addressLine1?.message}>
                  <Input {...register("addressLine1")} placeholder="School street address" />
                </FormField>
              </div>
              <FormField label="City" error={errors.city?.message}>
                <Input {...register("city")} placeholder="Pune" />
              </FormField>
              <FormField label="State" error={errors.state?.message}>
                <Input {...register("state")} placeholder="Maharashtra" />
              </FormField>
              <FormField label="Pincode" error={errors.pincode?.message}>
                <Input {...register("pincode")} placeholder="411045" />
              </FormField>
            </div>
          </Card>

          <Card className="p-6">
            <p className="mb-4 text-sm font-semibold">Payment Method</p>
            <div className="space-y-1.5">
              <Select value={watch("paymentMethod")} onValueChange={(v) => setValue("paymentMethod", v as CheckoutForm["paymentMethod"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank-transfer">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="cod">Cash on Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Payment is collected only after order
              confirmation from our procurement team.
            </p>
          </Card>
        </div>

        <Card className="h-fit p-6">
          <p className="mb-4 font-display text-lg font-semibold">Order Summary</p>
          <div className="max-h-64 space-y-3 overflow-y-auto scrollbar-thin">
            {lines.map((line) => (
              <div key={line.productId} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{line.name} × {line.qty}</span>
                <span className="font-medium">{formatCurrency(line.qty * line.price)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Sub Total</span>
              <span>{formatCurrency(subTotal)}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>GST ({GST_PCT}%)</span>
              <span>{formatCurrency(gst)}</span>
            </div>
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>
          <Button type="submit" size="lg" className="mt-6 w-full" disabled={isSubmitting}>
            Place Order
          </Button>
        </Card>
      </form>
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
