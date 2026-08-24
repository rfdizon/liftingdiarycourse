import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { getWorkoutByIdForCurrentUser } from "@/data/workouts"
import { getAllExercises } from "@/data/exercises"
import { Button } from "@/components/ui/button"
import { WorkoutEditForm } from "./workout-edit-form"

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [workout, availableExercises] = await Promise.all([
    getWorkoutByIdForCurrentUser(id),
    getAllExercises(),
  ])

  if (!workout) {
    notFound()
  }

  const exercises = workout.workoutExercises.map((workoutExercise) => ({
    key: workoutExercise.id,
    id: workoutExercise.id,
    exerciseId: workoutExercise.exerciseId,
    name: workoutExercise.exercise?.name ?? "Unknown exercise",
    sets: workoutExercise.sets.map((set) => ({
      id: set.id,
      key: set.id,
      weight: set.weight ?? "",
      reps: String(set.reps),
    })),
  }))

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 sm:p-10">
      <div>
        <Button
          variant="outline"
          size="sm"
          render={
            <Link href="/dashboard">
              <ArrowLeft />
              Back to dashboard
            </Link>
          }
        />
      </div>

      <WorkoutEditForm
        workoutId={workout.id}
        initialName={workout.name}
        initialStartedAt={workout.startedAt}
        initialExercises={exercises}
        availableExercises={availableExercises}
      />
    </div>
  )
}
