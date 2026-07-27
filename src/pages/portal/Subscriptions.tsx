import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { subscriptionPlans } from "@/data/subscriptionPlans";
import { formatCurrency } from "@/lib/utils";

export default function Subscriptions() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [activePlan, setActivePlan] = useState("starter");

  function selectPlan(id: string, name: string) {
    setActivePlan(id);
    toast.success(`Switched to the ${name} plan`);
  }

  return (
    <div>
      <PageHeader
        title="Subscription Plans"
        description="Choose the plan that fits your school's procurement needs."
        actions={
          <div className="flex items-center gap-1 rounded-xl border border-border p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                billing === "monthly" ? "bg-primary/10 text-primary" : "text-muted-foreground"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                billing === "yearly" ? "bg-primary/10 text-primary" : "text-muted-foreground"
              }`}
            >
              Yearly <span className="text-success">(save ~17%)</span>
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {subscriptionPlans.map((plan) => {
          const price = billing === "monthly" ? plan.priceMonthly : plan.priceYearly;
          const isActive = activePlan === plan.id;
          return (
            <Card
              key={plan.id}
              className={`flex flex-col p-6 ${plan.featured ? "border-2 border-primary shadow-elevated" : ""}`}
            >
              {plan.featured && <Badge className="mb-3 w-fit">Most Popular</Badge>}
              <p className="font-display text-xl font-semibold">{plan.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-5">
                <span className="font-display text-3xl font-semibold">
                  {price === 0 ? "Free" : formatCurrency(price)}
                </span>
                {price > 0 && <span className="text-sm text-muted-foreground">/{billing === "monthly" ? "mo" : "yr"}</span>}
              </p>

              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-6 w-full"
                variant={isActive ? "outline" : plan.featured ? "default" : "outline"}
                disabled={isActive}
                onClick={() => selectPlan(plan.id, plan.name)}
              >
                {isActive ? "Current Plan" : "Switch to " + plan.name}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
