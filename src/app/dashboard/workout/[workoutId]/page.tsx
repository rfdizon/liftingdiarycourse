import { notFound } from "next/navigation"
import { getAllExercises } from "@/data/exercises"
import { getWorkoutForCurrentUser } from "@/data/workouts"
import { EditWorkoutForm } from "./edit-workout-form"

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ workoutId: string }>
}) {
  const { workoutId } = await params

  const [workout, exercises] = await Promise.all([
    getWorkoutForCurrentUser(workoutId),
    getAllExercises(),
  ])

  if (!workout) {
    notFound()
  }

  return <EditWorkoutForm workout={workout} exercises={exercises} />
}
