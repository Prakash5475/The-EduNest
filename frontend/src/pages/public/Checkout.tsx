import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navigate, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, ShieldCheck, Plus, MapPin, Loader2 } from "lucide-react";
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
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { paths } from "@/routes/paths";
import { formatCurrency } from "@/lib/utils";
import {
  listAddresses,
  createAddress,
  listShippingMethods,
  submitCheckout,
  type ApiOrder,
} from "@/services/checkoutService";
import { RazorpayButton } from "@/components/common/RazorpayButton";

const GST_PCT = 18;

const addressSchema = z.object({
  addressLine1: z.string().min(5, "Address is required"),
  addressLine2: z.string().optional(),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  country: z.string().min(2, "Country is required"),
  pincode: z.string().regex(/^\d{4,12}$/, "Enter a valid postal code"),
});
type AddressForm = z.infer<typeof addressSchema>;

export default function Checkout() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const { lines, subTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [placedOrder, setPlacedOrder] = useState<ApiOrder | null>(null);
  const [paid, setPaid] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null);
  const [showNewAddress, setShowNewAddress] = useState(false);

  const { data: addresses = [], isLoading: addressesLoading } = useQuery({
    queryKey: ["addresses"],
    queryFn: listAddresses,
    enabled: isAuthenticated && user?.userType === "school",
  });

  const { data: shippingMethods = [], isLoading: shippingLoading } = useQuery({
    queryKey: ["shipping-methods"],
    queryFn: listShippingMethods,
    enabled: isAuthenticated && user?.userType === "school",
  });

  const addAddressMutation = useMutation({
    mutationFn: (input: AddressForm) => createAddress({ ...input, addressType: "shipping" }),
    onSuccess: (address) => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setSelectedAddressId(address.id);
      setShowNewAddress(false);
      toast.success("Address saved");
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: submitCheckout,
    onSuccess: (order) => {
      setPlacedOrder(order);
      clearCart();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Couldn't place order");
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressForm>({ resolver: zodResolver(addressSchema), defaultValues: { country: "India" } });

  const gst = (subTotal * GST_PCT) / 100;
  const total = subTotal + gst;

  const activeShipping = shippingMethods.find((m) => m.id === selectedShippingId);
  const grandTotal = total + Number(activeShipping?.rate ?? 0);

  if (authLoading) {
    return (
      <div className="container space-y-4 py-16">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!isAuthenticated || user?.userType !== "school") {
    return <Navigate to="/login" replace state={{ from: paths.checkout }} />;
  }

  if (lines.length === 0 && !placedOrder) {
    return <Navigate to={paths.cart} replace />;
  }

  if (placedOrder) {
    return (
      <div className="container flex flex-col items-center py-20 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-semibold">
          {paid ? "Payment Successful!" : "Order Placed — Advance Payment Pending"}
        </h1>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Your order <span className="font-semibold text-foreground">{placedOrder.orderNumber}</span> has been
          created. {paid ? "Our team will confirm dealer allocation and share an invoice shortly." : "Pay the advance now to confirm it."}
        </p>

        {!paid && (
          <div className="mt-6">
            <RazorpayButton
              orderId={placedOrder.id}
              amountType="advance"
              label="Pay Advance Now"
              onSuccess={() => setPaid(true)}
            />
          </div>
        )}

        <div className="mt-7 flex gap-3">
          <Button onClick={() => navigate(paths.shop)}>Continue Shopping</Button>
          <Button variant="outline" onClick={() => navigate(paths.home)}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  function handlePlaceOrder() {
    if (!selectedAddressId) {
      toast.error("Please select or add a delivery address");
      return;
    }
    if (!selectedShippingId) {
      toast.error("Please select a delivery method");
      return;
    }
    checkoutMutation.mutate({
      billingAddressId: selectedAddressId,
      shippingAddressId: selectedAddressId,
      shippingMethodId: selectedShippingId,
    });
  }

  return (
    <div className="container py-10">
      <h1 className="mb-8 font-display text-2xl font-semibold sm:text-3xl">Checkout</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold">Delivery Address</p>
              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setShowNewAddress((v) => !v)}>
                <Plus className="h-3.5 w-3.5" /> Add New
              </Button>
            </div>

            {addressesLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : addresses.length === 0 && !showNewAddress ? (
              <p className="text-sm text-muted-foreground">
                No saved addresses yet. Click &quot;Add New&quot; to add your first delivery address.
              </p>
            ) : (
              <div className="space-y-2.5">
                {addresses.map((addr) => (
                  <label
                    key={addr.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-sm transition-colors ${
                      selectedAddressId === addr.id ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      className="mt-1"
                      checked={selectedAddressId === addr.id}
                      onChange={() => setSelectedAddressId(addr.id)}
                    />
                    <span>
                      <MapPin className="mb-1 inline h-3.5 w-3.5 text-primary" />{" "}
                      <span className="font-medium">{addr.addressLine1}</span>
                      {addr.addressLine2 && `, ${addr.addressLine2}`}
                      <br />
                      <span className="text-muted-foreground">
                        {addr.city}, {addr.state} {addr.pincode}, {addr.country}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}

            {showNewAddress && (
              <form
                className="mt-4 grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2"
                onSubmit={handleSubmit((values) => addAddressMutation.mutate(values))}
              >
                <div className="sm:col-span-2">
                  <Label>Address Line 1</Label>
                  <Input {...register("addressLine1")} placeholder="School street address" />
                  {errors.addressLine1 && <p className="text-xs text-destructive">{errors.addressLine1.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <Label>Address Line 2 (optional)</Label>
                  <Input {...register("addressLine2")} />
                </div>
                <div>
                  <Label>City</Label>
                  <Input {...register("city")} placeholder="Pune" />
                  {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
                </div>
                <div>
                  <Label>State</Label>
                  <Input {...register("state")} placeholder="Maharashtra" />
                  {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
                </div>
                <div>
                  <Label>Pincode</Label>
                  <Input {...register("pincode")} placeholder="411045" />
                  {errors.pincode && <p className="text-xs text-destructive">{errors.pincode.message}</p>}
                </div>
                <div>
                  <Label>Country</Label>
                  <Input {...register("country")} />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit" disabled={isSubmitting || addAddressMutation.isPending} className="gap-2">
                    {addAddressMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save Address
                  </Button>
                </div>
              </form>
            )}
          </Card>

          <Card className="p-6">
            <p className="mb-4 text-sm font-semibold">Delivery Method</p>
            {shippingLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={selectedShippingId ?? undefined} onValueChange={setSelectedShippingId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a delivery method" />
                </SelectTrigger>
                <SelectContent>
                  {shippingMethods.map((method) => (
                    <SelectItem key={method.id} value={method.id}>
                      {method.name} — {formatCurrency(Number(method.rate))} ({method.estimatedDaysMin}-
                      {method.estimatedDaysMax} days)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" /> A 50% advance payment confirms your order;
              the remaining balance is collected before dispatch.
            </p>
          </Card>
        </div>

        <Card className="h-fit p-6">
          <p className="mb-4 font-display text-lg font-semibold">Order Summary</p>
          <div className="max-h-64 space-y-3 overflow-y-auto scrollbar-thin">
            {lines.map((line) => (
              <div key={line.productId} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {line.name} × {line.qty}
                </span>
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
            {activeShipping && (
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{formatCurrency(Number(activeShipping.rate))}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(grandTotal)}</span>
            </div>
          </div>
          <Button
            size="lg"
            className="mt-6 w-full"
            disabled={checkoutMutation.isPending}
            onClick={handlePlaceOrder}
          >
            {checkoutMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Place Order
          </Button>
        </Card>
      </div>
    </div>
  );
}

