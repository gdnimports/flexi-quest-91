import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Stethoscope, Sparkles, Activity, Leaf, Heart, Phone, Mail, Globe, MapPin, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/member/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface Partner {
  id: string;
  company_name: string;
  service_type: string;
  city: string;
  phone: string;
  email: string;
  website: string;
}

interface GymInfo {
  name: string;
  city: string | null;
}

const serviceIcons: Record<string, React.ElementType> = {
  Dental: Stethoscope,
  Massage: Sparkles,
  Chiropractor: Activity,
  Cannabis: Leaf,
  Wellness: Heart,
};

const serviceColors: Record<string, string> = {
  Dental: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Massage: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  Chiropractor: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  Cannabis: "bg-green-500/20 text-green-400 border-green-500/30",
  Wellness: "bg-pink-500/20 text-pink-400 border-pink-500/30",
};

const Partners = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [gymInfo, setGymInfo] = useState<GymInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
      return;
    }

    const fetchData = async () => {
      if (!user) return;

      try {
        // Get user's gym info
        const { data: profileData } = await supabase
          .from("profiles")
          .select("gym_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (profileData?.gym_id) {
          // Get gym info
          const { data: gymData } = await supabase
            .from("gyms")
            .select("name, city")
            .eq("id", profileData.gym_id)
            .maybeSingle();

          if (gymData) {
            setGymInfo(gymData);
          }

          // Get partners for the user's gym
          const { data: partnersData, error } = await supabase
            .from("partners")
            .select("*")
            .eq("gym_id", profileData.gym_id);

          if (!error && partnersData) {
            setPartners(partnersData);
          }
        }
      } catch (error) {
        console.error("Error fetching partners:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, isLoading, navigate]);

  const serviceTypes = ["all", ...new Set(partners.map(p => p.service_type))];
  
  const filteredPartners = activeTab === "all" 
    ? partners 
    : partners.filter(p => p.service_type === activeTab);

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="glass-strong border-b border-border/50 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Local Partners</h1>
              {gymInfo?.city && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {gymInfo.city}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Filter Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex-wrap h-auto gap-1 bg-muted/30 p-1">
            {serviceTypes.map((type) => {
              const Icon = type !== "all" ? serviceIcons[type] : null;
              return (
                <TabsTrigger
                  key={type}
                  value={type}
                  className="flex items-center gap-1 text-xs capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  {type === "all" ? "All" : type}
                </TabsTrigger>
              );
            })}
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {filteredPartners.length === 0 ? (
              <Card className="border-border/50 bg-card/50">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No partners found in your area.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredPartners.map((partner, index) => {
                  const Icon = serviceIcons[partner.service_type] || Heart;
                  const colorClass = serviceColors[partner.service_type] || "bg-muted text-muted-foreground";
                  
                  return (
                    <motion.div
                      key={partner.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="border-border/50 bg-card/50 hover:bg-card/80 transition-colors">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <CardTitle className="text-base font-semibold text-foreground">
                              {partner.company_name}
                            </CardTitle>
                            <Badge variant="outline" className={`shrink-0 ${colorClass}`}>
                              <Icon className="w-3 h-3 mr-1" />
                              {partner.service_type}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex flex-col gap-1.5 text-sm text-muted-foreground">
                            <a 
                              href={`tel:${partner.phone}`}
                              className="flex items-center gap-2 hover:text-foreground transition-colors"
                            >
                              <Phone className="w-4 h-4 text-primary" />
                              {partner.phone}
                            </a>
                            <a 
                              href={`mailto:${partner.email}`}
                              className="flex items-center gap-2 hover:text-foreground transition-colors truncate"
                            >
                              <Mail className="w-4 h-4 text-primary" />
                              <span className="truncate">{partner.email}</span>
                            </a>
                            <a 
                              href={partner.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 hover:text-foreground transition-colors truncate"
                            >
                              <Globe className="w-4 h-4 text-primary" />
                              <span className="truncate">{partner.website.replace('https://', '')}</span>
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Partner Count */}
        <p className="text-center text-sm text-muted-foreground">
          {filteredPartners.length} partner{filteredPartners.length !== 1 ? 's' : ''} in {gymInfo?.city || 'your area'}
        </p>
      </div>

      <BottomNav />
    </div>
  );
};

export default Partners;
