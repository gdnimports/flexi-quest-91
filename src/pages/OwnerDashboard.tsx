import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Building2, 
  Settings, 
  Users, 
  Trophy, 
  Upload, 
  Loader2, 
  Save,
  LogOut,
  Image as ImageIcon,
  UserCircle,
  Handshake,
  Plus,
  Trash2,
  TrendingUp,
  Activity,
  Flame,
  Calendar
} from "lucide-react";
import { z } from "zod";

const gymSchema = z.object({
  name: z.string().min(2, "Gym name must be at least 2 characters").max(100, "Gym name must be less than 100 characters"),
  tagline: z.string().max(200, "Tagline must be less than 200 characters").optional(),
  city: z.string().max(100, "City must be less than 100 characters").optional(),
});

const partnerSchema = z.object({
  company_name: z.string().trim().min(2, "Company name is required").max(100),
  service_type: z.string().trim().min(2, "Type of service is required").max(100),
  city: z.string().trim().min(2, "City is required").max(100),
  phone: z.string().trim().min(5, "Phone number is required").max(20),
  email: z.string().trim().email("Invalid email address").max(255),
  website: z.string().trim().url("Invalid website URL").max(255),
});

interface Gym {
  id: string;
  name: string;
  tagline: string | null;
  city: string | null;
  logo_url: string | null;
  owner_id: string;
}

interface Member {
  user_id: string;
  name: string;
  email: string;
  created_at: string;
  total_points: number;
}

interface MemberWithStats extends Member {
  visits_this_week: number;
  last_visit: string | null;
  total_visits: number;
}

interface DashboardStats {
  totalMembers: number;
  visitsThisWeek: number;
  activeMembers: number;
  topEngaged: MemberWithStats[];
}

interface Partner {
  id: string;
  company_name: string;
  service_type: string;
  city: string;
  phone: string;
  email: string;
  website: string;
  created_at: string;
}

