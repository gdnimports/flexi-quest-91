import { motion } from "framer-motion";
import { 
  User, 
  Settings, 
  Target, 
  Calendar, 
  ChevronRight, 
  LogOut,
  Bell,
  Shield,
  HelpCircle
} from "lucide-react";
import { BottomNav } from "@/components/member/BottomNav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const mockUser = {
  name: "Alex Johnson",
  email: "alex@example.com",
  memberSince: "March 2024",
  gym: "FitZone Elite",
  currentGoal: 4,
};

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

const Profile = () => {
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
            <h1 className="text-2xl font-bold text-foreground">{mockUser.name}</h1>
            <p className="text-sm text-muted-foreground">{mockUser.email}</p>
            <p className="text-xs text-primary mt-1">Member since {mockUser.memberSince}</p>
          </div>
        </motion.div>
      </header>

      <main className="px-5 space-y-6">
        {/* Current Gym */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-5"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Current Gym</p>
              <p className="font-semibold text-foreground text-lg">{mockUser.gym}</p>
            </div>
            <Button variant="outline" size="sm">
              Switch Gym
            </Button>
          </div>
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
            value={`${mockUser.currentGoal} visits`}
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
          />
        </motion.section>

        {/* App Version */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-xs text-muted-foreground py-4"
        >
          GymGo v1.0.0
        </motion.p>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
