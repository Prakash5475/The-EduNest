import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Camera, Plus, MapPin } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/common/StatusBadge";
import {
  getMyDealerAccount,
  updateMyDealerAccount,
  addDealerAddress,
} from "@/services/dealerAccountService";
import { initials } from "@/lib/utils";

export default function DealerProfile() {
  const queryClient = useQueryClient();
  const [showNewAddress, setShowNewAddress] = useState(false);

  const { data: dealer, isLoading } = useQuery({ queryKey: ["dealer", "me"], queryFn: getMyDealerAccount });

  const { register, handleSubmit, reset } = useForm<{ businessName: string; gstin: string; panNumber: string }>();

  useEffect(() => {
    if (dealer) {
      reset({ businessName: dealer.businessName, gstin: dealer.gstin ?? "", panNumber: dealer.panNumber ?? "" });
    }
  }, [dealer, reset]);

  const updateMutation = useMutation({
    mutationFn: updateMyDealerAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dealer", "me"] });
      toast.success("Profile updated successfully");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't update profile"),
  });

  const {
    register: registerAddress,
    handleSubmit: handleAddressSubmit,
    reset: resetAddressForm,
  } = useForm<{ addressLine1: string; addressLine2: string; city: string; state: string; country: string; pincode: string }>({
    defaultValues: { country: "India" },
  });

  const addAddressMutation = useMutation({
    mutationFn: (values: { addressLine1: string; addressLine2: string; city: string; state: string; country: string; pincode: string }) =>
      addDealerAddress({ ...values, addressType: "warehouse" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dealer", "me"] });
      setShowNewAddress(false);
      resetAddressForm();
      toast.success("Address added");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't add address"),
  });

  if (isLoading || !dealer) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Dealer Profile" description="Manage your business information and account details." />

      <form onSubmit={handleSubmit((values) => updateMutation.mutate(values))}>
        <Card className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-20 w-20">
                <AvatarImage src={dealer.logoFile?.filePath} alt={dealer.businessName} />
                <AvatarFallback className="text-lg">{initials(dealer.businessName)}</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" className="gap-1.5" type="button" disabled title="Logo upload coming soon">
                <Camera className="h-3.5 w-3.5" /> Change Logo
              </Button>
            </div>

            <div className="flex-1">
              <div className="mb-4 flex items-center gap-2">
                <p className="font-display text-xl font-semibold">{dealer.businessName}</p>
                <StatusBadge status={dealer.status} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Business Name</Label>
                  <Input {...register("businessName")} />
                </div>
                <div className="space-y-1.5">
                  <Label>Dealer Type</Label>
                  <Input value={dealer.businessType} disabled className="capitalize" />
                </div>
                <div className="space-y-1.5">
                  <Label>Dealer Code</Label>
                  <Input value={dealer.dealerCode} disabled />
                </div>
                <div className="space-y-1.5">
                  <Label>Average Rating</Label>
                  <Input value={`${Number(dealer.averageRating).toFixed(1)} / 5.0`} disabled />
                </div>
                <div className="space-y-1.5">
                  <Label>GST Number</Label>
                  <Input {...register("gstin")} />
                </div>
                <div className="space-y-1.5">
                  <Label>PAN Number</Label>
                  <Input {...register("panNumber")} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </Card>
      </form>

      <Card className="mt-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold">Addresses</p>
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => setShowNewAddress((v) => !v)}>
            <Plus className="h-3.5 w-3.5" /> Add New
          </Button>
        </div>

        {dealer.addresses.length === 0 && !showNewAddress ? (
          <p className="text-sm text-muted-foreground">No addresses saved yet.</p>
        ) : (
          <div className="space-y-2.5">
            {dealer.addresses.map((addr) => (
              <div key={addr.id} className="flex items-start justify-between gap-3 rounded-xl border border-border p-3.5 text-sm">
                <span>
                  <MapPin className="mb-1 inline h-3.5 w-3.5 text-primary" />{" "}
                  <span className="font-medium">{addr.addressLine1}</span>
                  {addr.addressLine2 && `, ${addr.addressLine2}`}
                  <br />
                  <span className="text-muted-foreground">
                    {addr.city}, {addr.state} {addr.pincode}, {addr.country}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}

        {showNewAddress && (
          <form
            className="mt-4 grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2"
            onSubmit={handleAddressSubmit((values) => addAddressMutation.mutate(values))}
          >
            <div className="sm:col-span-2">
              <Label>Address Line 1</Label>
              <Input {...registerAddress("addressLine1", { required: true })} />
            </div>
            <div>
              <Label>City</Label>
              <Input {...registerAddress("city", { required: true })} />
            </div>
            <div>
              <Label>State</Label>
              <Input {...registerAddress("state", { required: true })} />
            </div>
            <div>
              <Label>Pincode</Label>
              <Input {...registerAddress("pincode", { required: true })} />
            </div>
            <div>
              <Label>Country</Label>
              <Input {...registerAddress("country")} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" size="sm" disabled={addAddressMutation.isPending}>
                Save Address
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