const OwnerDashboard = () => {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [gym, setGym] = useState<Gym | null>(null);
  const [members, setMembers] = useState<MemberWithStats[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalMembers: 0,
    visitsThisWeek: 0,
    activeMembers: 0,
    topEngaged: [],
  });
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMembersLoading, setIsMembersLoading] = useState(false);
  const [isPartnersLoading, setIsPartnersLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPartner, setIsSavingPartner] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    city: "",
  });
  const [partnerFormData, setPartnerFormData] = useState({
    company_name: "",
    service_type: "",
    city: "",
    phone: "",
    email: "",
    website: "",
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [partnerErrors, setPartnerErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?type=owner");
      return;
    }

    if (user) {
      checkOwnerAndLoadGym();
    }
  }, [user, authLoading, navigate]);

  const checkOwnerAndLoadGym = async () => {
    if (!user) return;

    try {
      // Check if user is an owner
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const isOwner = roles?.some(r => r.role === "owner");

      if (!isOwner) {
        toast.error("Access denied. You must be a gym owner.");
        navigate("/");
        return;
      }

      // Load existing gym
      const { data: gymData } = await supabase
        .from("gyms")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();

      if (gymData) {
        setGym(gymData);
        setFormData({
          name: gymData.name,
          tagline: gymData.tagline || "",
          city: gymData.city || "",
        });
        setLogoPreview(gymData.logo_url);
        
        // Load members for this gym
        loadMembers(gymData.id);
        loadPartners(gymData.id);
      }
    } catch (error) {
      console.error("Error loading gym:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPartners = async (gymId: string) => {
    setIsPartnersLoading(true);
    try {
      const { data: partnersData, error } = await supabase
        .from("partners")
        .select("*")
        .eq("gym_id", gymId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPartners(partnersData || []);
    } catch (error) {
      console.error("Error loading partners:", error);
      toast.error("Failed to load partners");
    } finally {
      setIsPartnersLoading(false);
    }
  };

  const loadMembers = async (gymId: string) => {
    setIsMembersLoading(true);
    try {
      // Fetch members with their profiles
      const { data: membersData, error: membersError } = await supabase
        .from("profiles")
        .select("user_id, name, email, created_at, total_points")
        .eq("gym_id", gymId)
        .order("total_points", { ascending: false });

      if (membersError) throw membersError;

      // Calculate start of current week (Sunday)
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // Fetch all workouts for this gym
      const { data: workoutsData, error: workoutsError } = await supabase
        .from("workouts")
        .select("user_id, created_at")
        .eq("gym_id", gymId);

      if (workoutsError) throw workoutsError;

      // Create a map of user workout stats
      const userWorkoutStats: Record<string, { total: number; thisWeek: number; lastVisit: string | null }> = {};
      
      (workoutsData || []).forEach((workout) => {
        if (!userWorkoutStats[workout.user_id]) {
          userWorkoutStats[workout.user_id] = { total: 0, thisWeek: 0, lastVisit: null };
        }
        userWorkoutStats[workout.user_id].total++;
        
        const workoutDate = new Date(workout.created_at);
        if (workoutDate >= startOfWeek) {
          userWorkoutStats[workout.user_id].thisWeek++;
        }
        
        if (!userWorkoutStats[workout.user_id].lastVisit || 
            workoutDate > new Date(userWorkoutStats[workout.user_id].lastVisit!)) {
          userWorkoutStats[workout.user_id].lastVisit = workout.created_at;
        }
      });

      // Merge member data with workout stats
      const membersWithStats: MemberWithStats[] = (membersData || []).map((member) => ({
        ...member,
        visits_this_week: userWorkoutStats[member.user_id]?.thisWeek || 0,
        last_visit: userWorkoutStats[member.user_id]?.lastVisit || null,
        total_visits: userWorkoutStats[member.user_id]?.total || 0,
      }));

      // Calculate dashboard stats
      const visitsThisWeek = membersWithStats.reduce((sum, m) => sum + m.visits_this_week, 0);
      const activeMembers = membersWithStats.filter((m) => m.visits_this_week > 0).length;
      const topEngaged = [...membersWithStats]
        .sort((a, b) => b.total_points - a.total_points)
        .slice(0, 5);

      setMembers(membersWithStats);
      setDashboardStats({
        totalMembers: membersWithStats.length,
        visitsThisWeek,
        activeMembers,
        topEngaged,
      });
    } catch (error) {
      console.error("Error loading members:", error);
      toast.error("Failed to load members");
    } finally {
      setIsMembersLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File size must be less than 2MB");
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("gym-logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("gym-logos")
        .getPublicUrl(fileName);

      setLogoPreview(publicUrl);
      toast.success("Logo uploaded successfully!");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload logo");
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = () => {
    setErrors({});
    const result = gymSchema.safeParse(formData);
    
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm() || !user) return;

    setIsSaving(true);

    try {
      if (gym) {
        // Update existing gym
        const { error } = await supabase
          .from("gyms")
          .update({
            name: formData.name,
            tagline: formData.tagline || null,
            city: formData.city || null,
            logo_url: logoPreview,
          })
          .eq("id", gym.id);

        if (error) throw error;
        toast.success("Gym settings updated!");
      } else {
        // Create new gym
        const { data, error } = await supabase
          .from("gyms")
          .insert({
            owner_id: user.id,
            name: formData.name,
            tagline: formData.tagline || null,
            city: formData.city || null,
            logo_url: logoPreview,
          })
          .select()
          .single();

        if (error) throw error;
        setGym(data);
        toast.success("Gym created successfully!");
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save gym settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth?type=owner");
  };

  const validatePartnerForm = () => {
    setPartnerErrors({});
    const result = partnerSchema.safeParse(partnerFormData);
    
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setPartnerErrors(newErrors);
      return false;
    }
    return true;
  };

  const handleSavePartner = async () => {
    if (!validatePartnerForm() || !gym) return;

    setIsSavingPartner(true);

    try {
      const { error } = await supabase
        .from("partners")
        .insert({
          gym_id: gym.id,
          company_name: partnerFormData.company_name.trim(),
          service_type: partnerFormData.service_type.trim(),
          city: partnerFormData.city.trim(),
          phone: partnerFormData.phone.trim(),
          email: partnerFormData.email.trim(),
          website: partnerFormData.website.trim(),
        });

      if (error) throw error;
      
      toast.success("Partner added successfully!");
      setPartnerFormData({
        company_name: "",
        service_type: "",
        city: "",
        phone: "",
        email: "",
        website: "",
      });
      loadPartners(gym.id);
    } catch (error) {
      console.error("Save partner error:", error);
      toast.error("Failed to save partner");
    } finally {
      setIsSavingPartner(false);
    }
  };

  const handleDeletePartner = async (partnerId: string) => {
    if (!gym) return;

    try {
      const { error } = await supabase
        .from("partners")
        .delete()
        .eq("id", partnerId);

      if (error) throw error;
      
      toast.success("Partner deleted");
      loadPartners(gym.id);
    } catch (error) {
      console.error("Delete partner error:", error);
      toast.error("Failed to delete partner");
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {gym?.logo_url ? (
              <img 
                src={gym.logo_url} 
                alt={gym.name} 
                className="w-10 h-10 rounded-xl object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">{gym?.name || "FitDash Pro"}</h1>
                {gym?.tagline && (
                  <span className="text-sm text-muted-foreground">• {gym.tagline}</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Gym Owner Dashboard</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Tabs defaultValue="configuration" className="space-y-6">
          <TabsList className="bg-muted p-1 rounded-xl">
            <TabsTrigger value="configuration" className="rounded-lg gap-2">
              <Settings className="w-4 h-4" />
              Configuration
            </TabsTrigger>
            <TabsTrigger value="members" className="rounded-lg gap-2">
              <Users className="w-4 h-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="rewards" className="rounded-lg gap-2">
              <Trophy className="w-4 h-4" />
              Rewards
            </TabsTrigger>
            <TabsTrigger value="partners" className="rounded-lg gap-2">
              <Handshake className="w-4 h-4" />
              Partners
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configuration">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-3xl p-8"
            >
              <h2 className="text-2xl font-bold text-foreground mb-6">Gym Configuration</h2>
              
              <div className="grid gap-8 md:grid-cols-2">
                {/* Logo Upload */}
                <div className="space-y-4">
                  <Label className="text-foreground">Gym Logo</Label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-48 h-48 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer bg-muted/50 flex flex-col items-center justify-center overflow-hidden group"
                  >
                    {logoPreview ? (
                      <>
                        <img 
                          src={logoPreview} 
                          alt="Gym logo" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Upload className="w-8 h-8 text-primary" />
                        </div>
                      </>
                    ) : isUploading ? (
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    ) : (
                      <>
                        <ImageIcon className="w-12 h-12 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Upload logo</p>
                        <p className="text-xs text-muted-foreground">Max 2MB</p>
                      </>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>

                {/* Form Fields */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="gymName" className="text-foreground">Gym Name *</Label>
                    <Input
                      id="gymName"
                      type="text"
                      placeholder="FitZone Elite"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className={`h-12 bg-muted/50 border-border rounded-xl ${errors.name ? "border-destructive" : ""}`}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tagline" className="text-foreground">Tagline / Motto</Label>
                    <Textarea
                      id="tagline"
                      placeholder="Where Champions Are Made"
                      value={formData.tagline}
                      onChange={(e) => setFormData(prev => ({ ...prev, tagline: e.target.value }))}
                      className={`min-h-[100px] bg-muted/50 border-border rounded-xl resize-none ${errors.tagline ? "border-destructive" : ""}`}
                    />
                    {errors.tagline && (
                      <p className="text-sm text-destructive">{errors.tagline}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formData.tagline.length}/200 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-foreground">City</Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="New York"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className={`h-12 bg-muted/50 border-border rounded-xl ${errors.city ? "border-destructive" : ""}`}
                    />
                    {errors.city && (
                      <p className="text-sm text-destructive">{errors.city}</p>
                    )}
                  </div>

                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="w-full h-12 rounded-xl font-semibold gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        {gym ? "Save Changes" : "Create Gym"}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="members">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Stats Cards */}
              {gym && !isMembersLoading && members.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">Total Members</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{dashboardStats.totalMembers}</p>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-chart-2/10 flex items-center justify-center">
                        <Activity className="w-5 h-5 text-chart-2" />
                      </div>
                      <span className="text-sm text-muted-foreground">Visits This Week</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">{dashboardStats.visitsThisWeek}</p>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-chart-3/10 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-chart-3" />
                      </div>
                      <span className="text-sm text-muted-foreground">Active This Week</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {dashboardStats.activeMembers}
                      <span className="text-sm font-normal text-muted-foreground ml-2">
                        ({dashboardStats.totalMembers > 0 ? Math.round((dashboardStats.activeMembers / dashboardStats.totalMembers) * 100) : 0}%)
                      </span>
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-chart-4/10 flex items-center justify-center">
                        <Flame className="w-5 h-5 text-chart-4" />
                      </div>
                      <span className="text-sm text-muted-foreground">Avg Visits/Member</span>
                    </div>
                    <p className="text-3xl font-bold text-foreground">
                      {dashboardStats.totalMembers > 0 
                        ? (dashboardStats.visitsThisWeek / dashboardStats.totalMembers).toFixed(1) 
                        : "0"}
                    </p>
                  </div>
                </div>
              )}

              {/* Top Engaged Members */}
              {gym && !isMembersLoading && dashboardStats.topEngaged.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-primary" />
                    Top Engaged Members
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                    {dashboardStats.topEngaged.map((member, index) => (
                      <div 
                        key={member.user_id}
                        className="bg-muted/30 rounded-xl p-4 flex items-center gap-3"
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0 ? "bg-yellow-500/20 text-yellow-500" :
                          index === 1 ? "bg-gray-400/20 text-gray-400" :
                          index === 2 ? "bg-amber-600/20 text-amber-600" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          #{index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{member.name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{member.total_points} pts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Members Table */}
              <div className="bg-card border border-border rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground">All Members</h2>
                  <span className="text-sm text-muted-foreground">
                    {members.length} member{members.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {!gym ? (
                  <p className="text-muted-foreground text-center py-8">
                    Please create your gym first in the Configuration tab.
                  </p>
                ) : isMembersLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-12">
                    <UserCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No members have joined your gym yet.</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Share your gym with members to get started.
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Name</TableHead>
                          <TableHead className="font-semibold">Email</TableHead>
                          <TableHead className="font-semibold">Visits This Week</TableHead>
                          <TableHead className="font-semibold">Total Visits</TableHead>
                          <TableHead className="font-semibold">Points</TableHead>
                          <TableHead className="font-semibold">Last Visit</TableHead>
                          <TableHead className="font-semibold">Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {members.map((member) => (
                          <TableRow key={member.user_id}>
                            <TableCell className="font-medium">{member.name || "—"}</TableCell>
                            <TableCell className="text-muted-foreground">{member.email}</TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                member.visits_this_week >= 3 
                                  ? "bg-primary/10 text-primary" 
                                  : member.visits_this_week > 0 
                                    ? "bg-chart-2/10 text-chart-2"
                                    : "bg-muted text-muted-foreground"
                              }`}>
                                {member.visits_this_week}
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">{member.total_visits}</TableCell>
                            <TableCell className="font-medium text-primary">{member.total_points}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {member.last_visit 
                                ? new Date(member.last_visit).toLocaleDateString()
                                : "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(member.created_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </motion.div>
          </TabsContent>

          <TabsContent value="rewards">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-3xl p-8"
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Rewards</h2>
              <p className="text-muted-foreground">
                Rewards configuration coming soon. You'll be able to create and manage rewards for your members here.
              </p>
            </motion.div>
          </TabsContent>

          <TabsContent value="partners">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-3xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Partners</h2>
                <span className="text-sm text-muted-foreground">
                  {partners.length} partner{partners.length !== 1 ? "s" : ""}
                </span>
              </div>

              {!gym ? (
                <p className="text-muted-foreground text-center py-8">
                  Please create your gym first in the Configuration tab.
                </p>
              ) : (
                <div className="space-y-8">
                  {/* Add Partner Form */}
                  <div className="bg-muted/30 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Add New Partner
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="company_name" className="text-foreground">Company Name *</Label>
                        <Input
                          id="company_name"
                          placeholder="Acme Fitness Supplements"
                          value={partnerFormData.company_name}
                          onChange={(e) => setPartnerFormData(prev => ({ ...prev, company_name: e.target.value }))}
                          className={`h-11 bg-background border-border rounded-xl ${partnerErrors.company_name ? "border-destructive" : ""}`}
                        />
                        {partnerErrors.company_name && (
                          <p className="text-sm text-destructive">{partnerErrors.company_name}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="service_type" className="text-foreground">Type of Service *</Label>
                        <Input
                          id="service_type"
                          placeholder="Nutritional Supplements"
                          value={partnerFormData.service_type}
                          onChange={(e) => setPartnerFormData(prev => ({ ...prev, service_type: e.target.value }))}
                          className={`h-11 bg-background border-border rounded-xl ${partnerErrors.service_type ? "border-destructive" : ""}`}
                        />
                        {partnerErrors.service_type && (
                          <p className="text-sm text-destructive">{partnerErrors.service_type}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-foreground">City *</Label>
                        <Input
                          id="city"
                          placeholder="New York"
                          value={partnerFormData.city}
                          onChange={(e) => setPartnerFormData(prev => ({ ...prev, city: e.target.value }))}
                          className={`h-11 bg-background border-border rounded-xl ${partnerErrors.city ? "border-destructive" : ""}`}
                        />
                        {partnerErrors.city && (
                          <p className="text-sm text-destructive">{partnerErrors.city}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-foreground">Phone Number *</Label>
                        <Input
                          id="phone"
                          placeholder="+1 555 123 4567"
                          value={partnerFormData.phone}
                          onChange={(e) => setPartnerFormData(prev => ({ ...prev, phone: e.target.value }))}
                          className={`h-11 bg-background border-border rounded-xl ${partnerErrors.phone ? "border-destructive" : ""}`}
                        />
                        {partnerErrors.phone && (
                          <p className="text-sm text-destructive">{partnerErrors.phone}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="partner_email" className="text-foreground">Email *</Label>
                        <Input
                          id="partner_email"
                          type="email"
                          placeholder="contact@acmefitness.com"
                          value={partnerFormData.email}
                          onChange={(e) => setPartnerFormData(prev => ({ ...prev, email: e.target.value }))}
                          className={`h-11 bg-background border-border rounded-xl ${partnerErrors.email ? "border-destructive" : ""}`}
                        />
                        {partnerErrors.email && (
                          <p className="text-sm text-destructive">{partnerErrors.email}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website" className="text-foreground">Website *</Label>
                        <Input
                          id="website"
                          type="url"
                          placeholder="https://acmefitness.com"
                          value={partnerFormData.website}
                          onChange={(e) => setPartnerFormData(prev => ({ ...prev, website: e.target.value }))}
                          className={`h-11 bg-background border-border rounded-xl ${partnerErrors.website ? "border-destructive" : ""}`}
                        />
                        {partnerErrors.website && (
                          <p className="text-sm text-destructive">{partnerErrors.website}</p>
                        )}
                      </div>
                    </div>

                    <Button 
                      onClick={handleSavePartner} 
                      disabled={isSavingPartner}
                      className="mt-6 h-11 rounded-xl font-semibold gap-2"
                    >
                      {isSavingPartner ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Plus className="w-5 h-5" />
                          Add Partner
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Partners List */}
                  {isPartnersLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : partners.length === 0 ? (
                    <div className="text-center py-12">
                      <Handshake className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No partners added yet.</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add your first partner using the form above.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="font-semibold">Company</TableHead>
                            <TableHead className="font-semibold">Service</TableHead>
                            <TableHead className="font-semibold">City</TableHead>
                            <TableHead className="font-semibold">Contact</TableHead>
                            <TableHead className="font-semibold w-16"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {partners.map((partner) => (
                            <TableRow key={partner.id}>
                              <TableCell className="font-medium">{partner.company_name}</TableCell>
                              <TableCell className="text-muted-foreground">{partner.service_type}</TableCell>
                              <TableCell className="text-muted-foreground">{partner.city}</TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <a href={`mailto:${partner.email}`} className="text-primary hover:underline block">
                                    {partner.email}
                                  </a>
                                  <span className="text-muted-foreground">{partner.phone}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeletePartner(partner.id)}
                                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default OwnerDashboard;