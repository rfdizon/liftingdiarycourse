"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { updateWorkoutForCurrentUser } from "@/data/workouts"

const setSchema = z.object({
  id: z.string().uuid().optional(),
  setNumber: z.number().int().positive(),
  weight: z.string().nullable(),
  reps: z.number().int().positive(),
})

const updateWorkoutSchema = z.object({
  name: z.string().trim().min(1).nullable(),
  startedAt: z.date(),
  exercises: z.array(
    z.union([
      z.object({ id: z.string().uuid(), sets: z.array(setSchema) }),
      z.object({
        exerciseId: z.string().uuid(),
        sets: z.array(setSchema).min(1, "Add at least one set"),
      }),
    ])
  ),
})

export async function updateWorkoutAction(
  workoutId: string,
  input: z.infer<typeof updateWorkoutSchema>
) {
  z.string().uuid().parse(workoutId)
  const validated = updateWorkoutSchema.parse(input)

  await updateWorkoutForCurrentUser(workoutId, validated)
  revalidatePath(`/dashboard/workout/${workoutId}`)
  revalidatePath("/dashboard")
}
