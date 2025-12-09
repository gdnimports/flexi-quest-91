import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  User, 
  Settings, 
  Target, 
  Calendar, 
  ChevronRight, 
  LogOut,
  Bell,
  Shield,
  HelpCircle,
  Upload,
  Building2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BottomNav } from "@/components/member/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
  variant?: "default" | "destructive";
}

const MenuItem = ({ icon, label, value, onClick, variant = "default" }: MenuItemProps) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-4 p-4 rounded-xl transition-colors",
      "hover:bg-secondary/50",
      variant === "destructive" && "text-destructive"
    )}
  >
    <div className={cn(
      "w-10 h-10 rounded-xl flex items-center justify-center",
      variant === "destructive" ? "bg-destructive/10" : "bg-secondary"
    )}>
      {icon}
    </div>
    <div className="flex-1 text-left">
      <span className={cn(
        "font-medium",
        variant === "default" ? "text-foreground" : "text-destructive"
      )}>
        {label}
      </span>
    </div>
    {value ? (
      <span className="text-sm text-muted-foreground">{value}</span>
    ) : (
      <ChevronRight className="w-5 h-5 text-muted-foreground" />
    )}
  </button>
);

interface Gym {
  id: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  owner_id: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Owner state
  const [ownerGym, setOwnerGym] = useState<Gym | null>(null);
  const [gymName, setGymName] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
  // Member state
  const [memberGymId, setMemberGymId] = useState<string | null>(null);
  const [availableGyms, setAvailableGyms] = useState<Gym[]>([]);
  
  // User info
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    checkUserRoleAndLoadData();
  }, []);

  const checkUserRoleAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setUserEmail(user.email || "");

      // Get profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, gym_id")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setUserName(profile.name);
        setMemberGymId(profile.gym_id);
      }

      // Check if user is owner
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const hasOwnerRole = roles?.some(r => r.role === "owner");
      setIsOwner(hasOwnerRole || false);

      if (hasOwnerRole) {
        // Load owner's gym
        const { data: gym } = await supabase
          .from("gyms")
          .select("*")
          .eq("owner_id", user.id)
          .single();

        if (gym) {
          setOwnerGym(gym);
          setGymName(gym.name);
          setLogoPreview(gym.logo_url);
        }
      } else {
        // Load available gyms for member
        const { data: gyms } = await supabase
          .from("gyms")
          .select("*")
          .order("name");

        setAvailableGyms(gyms || []);
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("gym-logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("gym-logos")
        .getPublicUrl(fileName);

      setLogoPreview(publicUrl);
      toast.success("Logo uploaded successfully");
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const handleOwnerSave = async () => {
    if (!gymName.trim()) {
      toast.error("Please enter a gym name");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (ownerGym) {
        // Update existing gym
        const { error } = await supabase
          .from("gyms")
          .update({
            name: gymName,
            logo_url: logoPreview,
          })
          .eq("id", ownerGym.id);

        if (error) throw error;
        toast.success("Gym updated successfully");
      } else {
        // Create new gym
        const { error } = await supabase
          .from("gyms")
          .insert({
            name: gymName,
            logo_url: logoPreview,
            owner_id: user.id,
          });

        if (error) throw error;
        toast.success("Gym created successfully");
      }

      await checkUserRoleAndLoadData();
    } catch (error) {
      console.error("Error saving gym:", error);
      toast.error("Failed to save gym");
    } finally {
      setSaving(false);
    }
  };

  const handleMemberGymChange = async (gymId: string) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({ gym_id: gymId })
        .eq("user_id", user.id);

      if (error) throw error;

      setMemberGymId(gymId);
      toast.success("Gym updated successfully");
    } catch (error) {
      console.error("Error updating gym:", error);
      toast.error("Failed to update gym");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const currentMemberGym = availableGyms.find(g => g.id === memberGymId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="px-5 pt-12 pb-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center">
            <User className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{userName || "User"}</h1>
            <p className="text-sm text-muted-foreground">{userEmail}</p>
            <p className="text-xs text-primary mt-1">{isOwner ? "Gym Owner" : "Member"}</p>
          </div>
        </motion.div>
      </header>

      <main className="px-5 space-y-6">
        {/* Gym Section - Different for Owner vs Member */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-5"
        >
          {isOwner ? (
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">
                  {ownerGym ? "Manage Your Gym" : "Create Your Gym"}
                </h2>
              </div>
              
              {/* Gym Name */}
              <div className="space-y-2">
                <Label htmlFor="gymName">Gym Name</Label>
                <Input
                  id="gymName"
                  value={gymName}
                  onChange={(e) => setGymName(e.target.value)}
                  placeholder="Enter gym name"
                />
              </div>

              {/* Logo Upload - Separate section */}
              <div className="space-y-3">
                <Label>Gym Logo</Label>
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Gym logo"
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-secondary flex items-center justify-center">
                    <Building2 className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
                <label className="cursor-pointer inline-block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm">{uploading ? "Uploading..." : "Upload Logo"}</span>
                  </div>
                </label>
              </div>

              <Button
                onClick={handleOwnerSave}
                disabled={saving}
                className="w-full"
              >
                {saving ? "Saving..." : ownerGym ? "Update Gym" : "Create Gym"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Gym</p>
                  <p className="font-semibold text-foreground text-lg">
                    {currentMemberGym?.name || "No gym selected"}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Change Gym</Label>
                <Select
                  value={memberGymId || ""}
                  onValueChange={handleMemberGymChange}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a gym" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableGyms.map((gym) => (
                      <SelectItem key={gym.id} value={gym.id}>
                        {gym.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </motion.section>

        {/* Goals Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-2xl overflow-hidden"
        >
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Fitness Goals</h2>
          </div>
          <MenuItem
            icon={<Target className="w-5 h-5 text-primary" />}
            label="Weekly Visit Goal"
            value="4 visits"
          />
          <MenuItem
            icon={<Calendar className="w-5 h-5 text-muted-foreground" />}
            label="View History"
          />
        </motion.section>

        {/* Settings Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl overflow-hidden"
        >
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Settings</h2>
          </div>
          <MenuItem
            icon={<Bell className="w-5 h-5 text-muted-foreground" />}
            label="Notifications"
          />
          <MenuItem
            icon={<Shield className="w-5 h-5 text-muted-foreground" />}
            label="Privacy & Security"
          />
          <MenuItem
            icon={<Settings className="w-5 h-5 text-muted-foreground" />}
            label="Account Settings"
          />
        </motion.section>

        {/* Support Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass rounded-2xl overflow-hidden"
        >
          <MenuItem
            icon={<HelpCircle className="w-5 h-5 text-muted-foreground" />}
            label="Help & Support"
          />
          <MenuItem
            icon={<LogOut className="w-5 h-5 text-destructive" />}
            label="Log Out"
            variant="destructive"
            onClick={handleLogout}
          />
        </motion.section>

        {/* App Version */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-muted-foreground py-4"
        >
          FitDash Pro v1.0.0
        </motion.p>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
