"use client"

import * as React from "react"
import Link from "next/link"
import { format, isSameDay } from "date-fns"
import { CalendarIcon, Dumbbell, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

type LoggedSet = {
  id: string
  setNumber: number
  weight: string | null
  reps: number
}

type LoggedExercise = {
  id: string
  name: string
  sets: LoggedSet[]
}

type LoggedWorkout = {
  id: string
  name: string | null
  startedAt: Date
  exercises: LoggedExercise[]
}

export function DashboardClient({
  workouts,
}: {
  workouts: LoggedWorkout[]
}) {
  const [date, setDate] = React.useState<Date>(new Date())
  const [open, setOpen] = React.useState(false)

  const workoutsForDate = workouts.filter((workout) =>
    isSameDay(workout.startedAt, date)
  )

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 sm:p-10">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Review the workouts you&apos;ve logged for a given day.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/dashboard/workout/new" />}>
          <Plus />
          Log workout
        </Button>
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              className={cn(
                "w-[240px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon />
              {format(date, "do MMM yyyy")}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selected) => {
              if (selected) {
                setDate(selected)
                setOpen(false)
              }
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>

      <div className="flex flex-col gap-4">
        {workoutsForDate.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <Dumbbell className="size-8 text-muted-foreground" />
              <CardTitle>No workouts logged</CardTitle>
              <CardDescription>
                Nothing was logged for {format(date, "do MMM yyyy")}.
              </CardDescription>
            </CardContent>
          </Card>
        ) : (
          workoutsForDate.map((workout) => (
            <Card key={workout.id}>
              <CardHeader>
                <CardTitle>{workout.name ?? "Workout"}</CardTitle>
                <CardDescription>
                  Started at {format(workout.startedAt, "p")}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {workout.exercises.map((exercise, index) => (
                  <div key={exercise.id} className="flex flex-col gap-2">
                    {index > 0 && <Separator className="mb-2" />}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {exercise.name}
                      </span>
                      <Badge variant="secondary">
                        {exercise.sets.length} sets
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {exercise.sets.map((set) => (
                        <Badge key={set.id} variant="outline">
                          {set.weight}kg × {set.reps}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
