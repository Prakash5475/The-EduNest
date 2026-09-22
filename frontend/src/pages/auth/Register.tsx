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
  fullName: z
    .string()
    .trim()
    .min(2, "Full name is required")
    .max(150, "Full name is too long"),

  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .max(254, "Email address is too long"),

  phone: z
    .string()
    .trim()
    .regex(
      /^\+?[1-9]\d{7,14}$/,
      "Enter a valid phone number with country code",
    ),

  password: z
    .string()
    .min(8, "At least 8 characters")
    .regex(/[A-Z]/, "Include an uppercase letter")
    .regex(/[a-z]/, "Include a lowercase letter")
    .regex(/[0-9]/, "Include a number")
    .regex(/[^A-Za-z0-9]/, "Include a special character"),
};

const registerSchema = z
  .object({
    ...baseSchema,

    userType: z.enum(["school", "dealer"]),

    schoolName: z.string().trim().optional(),

    schoolType: z
      .enum(["preschool", "k12", "play_school", "montessori", "other"])
      .optional(),

    businessName: z.string().trim().optional(),

    businessType: z
      .enum(["manufacturer", "distributor", "wholesaler", "retailer"])
      .optional(),
  })
  .superRefine((values, context) => {
    if (values.userType === "school") {
      if (!values.schoolName) {
        context.addIssue({
          code: "custom",
          path: ["schoolName"],
          message: "School name is required",
        });
      }

      if (!values.schoolType) {
        context.addIssue({
          code: "custom",
          path: ["schoolType"],
          message: "Select a school type",
        });
      }
    }

    if (values.userType === "dealer") {
      if (!values.businessName) {
        context.addIssue({
          code: "custom",
          path: ["businessName"],
          message: "Business name is required",
        });
      }

      if (!values.businessType) {
        context.addIssue({
          code: "custom",
          path: ["businessType"],
          message: "Select a business type",
        });
      }
    }
  });

type RegisterForm = z.infer<typeof registerSchema>;

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    const fieldErrors = (error.errors ?? [])
      .map((item) => {
        const field = item.field ? `${item.field}: ` : "";
        return `${field}${item.message}`;
      })
      .filter(Boolean);

    return [error.message, ...fieldErrors]
      .filter((message, index, messages) => {
        return messages.indexOf(message) === index;
      })
      .join(" — ");
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Registration failed. Please check the details and try again.";
}

export default function Register() {
  const { register: registerAccount } = useAuth();
  const navigate = useNavigate();

  const [serverError, setServerError] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<"school" | "dealer">(
    "school",
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userType: "school",
      fullName: "",
      email: "",
      phone: "",
      password: "",
      schoolName: "",
      schoolType: undefined,
      businessName: "",
      businessType: undefined,
    },
  });

  function changeAccountType(value: "school" | "dealer") {
    setAccountType(value);

    setValue("userType", value, {
      shouldValidate: true,
      shouldDirty: true,
    });

    setValue("schoolName", "");
    setValue("schoolType", undefined);
    setValue("businessName", "");
    setValue("businessType", undefined);

    setServerError(null);
  }

  async function onSubmit(values: RegisterForm) {
    setServerError(null);

    const payload = {
      fullName: values.fullName.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim(),
      password: values.password,
      userType: values.userType,

      ...(values.userType === "school"
        ? {
            schoolName: values.schoolName?.trim(),
            schoolType: values.schoolType,
          }
        : {
            businessName: values.businessName?.trim(),
            businessType: values.businessType,
          }),
    };

    try {
      await registerAccount(payload);

      navigate("/login", {
        replace: true,
        state: {
          message:
            "Account created successfully. Please check your email to verify your account.",
        },
      });
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  }

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-16">
      <Card className="w-full max-w-lg p-8">
        <h1 className="font-display text-2xl font-semibold">
          Create your EduNest account
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          For schools and dealer partners.
        </p>

        <form
          className="mt-6 space-y-4"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-1.5">
            <Label>Account type</Label>

            <Select
              value={accountType}
              onValueChange={(value) =>
                changeAccountType(value as "school" | "dealer")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="school">School</SelectItem>
                <SelectItem value="dealer">Dealer</SelectItem>
              </SelectContent>
            </Select>

            {errors.userType && (
              <p className="text-xs text-destructive">
                {errors.userType.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fullName">Full name</Label>

              <Input
                id="fullName"
                autoComplete="name"
                {...register("fullName")}
              />

              {errors.fullName && (
                <p className="text-xs text-destructive">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>

              <Input
                id="phone"
                type="tel"
                placeholder="+91XXXXXXXXXX"
                autoComplete="tel"
                {...register("phone")}
              />

              {errors.phone && (
                <p className="text-xs text-destructive">
                  {errors.phone.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>

            <Input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email")}
            />

            {errors.email && (
              <p className="text-xs text-destructive">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>

            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register("password")}
            />

            {errors.password && (
              <p className="text-xs text-destructive">
                {errors.password.message}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Use at least 8 characters with uppercase, lowercase, number, and
              special character.
            </p>
          </div>

          {accountType === "school" ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="schoolName">School name</Label>

                <Input
                  id="schoolName"
                  {...register("schoolName")}
                />

                {errors.schoolName && (
                  <p className="text-xs text-destructive">
                    {errors.schoolName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>School type</Label>

                <Select
                  onValueChange={(value) =>
                    setValue(
                      "schoolType",
                      value as RegisterForm["schoolType"],
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      },
                    )
                  }
                >
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

                {errors.schoolType && (
                  <p className="text-xs text-destructive">
                    {errors.schoolType.message}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="businessName">Business name</Label>

                <Input
                  id="businessName"
                  {...register("businessName")}
                />

                {errors.businessName && (
                  <p className="text-xs text-destructive">
                    {errors.businessName.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Business type</Label>

                <Select
                  onValueChange={(value) =>
                    setValue(
                      "businessType",
                      value as RegisterForm["businessType"],
                      {
                        shouldValidate: true,
                        shouldDirty: true,
                      },
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value="manufacturer">
                      Manufacturer
                    </SelectItem>
                    <SelectItem value="distributor">Distributor</SelectItem>
                    <SelectItem value="wholesaler">Wholesaler</SelectItem>
                    <SelectItem value="retailer">Retailer</SelectItem>
                  </SelectContent>
                </Select>

                {errors.businessType && (
                  <p className="text-xs text-destructive">
                    {errors.businessType.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {serverError && (
            <div
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {serverError}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}