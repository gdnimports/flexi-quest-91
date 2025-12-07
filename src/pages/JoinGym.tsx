import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { QrCode, Hash, Building2, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

// Mock gym data - will be replaced with real data from backend
const mockGyms: Record<string, { id: string; name: string; location: string; members: number }> = {
  "FITZONE": { id: "gym-1", name: "FitZone Elite", location: "Downtown", members: 156 },
  "FLEX123": { id: "gym-2", name: "FlexFit Studio", location: "Westside", members: 89 },
  "POWER99": { id: "gym-3", name: "PowerHouse Gym", location: "Midtown", members: 234 },
};

const JoinGym = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [gymCode, setGymCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [validatedGym, setValidatedGym] = useState<typeof mockGyms[string] | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Redirect if not logged in
  if (!authLoading && !user) {
    navigate("/auth");
    return null;
  }

  const handleValidateCode = async () => {
    if (!gymCode.trim()) {
      toast.error("Please enter a gym code");
      return;
    }

    setIsValidating(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const gym = mockGyms[gymCode.toUpperCase()];
    
    if (gym) {
      setValidatedGym(gym);
      toast.success(`Found ${gym.name}!`);
    } else {
      toast.error("Invalid gym code. Please check and try again.");
      setValidatedGym(null);
    }
    
    setIsValidating(false);
  };

  const handleJoinGym = async () => {
    if (!validatedGym) return;
    
    setIsJoining(true);
    
    // Simulate API call to join gym
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success(`Welcome to ${validatedGym.name}!`);
    navigate("/set-goal");
    
    setIsJoining(false);
  };

  const handleScanQR = () => {
    toast.info("QR scanning coming soon!");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
            <Building2 className="w-7 h-7 text-primary" />
          </motion.div>
          <h1 className="text-2xl font-bold text-foreground">Join Your Gym</h1>
          <p className="text-muted-foreground mt-1">
            Enter your gym code or scan QR to get started
          </p>
        </header>

        {/* Main content */}
        <main className="flex-1 space-y-6">
          {/* QR Scan Option */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={handleScanQR}
            className="w-full glass rounded-2xl p-6 flex items-center gap-4 hover:bg-card/90 transition-colors text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <QrCode className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Scan QR Code</h3>
              <p className="text-sm text-muted-foreground">Quick join using gym's QR code</p>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground" />
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Code Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="gymCode" className="text-foreground">Gym Code</Label>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="gymCode"
                  type="text"
                  placeholder="Enter gym code (e.g., FITZONE)"
                  value={gymCode}
                  onChange={(e) => {
                    setGymCode(e.target.value.toUpperCase());
                    setValidatedGym(null);
                  }}
                  className="pl-10 h-12 bg-muted/50 border-border rounded-xl uppercase"
                  maxLength={20}
                />
              </div>
            </div>

            {!validatedGym ? (
              <Button
                onClick={handleValidateCode}
                disabled={isValidating || !gymCode.trim()}
                className="w-full h-12 rounded-xl"
                variant="secondary"
              >
                {isValidating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Verify Code"
                )}
              </Button>
            ) : null}
          </motion.div>

          {/* Gym Preview Card */}
          {validatedGym && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-2xl p-5 border-2 border-primary/30"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{validatedGym.name}</h3>
                  <p className="text-sm text-muted-foreground">{validatedGym.location}</p>
                  <p className="text-xs text-primary mt-1">
                    {validatedGym.members} active members
                  </p>
                </div>
              </div>

              <Button
                onClick={handleJoinGym}
                disabled={isJoining}
                className="w-full h-12 rounded-xl mt-4 glow-button"
              >
                {isJoining ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    Join {validatedGym.name}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </main>

        {/* Skip for now */}
        <footer className="pt-6 pb-8">
          <p className="text-center text-sm text-muted-foreground">
            Don't have a code?{" "}
            <button
              onClick={() => toast.info("Ask your gym for their member code!")}
              className="text-primary hover:underline font-medium"
            >
              Learn more
            </button>
          </p>
        </footer>
      </motion.div>
    </div>
  );
};

export default JoinGym;
