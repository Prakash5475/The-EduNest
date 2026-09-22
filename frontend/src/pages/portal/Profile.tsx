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
import { useAuth } from "@/context/AuthContext";
import { getMySchoolAccount, updateMySchoolAccount, type SchoolAccountUpdateInput } from "@/services/schoolAccountService";
import { listAddresses, createAddress, type AddressInput } from "@/services/checkoutService";
import { initials } from "@/lib/utils";

export default function Profile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showNewAddress, setShowNewAddress] = useState(false);

  const { data: school, isLoading } = useQuery({
    queryKey: ["school", "me"],
    queryFn: getMySchoolAccount,
  });

  const { data: addresses = [] } = useQuery({
    queryKey: ["addresses"],
    queryFn: listAddresses,
  });

  const { register, handleSubmit, reset } = useForm<SchoolAccountUpdateInput>();

  useEffect(() => {
    if (school) {
      reset({
        schoolName: school.schoolName,
        boardAffiliation: school.boardAffiliation ?? "",
        registrationNumber: school.registrationNumber ?? "",
        gstin: school.gstin ?? "",
        contactEmail: school.schoolProfile?.contactEmail ?? user?.email ?? "",
        contactPhone: school.schoolProfile?.contactPhone ?? "",
        studentCount: school.schoolProfile?.studentCount ?? undefined,
        teacherCount: school.schoolProfile?.teacherCount ?? undefined,
      });
    }
  }, [school, user, reset]);

  const updateMutation = useMutation({
    mutationFn: updateMySchoolAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school", "me"] });
      toast.success("Profile updated successfully");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Couldn't update your profile"),
  });

  const {
    register: registerAddress,
    handleSubmit: handleAddressSubmit,
    reset: resetAddressForm,
  } = useForm<Omit<AddressInput, "addressType">>({ defaultValues: { country: "India" } });

  const addAddressMutation = useMutation({
    mutationFn: (values: Omit<AddressInput, "addressType">) => createAddress({ ...values, addressType: "registered" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
      setShowNewAddress(false);
      resetAddressForm();
      toast.success("Address added");
    },
  });

  if (isLoading || !school) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="School Profile" description="Manage your school's information and account details." />

      <form onSubmit={handleSubmit((values) => updateMutation.mutate(values))}>
        <Card className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="flex flex-col items-center gap-3">
              <Avatar className="h-20 w-20">
                <AvatarImage src={school.logoFile?.filePath} alt={school.schoolName} />
                <AvatarFallback>{initials(school.schoolName)}</AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm" className="gap-1.5" type="button" disabled title="Logo upload coming soon">
                <Camera className="h-3.5 w-3.5" /> Change Logo
              </Button>
            </div>

            <div className="flex-1">
              <div className="mb-4 flex items-center gap-2">
                <p className="font-display text-xl font-semibold">{school.schoolName}</p>
                <StatusBadge status={school.status} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="School Name" registration={register("schoolName")} />
                <Field label="Board Affiliation" registration={register("boardAffiliation")} />
                <Field label="Registration Number" registration={register("registrationNumber")} />
                <Field label="GSTIN" registration={register("gstin")} />
                <Field label="Contact Email" type="email" registration={register("contactEmail")} />
                <Field label="Contact Phone" registration={register("contactPhone")} />
                <Field label="Total Students" type="number" registration={register("studentCount")} />
                <Field label="Total Teachers" type="number" registration={register("teacherCount")} />
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

        {addresses.length === 0 && !showNewAddress ? (
          <p className="text-sm text-muted-foreground">No addresses saved yet.</p>
        ) : (
          <div className="space-y-2.5">
            {addresses.map((addr) => (
              <div key={addr.id} className="flex items-start justify-between gap-3 rounded-xl border border-border p-3.5 text-sm">
                <span>
                  <MapPin className="mb-1 inline h-3.5 w-3.5 text-primary" />{" "}
                  <span className="font-medium">{addr.addressLine1}</span>
                  {addr.addressLine2 && `, ${addr.addressLine2}`}
                  <br />
                  <span className="text-muted-foreground">
                    {addr.city}, {addr.state} {addr.pincode}, {addr.country}
                  </span>
                  {addr.isDefault && <StatusBadge status="active" className="ml-2" />}
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

function Field({
  label,
  registration,
  type = "text",
}: {
  label: string;
  registration: ReturnType<ReturnType<typeof useForm>["register"]>;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} {...registration} />
    </div>
  );
}

