"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { updateWorkoutForCurrentUser } from "@/data/workouts";

// Postgres's `uuid` column only checks the 32-hex-digit shape, not the
// RFC 4122 version/variant nibbles, so we match that instead of Zod's
// stricter `.uuid()` (which rejects some legitimately stored ids, e.g.
// seeded rows like "11111111-1111-1111-1111-111111111101").
const uuidLike = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: "Invalid UUID",
  });

const updateWorkoutSchema = z.object({
  workoutId: uuidLike,
  name: z.string().trim().min(1).nullable(),
  startedAt: z.date(),
  exercises: z
    .array(
      z.object({
        exerciseId: uuidLike,
        sets: z.array(
          z.object({
            weight: z.number().nonnegative().nullable(),
            reps: z.number().int().positive(),
          })
        ),
      })
    )
    .min(1, "Add at least one exercise"),
});

export async function updateWorkout(
  input: z.infer<typeof updateWorkoutSchema>
) {
  const { workoutId, ...validated } = updateWorkoutSchema.parse(input);

  await updateWorkoutForCurrentUser(workoutId, validated);

  redirect("/dashboard");
}
