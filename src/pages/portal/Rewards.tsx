import { Gift, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { rewardsSummary, rewardActivity, rewardPerks } from "@/data/rewards";
import { formatDate } from "@/lib/utils";

export default function Rewards() {
  const progressPct = Math.min(
    100,
    (rewardsSummary.currentPoints / (rewardsSummary.currentPoints + rewardsSummary.pointsToNextTier)) * 100
  );

  function redeem(title: string, cost: number) {
    if (cost > rewardsSummary.currentPoints) {
      toast.error("Not enough points to redeem this perk");
      return;
    }
    toast.success(`${title} redeemed! Our team will follow up shortly.`);
  }

  return (
    <div>
      <PageHeader title="Rewards" description="Earn points on every order and redeem them for perks." />

      <Card className="mb-6 overflow-hidden bg-gradient-to-br from-primary to-edu-red-dark p-8 text-primary-foreground">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="flex items-center gap-2 text-sm font-medium text-primary-foreground/80">
              <Sparkles className="h-4 w-4" /> {rewardsSummary.tier}
            </p>
            <p className="mt-1 font-display text-4xl font-semibold">
              {rewardsSummary.currentPoints.toLocaleString("en-IN")} <span className="text-lg font-normal">points</span>
            </p>
            <p className="mt-1 text-sm text-primary-foreground/80">
              Lifetime earned: {rewardsSummary.lifetimePoints.toLocaleString("en-IN")} points
            </p>
          </div>
          <div className="w-full max-w-xs">
            <div className="mb-2 flex justify-between text-xs text-primary-foreground/80">
              <span>{rewardsSummary.tier}</span>
              <span>{rewardsSummary.nextTier}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/20">
              <div className="h-full rounded-full bg-white" style={{ width: `${progressPct}%` }} />
            </div>
            <p className="mt-2 text-xs text-primary-foreground/80">
              {rewardsSummary.pointsToNextTier.toLocaleString("en-IN")} points to next tier
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <p className="mb-4 font-display text-lg font-semibold">Recent Activity</p>
          <div className="divide-y divide-border">
            {rewardActivity.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{a.label}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(a.date)}</p>
                </div>
                <span className="text-sm font-semibold text-success">+{a.points}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <p className="mb-4 font-display text-lg font-semibold">Redeem Perks</p>
          <div className="space-y-3">
            {rewardPerks.map((perk) => (
              <div key={perk.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-edu-gray">
                    <Gift className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{perk.title}</p>
                    <p className="text-xs text-muted-foreground">{perk.description}</p>
                    <p className="mt-1 text-xs font-medium text-primary">{perk.pointsCost.toLocaleString("en-IN")} pts</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => redeem(perk.title, perk.pointsCost)}>
                  Redeem
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
