import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, ChevronUp, ChevronDown, Globe, Building2 } from "lucide-react";
import { BottomNav } from "@/components/member/BottomNav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type Period = "week" | "month";
type Scope = "gym" | "all";

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  visits: number;
  change: number;
  isCurrentUser?: boolean;
  gymName?: string;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <span className="text-2xl">🥇</span>;
    case 2:
      return <span className="text-2xl">🥈</span>;
    case 3:
      return <span className="text-2xl">🥉</span>;
    default:
      return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  }
};

const Leaderboard = () => {
  const [period, setPeriod] = useState<Period>("week");
  const [scope, setScope] = useState<Scope>("gym");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [gymName, setGymName] = useState<string>("Fitdash Pro");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      setCurrentUserId(user.id);

      // Get user's gym
      const { data: profile } = await supabase
        .from("profiles")
        .select("gym_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (scope === "gym") {
        if (!profile?.gym_id) {
          setLoading(false);
          return;
        }

        // Get gym name
        const { data: gym } = await supabase
          .from("gyms")
          .select("name")
          .eq("id", profile.gym_id)
          .maybeSingle();

        if (gym?.name) {
          setGymName(gym.name);
        }

        // Get all members of the same gym
        const { data: members } = await supabase
          .from("profiles")
          .select("user_id, name")
          .eq("gym_id", profile.gym_id);

        if (!members || members.length === 0) {
          setLeaderboard([]);
          setLoading(false);
          return;
        }

        // Generate mock points/visits for demo
        const leaderboardData: LeaderboardEntry[] = members.map((member) => ({
          rank: 0,
          name: member.name || "Unknown",
          points: Math.floor(Math.random() * 2000) + 500,
          visits: Math.floor(Math.random() * 20) + 5,
          change: Math.floor(Math.random() * 5) - 2,
          isCurrentUser: member.user_id === user.id,
        }));

        // Sort by points and assign ranks
        leaderboardData.sort((a, b) => b.points - a.points);
        leaderboardData.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        setLeaderboard(leaderboardData);
      } else {
        // Fetch all members across all gyms
        setGymName("All Gyms");

        const { data: allMembers } = await supabase
          .from("profiles")
          .select("user_id, name, gym_id");

        if (!allMembers || allMembers.length === 0) {
          setLeaderboard([]);
          setLoading(false);
          return;
        }

        // Get gym names for all unique gym_ids
        const gymIds = [...new Set(allMembers.filter(m => m.gym_id).map(m => m.gym_id))];
        const { data: gyms } = await supabase
          .from("gyms")
          .select("id, name")
          .in("id", gymIds);

        const gymMap = new Map(gyms?.map(g => [g.id, g.name]) || []);

        // Generate mock points/visits for demo
        const leaderboardData: LeaderboardEntry[] = allMembers.map((member) => ({
          rank: 0,
          name: member.name || "Unknown",
          points: Math.floor(Math.random() * 2000) + 500,
          visits: Math.floor(Math.random() * 20) + 5,
          change: Math.floor(Math.random() * 5) - 2,
          isCurrentUser: member.user_id === user.id,
          gymName: member.gym_id ? gymMap.get(member.gym_id) || "Unknown Gym" : "No Gym",
        }));

        // Sort by points and assign ranks
        leaderboardData.sort((a, b) => b.points - a.points);
        leaderboardData.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        setLeaderboard(leaderboardData);
      }

      setLoading(false);
    };

    fetchLeaderboard();
  }, [period, scope]);

  const currentUserEntry = leaderboard.find((e) => e.isCurrentUser);

  if (loading) {
    return (
      <div className="min-h-screen pb-24 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <BottomNav />
      </div>
    );
  }

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
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">{gymName}</p>
          </div>
        </motion.div>
      </header>

      <main className="px-5 space-y-4">
        {/* Scope Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex gap-2 p-1 glass rounded-xl"
        >
          <Button
            variant={scope === "gym" ? "default" : "ghost"}
            size="sm"
            onClick={() => setScope("gym")}
            className="flex-1 gap-2"
          >
            <Building2 className="w-4 h-4" />
            My Gym
          </Button>
          <Button
            variant={scope === "all" ? "default" : "ghost"}
            size="sm"
            onClick={() => setScope("all")}
            className="flex-1 gap-2"
          >
            <Globe className="w-4 h-4" />
            All Gyms
          </Button>
        </motion.div>

        {/* Period Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 p-1 glass rounded-xl"
        >
          <Button
            variant={period === "week" ? "default" : "ghost"}
            size="sm"
            onClick={() => setPeriod("week")}
            className="flex-1"
          >
            This Week
          </Button>
          <Button
            variant={period === "month" ? "default" : "ghost"}
            size="sm"
            onClick={() => setPeriod("month")}
            className="flex-1"
          >
            This Month
          </Button>
        </motion.div>

        {/* Current User Highlight */}
        {currentUserEntry && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            className="glass rounded-2xl p-4 border border-primary/30 glow-primary"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">
                    #{currentUserEntry.rank}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Your Ranking</p>
                  <p className="text-sm text-muted-foreground">
                    {currentUserEntry.points.toLocaleString()} pts · {currentUserEntry.visits} visits
                  </p>
                </div>
              </div>
              <div className={cn(
                "flex items-center gap-1 text-sm font-medium",
                currentUserEntry.change > 0 ? "text-primary" : 
                currentUserEntry.change < 0 ? "text-destructive" : "text-muted-foreground"
              )}>
                {currentUserEntry.change > 0 ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    {currentUserEntry.change}
                  </>
                ) : currentUserEntry.change < 0 ? (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    {Math.abs(currentUserEntry.change)}
                  </>
                ) : (
                  "—"
                )}
              </div>
            </div>
          </motion.div>
        )}

        {leaderboard.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl p-8 text-center"
          >
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No members yet. Join a gym to see the leaderboard!</p>
          </motion.div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-end justify-center gap-3 py-4"
              >
                {/* 2nd Place */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full glass flex items-center justify-center mb-2">
                    🥈
                  </div>
                  <p className={cn(
                    "font-semibold text-sm text-center",
                    leaderboard[1].isCurrentUser ? "text-primary" : "text-foreground"
                  )}>
                    {leaderboard[1].name}
                    {leaderboard[1].isCurrentUser && " (You)"}
                  </p>
                  {scope === "all" && leaderboard[1].gymName && (
                    <p className="text-xs text-muted-foreground truncate max-w-16">{leaderboard[1].gymName}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{leaderboard[1].points.toLocaleString()}</p>
                  <div className="w-16 h-16 mt-2 rounded-t-lg bg-secondary/50 flex items-center justify-center">
                    <Medal className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
                
                {/* 1st Place */}
                <div className="flex flex-col items-center -mt-4">
                  <div className="w-20 h-20 rounded-full glass border-2 border-primary flex items-center justify-center mb-2 glow-primary">
                    🥇
                  </div>
                  <p className={cn(
                    "font-bold text-center",
                    leaderboard[0].isCurrentUser ? "text-primary" : "text-foreground"
                  )}>
                    {leaderboard[0].name}
                    {leaderboard[0].isCurrentUser && " (You)"}
                  </p>
                  {scope === "all" && leaderboard[0].gymName && (
                    <p className="text-xs text-muted-foreground truncate max-w-20">{leaderboard[0].gymName}</p>
                  )}
                  <p className="text-sm text-primary font-semibold">{leaderboard[0].points.toLocaleString()}</p>
                  <div className="w-20 h-24 mt-2 rounded-t-lg bg-primary/20 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                </div>
                
                {/* 3rd Place */}
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full glass flex items-center justify-center mb-2">
                    🥉
                  </div>
                  <p className={cn(
                    "font-semibold text-sm text-center",
                    leaderboard[2].isCurrentUser ? "text-primary" : "text-foreground"
                  )}>
                    {leaderboard[2].name}
                    {leaderboard[2].isCurrentUser && " (You)"}
                  </p>
                  {scope === "all" && leaderboard[2].gymName && (
                    <p className="text-xs text-muted-foreground truncate max-w-16">{leaderboard[2].gymName}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{leaderboard[2].points.toLocaleString()}</p>
                  <div className="w-16 h-12 mt-2 rounded-t-lg bg-secondary/30 flex items-center justify-center">
                    <Medal className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Full Rankings */}
            {leaderboard.length > 3 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="glass rounded-2xl overflow-hidden"
              >
                <div className="divide-y divide-border">
                  {leaderboard.slice(3).map((entry, index) => (
                    <motion.div
                      key={entry.rank}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.03 }}
                      className={cn(
                        "flex items-center justify-between p-4 transition-colors",
                        entry.isCurrentUser && "bg-primary/10"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 text-center">
                          {getRankIcon(entry.rank)}
                        </div>
                        <div>
                          <p className={cn(
                            "font-medium",
                            entry.isCurrentUser ? "text-primary" : "text-foreground"
                          )}>
                            {entry.name}
                            {entry.isCurrentUser && " (You)"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {scope === "all" && entry.gymName ? `${entry.gymName} · ` : ""}{entry.visits} visits
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-semibold text-foreground">
                          {entry.points.toLocaleString()}
                        </span>
                        <div className={cn(
                          "w-8 text-right text-sm font-medium",
                          entry.change > 0 ? "text-primary" : 
                          entry.change < 0 ? "text-destructive" : "text-muted-foreground"
                        )}>
                          {entry.change > 0 ? `+${entry.change}` : entry.change === 0 ? "—" : entry.change}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Leaderboard;
