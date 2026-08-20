import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import { ArrowLeft } from "lucide-react"

import { getWorkoutByIdForCurrentUser } from "@/data/workouts"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const workout = await getWorkoutByIdForCurrentUser(id)

  if (!workout) {
    notFound()
  }

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

      <Card>
        <CardHeader>
          <CardTitle>{workout.name ?? "Workout"}</CardTitle>
          <CardDescription>
            Started at {format(workout.startedAt, "p")} on{" "}
            {format(workout.startedAt, "do MMM yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {workout.workoutExercises.map((workoutExercise, index) => (
            <div key={workoutExercise.id} className="flex flex-col gap-2">
              {index > 0 && <Separator className="mb-2" />}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {workoutExercise.exercise?.name ?? "Unknown exercise"}
                </span>
                <Badge variant="secondary">
                  {workoutExercise.sets.length} sets
                </Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                {workoutExercise.sets.map((set) => (
                  <Badge key={set.id} variant="outline">
                    {set.weight}kg × {set.reps}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
