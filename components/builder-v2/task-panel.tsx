"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  Clock,
  Sparkles,
  Search,
  Code,
  TestTube,
  Wrench
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { BuildPlan, Task } from "@/lib/builder-v2/types"

interface TaskPanelProps {
  plan: BuildPlan | null
}

const TASK_ICONS: Record<string, React.ReactNode> = {
  "Analyzing requirements": <Search className="h-4 w-4" />,
  "Planning component structure": <Sparkles className="h-4 w-4" />,
  "Generating code": <Code className="h-4 w-4" />,
  "Running quality checks": <TestTube className="h-4 w-4" />,
  "Applying autofixes": <Wrench className="h-4 w-4" />,
}

export function TaskPanel({ plan }: TaskPanelProps) {
  if (!plan) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold">No Active Tasks</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Start a conversation to see the build plan here.
        </p>
      </div>
    )
  }

  const completedTasks = plan.tasks.filter(t => t.status === "completed").length
  const totalTasks = plan.tasks.length
  const progress = Math.round((completedTasks / totalTasks) * 100)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold truncate">{plan.title}</h3>
          <Badge
            variant={plan.status === "completed" ? "default" : plan.status === "failed" ? "destructive" : "secondary"}
          >
            {plan.status}
          </Badge>
        </div>
        
        {/* Progress bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{completedTasks}/{totalTasks} tasks</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500",
                plan.status === "failed" ? "bg-destructive" : "bg-primary"
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tasks */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {plan.tasks.map((task, index) => (
            <div
              key={task.id}
              className={cn(
                "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                task.status === "in-progress" && "border-primary bg-primary/5",
                task.status === "completed" && "border-green-500/30 bg-green-500/5",
                task.status === "failed" && "border-destructive/30 bg-destructive/5"
              )}
            >
              {/* Status Icon */}
              <div className="mt-0.5">
                {task.status === "completed" && (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                )}
                {task.status === "in-progress" && (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                )}
                {task.status === "failed" && (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
                {task.status === "pending" && (
                  <Circle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* Task Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {TASK_ICONS[task.title] || <Sparkles className="h-4 w-4" />}
                  <span className={cn(
                    "font-medium text-sm",
                    task.status === "completed" && "text-muted-foreground"
                  )}>
                    {task.title}
                  </span>
                </div>
                {task.description && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {task.description}
                  </p>
                )}

                {/* Subtasks */}
                {task.subtasks && task.subtasks.length > 0 && (
                  <div className="mt-2 space-y-1 pl-2 border-l-2 border-muted">
                    {task.subtasks.map(subtask => (
                      <div key={subtask.id} className="flex items-center gap-2 text-xs">
                        {subtask.status === "completed" ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : subtask.status === "in-progress" ? (
                          <Loader2 className="h-3 w-3 text-primary animate-spin" />
                        ) : (
                          <Circle className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className={cn(
                          subtask.status === "completed" && "text-muted-foreground line-through"
                        )}>
                          {subtask.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Step number */}
              <span className="text-xs text-muted-foreground">
                {index + 1}
              </span>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
