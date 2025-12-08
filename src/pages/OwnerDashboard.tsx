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
  Image as ImageIcon
} from "lucide-react";
import { z } from "zod";

const gymSchema = z.object({
  name: z.string().min(2, "Gym name must be at least 2 characters").max(100, "Gym name must be less than 100 characters"),
  tagline: z.string().max(200, "Tagline must be less than 200 characters").optional(),
});

interface Gym {
  id: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  owner_id: string;
}

const OwnerDashboard = () => {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [gym, setGym] = useState<Gym | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
  });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
        });
        setLogoPreview(gymData.logo_url);
      }
    } catch (error) {
      console.error("Error loading gym:", error);
    } finally {
      setIsLoading(false);
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
                <h1 className="text-xl font-bold text-foreground">{gym?.name || "Fitdash Pro"}</h1>
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
              className="bg-card border border-border rounded-3xl p-8"
            >
              <h2 className="text-2xl font-bold text-foreground mb-4">Members</h2>
              <p className="text-muted-foreground">
                Member management coming soon. You'll be able to view and manage all gym members here.
              </p>
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
        </Tabs>
      </main>
    </div>
  );
};

export default OwnerDashboard;