import { motion } from "framer-motion";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CheckInButtonProps {
  onCheckIn: () => void;
  isCheckedIn?: boolean;
}

export function CheckInButton({ onCheckIn, isCheckedIn }: CheckInButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="relative"
    >
      {!isCheckedIn && (
        <div className="absolute inset-0 rounded-2xl bg-primary/30 animate-pulse-ring" />
      )}
      <Button
        onClick={onCheckIn}
        disabled={isCheckedIn}
        className="w-full h-14 rounded-2xl font-semibold gap-2 relative z-10 glow-button"
      >
        <QrCode className="w-5 h-5" />
        {isCheckedIn ? "Checked In" : "Check In"}
      </Button>
    </motion.div>
  );
}
