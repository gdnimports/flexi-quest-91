import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Target, Trophy, Calendar, Dumbbell } from "lucide-react";
import { ProgressRing } from "@/components/member/ProgressRing";
import { StatCard } from "@/components/member/StatCard";
import { BottomNav } from "@/components/member/BottomNav";
import { CheckInButton } from "@/components/member/CheckInButton";
import { StreakBadge } from "@/components/member/StreakBadge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Mock data - will be replaced with real data from Lovable Cloud
const mockData = {
  gymName: "FitZone Elite",
  weeklyGoal: 4,
  visitsThisWeek: 3,
  streak: 5,
  totalPoints: 2450,
  pointsThisWeek: 150,
  hasGym: true, // Set to false to test join gym flow
  hasGoal: true, // Set to false to test set goal flow
};

const Index = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [visits, setVisits] = useState(mockData.visitsThisWeek);
  const [points, setPoints] = useState(mockData.totalPoints);
  const { toast } = useToast();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
    // Redirect based on onboarding state
    if (!isLoading && user) {
      if (!mockData.hasGym) {
        navigate("/join-gym");
      } else if (!mockData.hasGoal) {
        navigate("/set-goal");
      }
    }
  }, [user, isLoading, navigate]);

  const progress = (visits / mockData.weeklyGoal) * 100;
  const visitsRemaining = mockData.weeklyGoal - visits;

  const handleCheckIn = () => {
    setIsCheckedIn(true);
    setVisits((prev) => prev + 1);
    setPoints((prev) => prev + 50);
    
    toast({
      title: "🎉 Check-in successful!",
      description: "+50 points earned. Keep crushing it!",
    });
  };

  // Get user's name from metadata or email
  const userName = user?.user_metadata?.name || user?.email?.split("@")[0] || "Champion";

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="px-5 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-muted-foreground text-sm">Welcome back,</p>
            <h1 className="text-2xl font-bold text-foreground">{userName}</h1>
          </div>
          <StreakBadge streak={mockData.streak} />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-primary mt-1"
        >
          {mockData.gymName}
        </motion.p>
      </header>

      {/* Main Content */}
      <main className="px-5 space-y-6">
        {/* Weekly Goal Progress */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-3xl p-6 flex flex-col items-center"
        >
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Weekly Goal</h2>
          </div>
          
          <ProgressRing progress={Math.min(progress, 100)} size={180} strokeWidth={14}>
            <div className="text-center">
              <span className="text-4xl font-bold text-foreground">{visits}</span>
              <span className="text-xl text-muted-foreground">/{mockData.weeklyGoal}</span>
              <p className="text-sm text-muted-foreground mt-1">visits</p>
            </div>
          </ProgressRing>

          <p className="text-center mt-4 text-muted-foreground">
            {progress >= 100 ? (
              <span className="text-primary font-semibold">🎯 Goal achieved! Amazing work!</span>
            ) : (
              <>
                <span className="text-foreground font-semibold">{visitsRemaining} more</span>
                {" "}visit{visitsRemaining !== 1 ? "s" : ""} to hit your goal
              </>
            )}
          </p>
        </motion.section>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4">
          <CheckInButton onCheckIn={handleCheckIn} isCheckedIn={isCheckedIn} />
          <Button
            onClick={() => navigate("/workout")}
            variant="secondary"
            className="h-14 rounded-2xl font-semibold gap-2"
          >
            <Dumbbell className="w-5 h-5" />
            Track Workout
          </Button>
        </div>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 gap-4">
          <StatCard
            icon={Zap}
            label="Total Points"
            value={points.toLocaleString()}
            delay={0.2}
          />
          <StatCard
            icon={Calendar}
            label="This Week"
            value={`+${mockData.pointsThisWeek}`}
            subtext="pts"
            delay={0.25}
          />
          <StatCard
            icon={Trophy}
            label="Rank"
            value="#12"
            subtext="of 156"
            delay={0.3}
          />
          <StatCard
            icon={Target}
            label="Goals Hit"
            value="8"
            subtext="this month"
            delay={0.35}
          />
        </section>

        {/* Quick Summary */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-5"
        >
          <h3 className="font-semibold text-foreground mb-2">💪 Your Progress</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            You're on a <span className="text-orange-500 font-semibold">{mockData.streak}-week streak</span>! 
            Keep it up to earn bonus points. You're ranked in the{" "}
            <span className="text-primary font-semibold">top 10%</span> of your gym this month.
          </p>
        </motion.section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;
