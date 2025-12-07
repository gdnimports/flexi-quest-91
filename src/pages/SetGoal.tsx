import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Target, Flame, ArrowRight, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const goalOptions = [
  {
    value: 2,
    label: "2 visits",
    description: "Perfect for beginners",
    emoji: "🌱",
    intensity: "Light",
  },
  {
    value: 3,
    label: "3 visits",
    description: "Balanced & sustainable",
    emoji: "💪",
    intensity: "Moderate",
  },
  {
    value: 4,
    label: "4 visits",
    description: "For dedicated athletes",
    emoji: "🔥",
    intensity: "Intense",
  },
];

const SetGoal = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if not logged in
  if (!authLoading && !user) {
    navigate("/auth");
    return null;
  }

  const handleConfirmGoal = async () => {
    if (selectedGoal === null) {
      toast.error("Please select a weekly goal");
      return;
    }

    setIsSubmitting(true);

    // Simulate API call to save goal
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success(`Weekly goal set to ${selectedGoal} visits! Let's crush it! 🎯`);
    navigate("/");

    setIsSubmitting(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Champion";

  return (
    <div className="min-h-screen bg-background flex flex-col p-6">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex-1 flex flex-col max-w-md mx-auto w-full"
      >
        {/* Header */}
        <header className="pt-8 pb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4"
          >
            <Target className="w-7 h-7 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground">Set Your Weekly Goal</h1>
          <p className="text-muted-foreground mt-1">
            Hey {userName}! How many times per week do you want to hit the gym?
          </p>
        </header>

        {/* Goal Options */}
        <main className="flex-1 space-y-4">
          {goalOptions.map((option, index) => (
            <motion.button
              key={option.value}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
              onClick={() => setSelectedGoal(option.value)}
              className={cn(
                "w-full glass rounded-2xl p-5 flex items-center gap-4 text-left transition-all duration-200",
                selectedGoal === option.value
                  ? "border-2 border-primary bg-primary/10 glow-primary"
                  : "hover:bg-card/90"
              )}
            >
              <div
                className={cn(
                  "w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all",
                  selectedGoal === option.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {selectedGoal === option.value ? (
                  <Check className="w-7 h-7" />
                ) : (
                  option.emoji
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground text-lg">
                    {option.label}
                  </h3>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full",
                      option.value === 2 && "bg-blue-500/20 text-blue-400",
                      option.value === 3 && "bg-primary/20 text-primary",
                      option.value === 4 && "bg-orange-500/20 text-orange-400"
                    )}
                  >
                    {option.intensity}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{option.description}</p>
              </div>
              <Flame
                className={cn(
                  "w-5 h-5 transition-colors",
                  selectedGoal === option.value
                    ? "text-primary"
                    : "text-muted-foreground/30"
                )}
              />
            </motion.button>
          ))}

          {/* Motivation text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center pt-4"
          >
            <p className="text-sm text-muted-foreground">
              You can always adjust your goal later in settings.
            </p>
          </motion.div>
        </main>

        {/* Confirm Button */}
        <footer className="pt-6 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={handleConfirmGoal}
              disabled={isSubmitting || selectedGoal === null}
              className="w-full h-14 rounded-xl text-lg font-semibold glow-button"
            >
              {isSubmitting ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Start My Journey
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </motion.div>

          {selectedGoal && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-sm text-primary mt-4"
            >
              Great choice! {selectedGoal} visits per week = ~{selectedGoal * 4} visits per month 🚀
            </motion.p>
          )}
        </footer>
      </motion.div>
    </div>
  );
};

export default SetGoal;
