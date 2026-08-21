"use server"

import { revalidatePath } from "next/cache"

import {
  updateWorkoutForCurrentUser,
  type UpdateWorkoutInput,
} from "@/data/workouts"

export async function updateWorkoutAction(
  workoutId: string,
  input: UpdateWorkoutInput
) {
  await updateWorkoutForCurrentUser(workoutId, input)
  revalidatePath(`/dashboard/workout/${workoutId}`)
  revalidatePath("/dashboard")
}
