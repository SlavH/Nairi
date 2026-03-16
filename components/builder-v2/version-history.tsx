"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty"
import {
  History,
  RotateCcw,
  GitCommit,
  Clock,
  FileCode,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProjectVersion } from "@/lib/builder-v2/types"

interface VersionHistoryProps {
  versions: ProjectVersion[]
  onRestore: (version: ProjectVersion) => void
}

export function VersionHistory({ versions, onRestore }: VersionHistoryProps) {
  if (versions.length === 0) {
    return (
      <Empty className="flex h-full flex-col items-center justify-center p-8">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <History className="h-6 w-6" />
          </EmptyMedia>
          <EmptyTitle>No Version History</EmptyTitle>
          <EmptyDescription>
            Each generation creates a new version you can restore.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <h3 className="font-semibold flex items-center gap-2">
          <GitCommit className="h-4 w-4" />
          Version History
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {versions.length} version{versions.length !== 1 ? "s" : ""} saved
        </p>
      </div>

      {/* Versions List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {versions.slice().reverse().map((version, index) => (
            <div
              key={version.id}
              className={cn(
                "rounded-lg border p-3 transition-colors",
                version.isCurrent && "border-primary bg-primary/5"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{version.name}</span>
                    {version.isCurrent && (
                      <Badge variant="default" className="text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground truncate">
                    {version.description}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {version.createdAt.toLocaleTimeString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileCode className="h-3 w-3" />
                      {version.files.length} files
                    </span>
                  </div>
                </div>

                {!version.isCurrent && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 min-h-[44px]"
                    onClick={() => onRestore(version)}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Restore
                  </Button>
                )}
              </div>

              {/* Files changed */}
              <div className="mt-3 pt-3 border-t">
                <div className="flex flex-wrap gap-1">
                  {version.files.slice(0, 3).map(file => (
                    <Badge key={file.id} variant="secondary" className="text-xs">
                      {file.name}
                    </Badge>
                  ))}
                  {version.files.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{version.files.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
