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
        variant="hero"
        size="xl"
        onClick={onCheckIn}
        disabled={isCheckedIn}
        className="w-full relative z-10"
      >
        <QrCode className="w-6 h-6" />
        {isCheckedIn ? "Checked In Today" : "Check In Now"}
      </Button>
    </motion.div>
  );
}
