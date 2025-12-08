import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Building2, 
  ArrowRight, 
  Loader2, 
  CheckCircle2,
  Search
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface Gym {
  id: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
}

const JoinGym = () => {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [filteredGyms, setFilteredGyms] = useState<Gym[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      loadGyms();
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = gyms.filter(gym => 
        gym.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        gym.tagline?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredGyms(filtered);
    } else {
      setFilteredGyms(gyms);
    }
  }, [searchQuery, gyms]);

  const loadGyms = async () => {
    try {
      const { data, error } = await supabase
        .from("gyms")
        .select("id, name, tagline, logo_url")
        .order("name");

      if (error) throw error;
      setGyms(data || []);
      setFilteredGyms(data || []);
    } catch (error) {
      console.error("Error loading gyms:", error);
      toast.error("Failed to load gyms");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGym = async () => {
    if (!selectedGym || !user) return;

    setIsJoining(true);

    try {
      // Update profile with gym_id
      const { error } = await supabase
        .from("profiles")
        .update({ gym_id: selectedGym.id })
        .eq("user_id", user.id);

      if (error) throw error;

      // Add member role
      await supabase
        .from("user_roles")
        .insert({ user_id: user.id, role: "member" as const })
        .select();

      toast.success(`Welcome to ${selectedGym.name}!`);
      navigate("/set-goal");
    } catch (error) {
      console.error("Error joining gym:", error);
      toast.error("Failed to join gym. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-background" />

      <div className="relative z-10 max-w-lg mx-auto pt-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Building2 className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Choose Your Gym</h1>
          <p className="text-muted-foreground">
            Select your gym to start tracking your fitness journey
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search gyms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 bg-card border-border rounded-xl"
            />
          </div>
        </motion.div>

        {/* Gym List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 mb-8"
        >
          {filteredGyms.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-2xl">
              <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {searchQuery ? "No gyms found matching your search" : "No gyms available yet"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Ask your gym owner to set up their gym on Fitdash Pro
              </p>
            </div>
          ) : (
            filteredGyms.map((gym, index) => (
              <motion.button
                key={gym.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                onClick={() => setSelectedGym(gym)}
                className={`w-full p-4 rounded-2xl border transition-all flex items-center gap-4 text-left ${
                  selectedGym?.id === gym.id
                    ? "bg-primary/10 border-primary"
                    : "bg-card border-border hover:border-primary/50"
                }`}
              >
                {/* Logo */}
                <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                  {gym.logo_url ? (
                    <img src={gym.logo_url} alt={gym.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{gym.name}</h3>
                  {gym.tagline && (
                    <p className="text-sm text-muted-foreground truncate">{gym.tagline}</p>
                  )}
                </div>

                {/* Check */}
                {selectedGym?.id === gym.id && (
                  <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                )}
              </motion.button>
            ))
          )}
        </motion.div>

        {/* Join Button */}
        {selectedGym && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              onClick={handleJoinGym}
              disabled={isJoining}
              className="w-full h-14 rounded-2xl text-lg font-semibold gap-2"
            >
              {isJoining ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Join {selectedGym.name}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </Button>
          </motion.div>
        )}

        {/* Skip option */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-sm text-muted-foreground mt-6"
        >
          Don't see your gym?{" "}
          <button
            onClick={() => navigate("/set-goal")}
            className="text-primary hover:underline font-medium"
          >
            Continue without one
          </button>
        </motion.p>
      </div>
    </div>
  );
};

export default JoinGym;