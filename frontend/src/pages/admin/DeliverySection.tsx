import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { listDeliveryPartners } from "@/services/adminDeliveryPartnerService";
import {
  getShipmentByOrder,
  createShipment,
  assignShipment,
  updateShipmentStatus,
  rescheduleShipment,
  sendDeliveryOtp,
  verifyDeliveryOtp,
} from "@/services/adminDeliveryPartnerService";

/** Only forward transitions the backend actually allows — kept in sync with delivery.service.ts's ALLOWED_TRANSITIONS so the buttons shown here never trigger a 400. */
const NEXT_STATUS: Record<string, string[]> = {
  pending: ["ready_for_dispatch", "assigned"],
  ready_for_dispatch: ["assigned", "dispatched"],
  assigned: ["dispatched"],
  dispatched: ["in_transit", "out_for_delivery"],
  in_transit: ["out_for_delivery"],
  out_for_delivery: ["delivery_attempted"],
  delivery_attempted: ["failed"],
  rescheduled: ["out_for_delivery"],
  failed: [],
  delivered: [],
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  ready_for_dispatch: "Ready for Dispatch",
  assigned: "Assigned",
  dispatched: "Dispatched",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery",
  delivery_attempted: "Delivery Attempted",
  rescheduled: "Rescheduled",
  delivered: "Delivered",
  failed: "Failed",
};

