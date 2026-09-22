import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth, homeRouteFor } from "@/context/AuthContext";
import { ApiRequestError } from "@/services/apiClient";

type LoginAs = "customer" | "dealer" | "admin";

const TAB_COPY: Record<LoginAs, { label: string }> = {
  customer: { label: "Customer" },
  dealer: { label: "Dealer" },
  admin: { label: "Admin" },
};

const loginSchema = z.object({
  identifier: z.string().trim().min(1, "This field is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginAs, setLoginAs] = useState<LoginAs>("customer");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  function switchTab(next: LoginAs) {
    setLoginAs(next);
    setServerError(null);
    reset();
  }

  async function onSubmit(values: LoginForm) {
    setServerError(null);
    try {
      const user = await login(values.identifier, values.password, loginAs);
      toast.success(`Welcome back, ${user.fullName.split(" ")[0]}`);
      const redirectTo = (location.state as { from?: string } | null)?.from;
      navigate(redirectTo ?? homeRouteFor(user.userType), { replace: true });
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : "Login failed. Please try again.";
      setServerError(message);
    }
  }

  const copy = TAB_COPY[loginAs];

  return (
    <div className="container flex min-h-[70vh] items-center justify-center py-16">
      <Card className="w-full max-w-md p-8">
        <h1 className="font-display text-2xl font-semibold">Sign in to EduNest</h1>
        <p className="mt-1 text-sm text-muted-foreground">Access your school, dealer, or admin dashboard.</p>

        <Tabs value={loginAs} onValueChange={(v) => switchTab(v as LoginAs)} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customer">Customer</TabsTrigger>
            <TabsTrigger value="dealer">Dealer</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>
        </Tabs>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label htmlFor="identifier">Email / Phone Number</Label>
            <Input
              id="identifier"
              type="text"
              autoComplete="username"
              placeholder="Enter email or phone number"
              {...register("identifier")}
            />
            {errors.identifier && <p className="text-xs text-destructive">{errors.identifier.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Signing in…" : `Sign in as ${copy.label}`}
          </Button>
        </form>

        {loginAs === "customer" && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Create one
            </Link>
          </p>
        )}
      </Card>
    </div>
  );
}
