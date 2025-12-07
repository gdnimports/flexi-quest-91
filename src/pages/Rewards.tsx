import { motion } from "framer-motion";
import { Gift, Star, Lock, Zap } from "lucide-react";
import { BottomNav } from "@/components/member/BottomNav";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: string;
  icon: string;
}

const mockRewards: Reward[] = [
  {
    id: "1",
    name: "Free Protein Shake",
    description: "Redeem for any protein shake at the juice bar",
    pointsCost: 500,
    category: "Food & Drinks",
    icon: "🥤",
  },
  {
    id: "2",
    name: "Guest Pass",
    description: "Bring a friend for a free workout session",
    pointsCost: 1000,
    category: "Access",
    icon: "🎟️",
  },
  {
    id: "3",
    name: "Personal Training Session",
    description: "30-minute session with a certified trainer",
    pointsCost: 2000,
    category: "Training",
    icon: "💪",
  },
  {
    id: "4",
    name: "Gym Merchandise",
    description: "Choose from t-shirts, bottles, or towels",
    pointsCost: 2500,
    category: "Merchandise",
    icon: "👕",
  },
  {
    id: "5",
    name: "One Month Free",
    description: "Get your next month membership free",
    pointsCost: 5000,
    category: "Membership",
    icon: "⭐",
  },
  {
    id: "6",
    name: "Premium Locker",
    description: "Upgrade to a premium locker for 3 months",
    pointsCost: 3000,
    category: "Perks",
    icon: "🔐",
  },
];

const userPoints = 2450;

const Rewards = () => {
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="px-5 pt-12 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <div className="p-2 rounded-xl bg-primary/20">
            <Gift className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Rewards</h1>
            <p className="text-sm text-muted-foreground">Redeem your points</p>
          </div>
        </motion.div>
      </header>

      <main className="px-5 space-y-6">
        {/* Points Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 text-center"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground uppercase tracking-wide">Your Balance</span>
          </div>
          <p className="text-4xl font-bold text-gradient">{userPoints.toLocaleString()}</p>
          <p className="text-muted-foreground mt-1">points available</p>
        </motion.div>

        {/* Rewards Grid */}
        <section className="space-y-4">
          <h2 className="font-semibold text-foreground">Available Rewards</h2>
          
          <div className="grid gap-4">
            {mockRewards.map((reward, index) => {
              const canAfford = userPoints >= reward.pointsCost;
              const progress = Math.min((userPoints / reward.pointsCost) * 100, 100);
              const pointsNeeded = reward.pointsCost - userPoints;

              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + index * 0.05 }}
                  className={cn(
                    "glass rounded-2xl p-4 transition-all",
                    canAfford && "border border-primary/30"
                  )}
                >
                  <div className="flex gap-4">
                    <div className={cn(
                      "w-14 h-14 rounded-xl flex items-center justify-center text-2xl",
                      canAfford ? "bg-primary/20" : "bg-secondary"
                    )}>
                      {reward.icon}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-foreground">{reward.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">{reward.category}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Star className="w-4 h-4 text-primary" />
                          <span className="font-bold text-foreground">{reward.pointsCost.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {reward.description}
                      </p>

                      {!canAfford && (
                        <div className="mt-3 space-y-2">
                          <Progress 
                            value={progress} 
                            className="h-2"
                          />
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {pointsNeeded.toLocaleString()} more needed
                            </span>
                            <span className="text-primary font-medium">
                              {Math.round(progress)}%
                            </span>
                          </div>
                        </div>
                      )}

                      {canAfford && (
                        <Button
                          variant="success"
                          size="sm"
                          className="mt-3"
                        >
                          Redeem Reward
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* How it works */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-2xl p-5"
        >
          <h3 className="font-semibold text-foreground mb-3">How to Earn Points</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <span className="text-primary">•</span>
              <span><strong className="text-foreground">50 points</strong> per gym visit</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">•</span>
              <span><strong className="text-foreground">100 bonus points</strong> for hitting weekly goal</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-primary">•</span>
              <span><strong className="text-foreground">25 extra points</strong> for each week on a streak</span>
            </li>
          </ul>
        </motion.section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Rewards;
