"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createWorkoutForCurrentUser } from "@/data/workouts";

const createWorkoutSchema = z.object({
  name: z.string().trim().min(1).nullable(),
  startedAt: z.date(),
  exercises: z
    .array(
      z.object({
        exerciseId: z.string().uuid(),
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

export async function createWorkout(
  input: z.infer<typeof createWorkoutSchema>
) {
  const validated = createWorkoutSchema.parse(input);

  await createWorkoutForCurrentUser(validated);

  redirect("/dashboard");
}
