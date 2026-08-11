import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
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
import { ApiRequestError } from "@/services/apiClient";

const baseSchema = {
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email address"),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{7,14}$/, "Enter a valid phone number (with country code)"),
  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Include an uppercase letter")
    .regex(/[a-z]/, "Include a lowercase letter")
    .regex(/[0-9]/, "Include a number"),
};

const registerSchema = z
  .object({
    ...baseSchema,
    userType: z.enum(["school", "dealer"]),
    schoolName: z.string().optional(),
    schoolType: z.string().optional(),
    businessName: z.string().optional(),
    businessType: z.string().optional(),
  })
  .superRefine((val, ctx) => {
    if (val.userType === "school") {
      if (!val.schoolName) ctx.addIssue({ code: "custom", path: ["schoolName"], message: "School name is required" });
      if (!val.schoolType) ctx.addIssue({ code: "custom", path: ["schoolType"], message: "Select a school type" });
    }
    if (val.userType === "dealer") {
      if (!val.businessName) ctx.addIssue({ code: "custom", path: ["businessName"], message: "Business name is required" });
      if (!val.businessType) ctx.addIssue({ code: "custom", path: ["businessType"], message: "Select a business type" });
    }
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<"school" | "dealer">("school");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { userType: "school" },
  });

  async function onSubmit(values: RegisterForm) {
    setServerError(null);
    try {
      await registerAccount(values);
      navigate("/login", { replace: true });
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Registration failed. Please try again.";
      setServerError(message);
    }
  }

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-16">
      <Card className="w-full max-w-lg p-8">
        <h1 className="font-display text-2xl font-semibold">Create your EduNest account</h1>
        <p className="mt-1 text-sm text-muted-foreground">For schools and dealer partners.</p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label>Account type</Label>
            <Select
              value={accountType}
              onValueChange={(v) => {
                setAccountType(v as "school" | "dealer");
                setValue("userType", v as "school" | "dealer");
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="school">School</SelectItem>
                <SelectItem value="dealer">Dealer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" {...register("fullName")} />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" placeholder="+91XXXXXXXXXX" {...register("phone")} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          {accountType === "school" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="schoolName">School name</Label>
                <Input id="schoolName" {...register("schoolName")} />
                {errors.schoolName && <p className="text-xs text-destructive">{errors.schoolName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>School type</Label>
                <Select onValueChange={(v) => setValue("schoolType", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="preschool">Preschool</SelectItem>
                    <SelectItem value="k12">K-12</SelectItem>
                    <SelectItem value="play_school">Play School</SelectItem>
                    <SelectItem value="montessori">Montessori</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {errors.schoolType && <p className="text-xs text-destructive">{errors.schoolType.message}</p>}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="businessName">Business name</Label>
                <Input id="businessName" {...register("businessName")} />
                {errors.businessName && <p className="text-xs text-destructive">{errors.businessName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Business type</Label>
                <Select onValueChange={(v) => setValue("businessType", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manufacturer">Manufacturer</SelectItem>
                    <SelectItem value="distributor">Distributor</SelectItem>
                    <SelectItem value="wholesaler">Wholesaler</SelectItem>
                    <SelectItem value="retailer">Retailer</SelectItem>
                  </SelectContent>
                </Select>
                {errors.businessType && <p className="text-xs text-destructive">{errors.businessType.message}</p>}
              </div>
            </div>
          )}

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
