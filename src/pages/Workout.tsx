import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dumbbell,
  Heart,
  Footprints,
  Zap,
  Bike,
  MoreHorizontal,
  Sparkles,
  Plus,
  Trash2,
  Save,
  Loader2,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { BottomNav } from "@/components/member/BottomNav";

const workoutTypes = [
  { value: "weights", label: "Weights", icon: Dumbbell, color: "text-blue-400" },
  { value: "cardio", label: "Cardio", icon: Heart, color: "text-red-400" },
  { value: "aerobics", label: "Aerobics", icon: Footprints, color: "text-purple-400" },
  { value: "hiit", label: "HIIT", icon: Zap, color: "text-orange-400" },
  { value: "spinning", label: "Spinning", icon: Bike, color: "text-green-400" },
  { value: "other", label: "Other", icon: MoreHorizontal, color: "text-muted-foreground" },
];

interface Exercise {
  id: string;
  name: string;
  sets?: number;
  reps?: number;
  duration?: number;
  isAISuggested?: boolean;
}

// Mock AI suggestions - will be replaced with Lovable AI
const mockAISuggestions: Record<string, Exercise[]> = {
  weights: [
    { id: "1", name: "Bench Press", sets: 3, reps: 10, isAISuggested: true },
    { id: "2", name: "Squats", sets: 3, reps: 12, isAISuggested: true },
    { id: "3", name: "Deadlift", sets: 3, reps: 8, isAISuggested: true },
    { id: "4", name: "Shoulder Press", sets: 3, reps: 10, isAISuggested: true },
  ],
  cardio: [
    { id: "1", name: "Treadmill Jog", duration: 15, isAISuggested: true },
    { id: "2", name: "Stationary Bike", duration: 10, isAISuggested: true },
    { id: "3", name: "Rowing Machine", duration: 10, isAISuggested: true },
    { id: "4", name: "Jump Rope", duration: 5, isAISuggested: true },
  ],
  aerobics: [
    { id: "1", name: "Step Aerobics", duration: 20, isAISuggested: true },
    { id: "2", name: "Dance Cardio", duration: 15, isAISuggested: true },
    { id: "3", name: "Low-Impact Aerobics", duration: 15, isAISuggested: true },
  ],
  hiit: [
    { id: "1", name: "Burpees", sets: 4, reps: 10, isAISuggested: true },
    { id: "2", name: "Mountain Climbers", sets: 4, reps: 20, isAISuggested: true },
    { id: "3", name: "Box Jumps", sets: 4, reps: 12, isAISuggested: true },
    { id: "4", name: "Kettlebell Swings", sets: 4, reps: 15, isAISuggested: true },
  ],
  spinning: [
    { id: "1", name: "Warm-up Ride", duration: 5, isAISuggested: true },
    { id: "2", name: "Hill Climb", duration: 10, isAISuggested: true },
    { id: "3", name: "Sprint Intervals", duration: 10, isAISuggested: true },
    { id: "4", name: "Cool Down", duration: 5, isAISuggested: true },
  ],
  other: [
    { id: "1", name: "Stretching", duration: 10, isAISuggested: true },
    { id: "2", name: "Yoga Flow", duration: 15, isAISuggested: true },
    { id: "3", name: "Foam Rolling", duration: 10, isAISuggested: true },
  ],
};

