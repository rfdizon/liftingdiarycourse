import { getWorkoutsForCurrentUser } from "@/data/workouts"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  const workouts = await getWorkoutsForCurrentUser()

  const loggedWorkouts = workouts.map((workout) => ({
    id: workout.id,
    name: workout.name,
    startedAt: workout.startedAt,
    exercises: workout.workoutExercises.map((workoutExercise) => ({
      id: workoutExercise.id,
      name: workoutExercise.exercise?.name ?? "Unknown exercise",
      sets: workoutExercise.sets.map((set) => ({
        id: set.id,
        setNumber: set.setNumber,
        weight: set.weight,
        reps: set.reps,
      })),
    })),
  }))

  return <DashboardClient workouts={loggedWorkouts} />
}