export function DeliverySection({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const [partnerId, setPartnerId] = useState("");
  const [otpIdentifier, setOtpIdentifier] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleReason, setRescheduleReason] = useState("");

  const { data: shipment, isLoading } = useQuery({
    queryKey: ["admin-shipment", orderId],
    queryFn: () => getShipmentByOrder(orderId).catch(() => null),
  });

  const { data: partnersData } = useQuery({
    queryKey: ["admin-delivery-partners", "active-for-assign"],
    queryFn: () => listDeliveryPartners({ status: "active" }),
  });
  const partners = partnersData?.items ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-shipment", orderId] });

  const createMutation = useMutation({
    mutationFn: () => createShipment({ orderId }),
    onSuccess: () => { invalidate(); toast.success("Shipment created — ready for dispatch"); },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create shipment"),
  });

  const assignMutation = useMutation({
    mutationFn: (deliveryPartnerId: string) => assignShipment(shipment!.id, deliveryPartnerId),
    onSuccess: () => { invalidate(); toast.success("Delivery partner assigned"); },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to assign delivery partner"),
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => updateShipmentStatus(shipment!.id, status),
    onSuccess: () => { invalidate(); toast.success("Delivery status updated"); },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update status"),
  });

  const rescheduleMutation = useMutation({
    mutationFn: () => rescheduleShipment(shipment!.id, rescheduleDate, rescheduleReason),
    onSuccess: () => { invalidate(); toast.success("Delivery rescheduled"); setRescheduleDate(""); setRescheduleReason(""); },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to reschedule"),
  });

  const sendOtpMutation = useMutation({
    mutationFn: () => sendDeliveryOtp(shipment!.id, otpIdentifier),
    onSuccess: () => { setOtpSent(true); toast.success("OTP sent to recipient"); },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to send OTP — see note below"),
  });

  const verifyOtpMutation = useMutation({
    mutationFn: () => verifyDeliveryOtp(shipment!.id, otpIdentifier, otpCode),
    onSuccess: () => { invalidate(); toast.success("Delivery confirmed"); setOtpCode(""); setOtpSent(false); },
    onError: (err) => toast.error(err instanceof Error ? err.message : "OTP verification failed"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading delivery status…
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="space-y-3 border-t border-border pt-4">
        <p className="flex items-center gap-2 text-sm font-semibold"><Truck className="h-4 w-4" /> Delivery</p>
        <p className="text-xs text-muted-foreground">No shipment created yet for this order.</p>
        <Button size="sm" disabled={createMutation.isPending} onClick={() => createMutation.mutate()}>
          {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Shipment"}
        </Button>
      </div>
    );
  }

  const nextStatuses = NEXT_STATUS[shipment.status] ?? [];
  const canSendOtp = ["out_for_delivery", "rescheduled", "delivery_attempted"].includes(shipment.status);
  const canReschedule = ["delivery_attempted", "failed"].includes(shipment.status);

  return (
    <div className="space-y-4 border-t border-border pt-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold"><Truck className="h-4 w-4" /> Delivery</p>
        <Badge variant="secondary">{STATUS_LABEL[shipment.status] ?? shipment.status}</Badge>
      </div>

      <div className="flex gap-2">
        <Select value={partnerId || shipment.deliveryPartnerId || ""} onValueChange={setPartnerId}>
          <SelectTrigger className="flex-1"><SelectValue placeholder="Assign delivery partner" /></SelectTrigger>
          <SelectContent>
            {partners.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.fullName} · {p.mobile}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm"
          disabled={!partnerId || assignMutation.isPending}
          onClick={() => assignMutation.mutate(partnerId)}
        >
          {shipment.deliveryPartnerId ? "Reassign" : "Assign"}
        </Button>
      </div>

      {nextStatuses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {nextStatuses.map((s) => (
            <Button key={s} size="sm" variant="outline" disabled={statusMutation.isPending} onClick={() => statusMutation.mutate(s)}>
              Mark {STATUS_LABEL[s]}
            </Button>
          ))}
        </div>
      )}

      {canReschedule && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <p className="text-xs font-medium">Reschedule delivery</p>
          <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
          <Input placeholder="Reason" value={rescheduleReason} onChange={(e) => setRescheduleReason(e.target.value)} />
          <Button
            size="sm"
            variant="outline"
            disabled={!rescheduleDate || !rescheduleReason.trim() || rescheduleMutation.isPending}
            onClick={() => rescheduleMutation.mutate()}
          >
            Reschedule
          </Button>
        </div>
      )}

      {canSendOtp && (
        <div className="space-y-2 rounded-lg border border-border p-3">
          <p className="text-xs font-medium">Delivery confirmation (OTP)</p>
          <p className="text-xs text-muted-foreground">
            Sends a one-time code the recipient must share to mark this Delivered. Email only for now — no SMS gateway is configured in this project yet.
          </p>
          <div>
            <Label className="text-xs">Recipient email</Label>
            <Input type="email" value={otpIdentifier} onChange={(e) => setOtpIdentifier(e.target.value)} placeholder="recipient@school.edu" />
          </div>
          <Button size="sm" variant="outline" disabled={!otpIdentifier || sendOtpMutation.isPending} onClick={() => sendOtpMutation.mutate()}>
            {sendOtpMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send OTP"}
          </Button>
          {otpSent && (
            <>
              <div>
                <Label className="text-xs">OTP entered by recipient</Label>
                <Input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} maxLength={10} />
              </div>
              <Button
                size="sm"
                disabled={!otpCode || verifyOtpMutation.isPending}
                onClick={() => verifyOtpMutation.mutate()}
              >
                {verifyOtpMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Mark Delivered"}
              </Button>
            </>
          )}
        </div>
      )}

      {shipment.recipientName && (
        <p className="text-xs text-muted-foreground">Delivered to: {shipment.recipientName} ({shipment.recipientPhone ?? "—"})</p>
      )}

      {shipment.deliveryUpdates && shipment.deliveryUpdates.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium">Delivery Timeline</p>
          <ol className="space-y-2 text-xs text-muted-foreground">
            {shipment.deliveryUpdates.map((u) => (
              <li key={u.id} className="flex justify-between gap-2">
                <span>{u.message || (u.newStatus ? `Status → ${STATUS_LABEL[u.newStatus] ?? u.newStatus}` : u.updateType)}</span>
                <span>{formatDate(u.createdAt)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