const Workout = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const handleSelectType = async (type: string) => {
    setSelectedType(type);
    setShowTypeSelector(false);
    setIsLoadingAI(true);
    setExercises([]);

    // Simulate AI API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const suggestions = mockAISuggestions[type] || [];
    setExercises(suggestions.map((ex, idx) => ({ ...ex, id: `ai-${idx}` })));
    setIsLoadingAI(false);
    toast.success("AI generated exercise suggestions!");
  };

  const handleAddExercise = () => {
    const newExercise: Exercise = {
      id: `manual-${Date.now()}`,
      name: "",
      sets: 3,
      reps: 10,
      isAISuggested: false,
    };
    setExercises([...exercises, newExercise]);
  };

  const handleRemoveExercise = (id: string) => {
    setExercises(exercises.filter((ex) => ex.id !== id));
  };

  const handleUpdateExercise = (id: string, field: keyof Exercise, value: string | number) => {
    setExercises(
      exercises.map((ex) =>
        ex.id === id ? { ...ex, [field]: value } : ex
      )
    );
  };

  const handleSaveWorkout = async () => {
    const validExercises = exercises.filter((ex) => ex.name.trim());
    if (validExercises.length === 0) {
      toast.error("Please add at least one exercise");
      return;
    }

    setIsSaving(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success("Workout logged! +25 points earned 🎉");
    navigate("/");

    setIsSaving(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const selectedTypeData = workoutTypes.find((t) => t.value === selectedType);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="px-5 pt-12 pb-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <button
            onClick={() => navigate("/")}
            className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Track Workout</h1>
            <p className="text-sm text-muted-foreground">Log your exercises</p>
          </div>
        </motion.div>
      </header>

      <main className="px-5 space-y-5">
        {/* Workout Type Selector */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => setShowTypeSelector(!showTypeSelector)}
            className="w-full glass rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {selectedTypeData ? (
                <>
                  <div className={cn("w-10 h-10 rounded-xl bg-muted flex items-center justify-center", selectedTypeData.color)}>
                    <selectedTypeData.icon className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-foreground">{selectedTypeData.label}</span>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Dumbbell className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <span className="text-muted-foreground">Select workout type</span>
                </>
              )}
            </div>
            <ChevronDown
              className={cn(
                "w-5 h-5 text-muted-foreground transition-transform",
                showTypeSelector && "rotate-180"
              )}
            />
          </button>

          <AnimatePresence>
            {showTypeSelector && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-3 gap-3 mt-3"
              >
                {workoutTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => handleSelectType(type.value)}
                    className={cn(
                      "glass rounded-xl p-4 flex flex-col items-center gap-2 transition-all",
                      selectedType === type.value
                        ? "border-2 border-primary bg-primary/10"
                        : "hover:bg-card/90"
                    )}
                  >
                    <type.icon className={cn("w-6 h-6", type.color)} />
                    <span className="text-xs font-medium text-foreground">{type.label}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>

        {/* AI Loading State */}
        {isLoadingAI && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass rounded-2xl p-8 flex flex-col items-center gap-4"
          >
            <div className="relative">
              <Sparkles className="w-10 h-10 text-primary animate-pulse" />
              <div className="absolute inset-0 animate-ping">
                <Sparkles className="w-10 h-10 text-primary opacity-30" />
              </div>
            </div>
            <p className="text-muted-foreground text-center">
              AI is generating exercise suggestions...
            </p>
          </motion.div>
        )}

        {/* Exercise List */}
        {!isLoadingAI && selectedType && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Exercises</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddExercise}
                className="text-primary"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {exercises.map((exercise, index) => (
                  <motion.div
                    key={exercise.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="glass rounded-xl p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2">
                          {exercise.isAISuggested && (
                            <Sparkles className="w-4 h-4 text-primary" />
                          )}
                          <Input
                            value={exercise.name}
                            onChange={(e) =>
                              handleUpdateExercise(exercise.id, "name", e.target.value)
                            }
                            placeholder="Exercise name"
                            className="h-10 bg-muted/50 border-border rounded-lg font-medium"
                          />
                        </div>

                        <div className="flex gap-3">
                          {exercise.duration !== undefined ? (
                            <div className="flex-1">
                              <Label className="text-xs text-muted-foreground">Duration (min)</Label>
                              <Input
                                type="number"
                                value={exercise.duration || ""}
                                onChange={(e) =>
                                  handleUpdateExercise(
                                    exercise.id,
                                    "duration",
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="h-9 bg-muted/50 border-border rounded-lg"
                              />
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <Label className="text-xs text-muted-foreground">Sets</Label>
                                <Input
                                  type="number"
                                  value={exercise.sets || ""}
                                  onChange={(e) =>
                                    handleUpdateExercise(
                                      exercise.id,
                                      "sets",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="h-9 bg-muted/50 border-border rounded-lg"
                                />
                              </div>
                              <div className="flex-1">
                                <Label className="text-xs text-muted-foreground">Reps</Label>
                                <Input
                                  type="number"
                                  value={exercise.reps || ""}
                                  onChange={(e) =>
                                    handleUpdateExercise(
                                      exercise.id,
                                      "reps",
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="h-9 bg-muted/50 border-border rounded-lg"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveExercise(exercise.id)}
                        className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {exercises.length === 0 && (
                <div className="glass rounded-xl p-8 text-center">
                  <p className="text-muted-foreground">
                    No exercises yet. Add some to log your workout!
                  </p>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* Save Button */}
        {!isLoadingAI && selectedType && exercises.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-4"
          >
            <Button
              onClick={handleSaveWorkout}
              disabled={isSaving}
              className="w-full h-14 rounded-xl text-lg font-semibold glow-button"
            >
              {isSaving ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Save Workout
                </>
              )}
            </Button>
          </motion.div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Workout;
