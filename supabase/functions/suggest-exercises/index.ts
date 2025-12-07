import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { workout_type, experience_level = "beginner" } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log(`Generating exercises for workout type: ${workout_type}, level: ${experience_level}`);

    const systemPrompt = `You are a fitness coach inside a gym app. Based on the workout type the user selected, generate a list of 4-6 relevant exercises. Keep the exercises simple, clear, and beginner-friendly unless otherwise specified.

IMPORTANT: You must respond ONLY with valid JSON, no other text. Use this exact format:
{
  "exercises": [
    { "name": "Exercise Name", "sets": 3, "reps": 10 },
    { "name": "Cardio Exercise", "duration_minutes": 15 }
  ]
}

Rules:
- For strength exercises (weights, HIIT): include "sets" and "reps"
- For cardio/timed exercises (cardio, aerobics, spinning): include "duration_minutes" instead
- Keep exercise names short and clear
- Suggest 4-6 exercises total`;

    const userPrompt = `Generate exercises for a ${experience_level} doing a ${workout_type} workout.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    console.log("AI response content:", content);

    // Parse the JSON from the AI response
    let exercises;
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        exercises = parsed.exercises || [];
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return fallback exercises
      exercises = getFallbackExercises(workout_type);
    }

    return new Response(JSON.stringify({ exercises }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in suggest-exercises:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getFallbackExercises(workout_type: string) {
  const fallbacks: Record<string, any[]> = {
    weights: [
      { name: "Bench Press", sets: 3, reps: 10 },
      { name: "Squats", sets: 3, reps: 12 },
      { name: "Deadlift", sets: 3, reps: 8 },
      { name: "Shoulder Press", sets: 3, reps: 10 },
    ],
    cardio: [
      { name: "Treadmill Jog", duration_minutes: 15 },
      { name: "Stationary Bike", duration_minutes: 10 },
      { name: "Rowing Machine", duration_minutes: 10 },
    ],
    aerobics: [
      { name: "Step Aerobics", duration_minutes: 20 },
      { name: "Dance Cardio", duration_minutes: 15 },
    ],
    hiit: [
      { name: "Burpees", sets: 4, reps: 10 },
      { name: "Mountain Climbers", sets: 4, reps: 20 },
      { name: "Box Jumps", sets: 4, reps: 12 },
    ],
    spinning: [
      { name: "Warm-up Ride", duration_minutes: 5 },
      { name: "Hill Climb", duration_minutes: 10 },
      { name: "Sprint Intervals", duration_minutes: 10 },
    ],
    other: [
      { name: "Stretching", duration_minutes: 10 },
      { name: "Yoga Flow", duration_minutes: 15 },
    ],
  };
  return fallbacks[workout_type] || fallbacks.other;
}
