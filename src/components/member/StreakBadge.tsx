import { motion } from "framer-motion";
import { Flame } from "lucide-react";

interface StreakBadgeProps {
  streak: number;
}

export function StreakBadge({ streak }: StreakBadgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 glass rounded-full px-4 py-2"
    >
      <Flame className="w-5 h-5 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
      <span className="font-bold text-foreground">{streak}</span>
      <span className="text-sm text-muted-foreground">week streak</span>
    </motion.div>
  );
}
