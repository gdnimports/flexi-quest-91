import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, ChevronUp, ChevronDown } from "lucide-react";
import { BottomNav } from "@/components/member/BottomNav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Period = "week" | "month";

interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  visits: number;
  change: number;
  isCurrentUser?: boolean;
}

const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, name: "Marcus T.", points: 3200, visits: 24, change: 0 },
  { rank: 2, name: "Sarah L.", points: 2980, visits: 22, change: 2 },
  { rank: 3, name: "James K.", points: 2850, visits: 21, change: -1 },
  { rank: 4, name: "Emma W.", points: 2720, visits: 20, change: 1 },
  { rank: 5, name: "David R.", points: 2650, visits: 19, change: -2 },
  { rank: 6, name: "Lisa M.", points: 2580, visits: 19, change: 3 },
  { rank: 7, name: "Chris P.", points: 2510, visits: 18, change: 0 },
  { rank: 8, name: "Amy H.", points: 2480, visits: 18, change: -1 },
  { rank: 9, name: "Mike B.", points: 2460, visits: 17, change: 1 },
  { rank: 10, name: "Nina S.", points: 2455, visits: 17, change: 0 },
  { rank: 11, name: "Tom G.", points: 2450, visits: 17, change: -3 },
  { rank: 12, name: "Alex", points: 2450, visits: 16, change: 2, isCurrentUser: true },
  { rank: 13, name: "Rachel F.", points: 2380, visits: 16, change: 0 },
  { rank: 14, name: "Ben C.", points: 2320, visits: 15, change: -1 },
  { rank: 15, name: "Julia N.", points: 2280, visits: 15, change: 1 },
];

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

  const currentUserEntry = mockLeaderboard.find((e) => e.isCurrentUser);

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
            <p className="text-sm text-muted-foreground">FitZone Elite</p>
          </div>
        </motion.div>
      </header>

      <main className="px-5 space-y-4">
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

        {/* Top 3 Podium */}
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
            <p className="font-semibold text-foreground text-sm">{mockLeaderboard[1].name}</p>
            <p className="text-xs text-muted-foreground">{mockLeaderboard[1].points.toLocaleString()}</p>
            <div className="w-16 h-16 mt-2 rounded-t-lg bg-secondary/50 flex items-center justify-center">
              <Medal className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
          
          {/* 1st Place */}
          <div className="flex flex-col items-center -mt-4">
            <div className="w-20 h-20 rounded-full glass border-2 border-primary flex items-center justify-center mb-2 glow-primary">
              🥇
            </div>
            <p className="font-bold text-foreground">{mockLeaderboard[0].name}</p>
            <p className="text-sm text-primary font-semibold">{mockLeaderboard[0].points.toLocaleString()}</p>
            <div className="w-20 h-24 mt-2 rounded-t-lg bg-primary/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
          </div>
          
          {/* 3rd Place */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 rounded-full glass flex items-center justify-center mb-2">
              🥉
            </div>
            <p className="font-semibold text-foreground text-sm">{mockLeaderboard[2].name}</p>
            <p className="text-xs text-muted-foreground">{mockLeaderboard[2].points.toLocaleString()}</p>
            <div className="w-16 h-12 mt-2 rounded-t-lg bg-secondary/30 flex items-center justify-center">
              <Medal className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </motion.div>

        {/* Full Rankings */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl overflow-hidden"
        >
          <div className="divide-y divide-border">
            {mockLeaderboard.slice(3).map((entry, index) => (
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
                      {entry.visits} visits
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
      </main>

      <BottomNav />
    </div>
  );
};

export default Leaderboard;
