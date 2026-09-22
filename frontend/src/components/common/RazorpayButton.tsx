import { useState } from "react";
import { toast } from "sonner";
import { CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initiatePayment, verifyPayment } from "@/services/paymentService";
import { useAuth } from "@/context/AuthContext";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = RAZORPAY_CHECKOUT_SRC;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface RazorpayButtonProps {
  orderId: string;
  amountType?: "advance" | "full" | "balance";
  label?: string;
  onSuccess?: () => void;
}

export function RazorpayButton({ orderId, amountType = "advance", label, onSuccess }: RazorpayButtonProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  async function handlePay() {
    setLoading(true);
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error("Couldn't load the payment gateway. Please try again.");
        return;
      }
      const payment = await initiatePayment(orderId, amountType);
      const rzp = new window.Razorpay!({
        key: payment.keyId,
        amount: Math.round(payment.amount * 100),
        currency: payment.currency,
        order_id: payment.razorpayOrderId,
        name: "The EduNest",
        description: `Order #${orderId} — ${payment.paymentType} payment`,
        prefill: { name: user?.fullName, email: user?.email, contact: user?.phone ?? undefined },
        theme: { color: "#F44336" },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await verifyPayment(payment.paymentId, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success("Payment successful");
            onSuccess?.();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Payment could not be verified");
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });
      rzp.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Online payment isn't available right now");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handlePay} disabled={loading} className="gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
      {label ?? "Pay Now"}
    </Button>
  );
}
