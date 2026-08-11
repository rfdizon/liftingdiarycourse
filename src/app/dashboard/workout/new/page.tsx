import { getAllExercises } from "@/data/exercises"
import { NewWorkoutForm } from "./new-workout-form"

export default async function NewWorkoutPage() {
  const exercises = await getAllExercises()

  return <NewWorkoutForm exercises={exercises} />
}
