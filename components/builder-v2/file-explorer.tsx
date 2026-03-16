"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  File,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  Search,
  FileCode,
  FileJson,
  FileText,
  Trash2,
  Copy,
  Edit
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { ProjectFile } from "@/lib/builder-v2/types"

interface FileExplorerProps {
  files: ProjectFile[]
  selectedFile: ProjectFile | null
  onFileSelect: (file: ProjectFile) => void
}

// Get icon based on file extension
function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase()
  switch (ext) {
    case "tsx":
    case "ts":
    case "jsx":
    case "js":
      return <FileCode className="h-4 w-4 text-blue-500" />
    case "json":
      return <FileJson className="h-4 w-4 text-yellow-500" />
    case "css":
      return <FileText className="h-4 w-4 text-purple-500" />
    case "md":
      return <FileText className="h-4 w-4 text-gray-500" />
    default:
      return <File className="h-4 w-4" />
  }
}

// Group files by directory
function groupFilesByDirectory(files: ProjectFile[]) {
  const tree: Record<string, ProjectFile[]> = {}
  
  files.forEach(file => {
    const parts = file.path.split("/").filter(Boolean)
    const dir = parts.length > 1 ? "/" + parts.slice(0, -1).join("/") : "/"
    if (!tree[dir]) tree[dir] = []
    tree[dir].push(file)
  })
  
  return tree
}

export function FileExplorer({ files, selectedFile, onFileSelect }: FileExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(["/app"]))

  const toggleDir = useCallback((dir: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev)
      if (next.has(dir)) {
        next.delete(dir)
      } else {
        next.add(dir)
      }
      return next
    })
  }, [])

  const fileTree = groupFilesByDirectory(files)
  const filteredFiles = searchQuery
    ? files.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : null

  if (files.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Folder className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold">No files</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-[260px]">
          Use the chat to generate your project. Files will appear here once the AI creates them.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Search */}
      <div className="border-b p-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>

      {/* File Tree */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredFiles ? (
            // Search results
            <div className="space-y-1">
              {filteredFiles.map(file => (
                <ContextMenu key={file.id}>
                  <ContextMenuTrigger asChild>
                    <button
                      onClick={() => onFileSelect(file)}
                      className={cn(
                        "flex w-full min-h-[44px] items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent min-w-0",
                        selectedFile?.id === file.id && "bg-accent"
                      )}
                    >
                      {getFileIcon(file.name)}
                      <span className="truncate">{file.name}</span>
                      {file.isModified && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-blue-500" />
                      )}
                    </button>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem>
                      <Copy className="mr-2 h-4 w-4" /> Copy Path
                    </ContextMenuItem>
                    <ContextMenuItem>
                      <Edit className="mr-2 h-4 w-4" /> Rename
                    </ContextMenuItem>
                    <ContextMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          ) : (
            // Directory tree
            <div className="space-y-1">
              {Object.entries(fileTree).sort().map(([dir, dirFiles]) => (
                <div key={dir}>
                  {/* Directory */}
                  <button
                    onClick={() => toggleDir(dir)}
                    className="flex w-full min-h-[44px] items-center gap-1 rounded-md px-2 py-2 text-sm hover:bg-accent min-w-0"
                  >
                    {expandedDirs.has(dir) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    {expandedDirs.has(dir) ? (
                      <FolderOpen className="h-4 w-4 text-blue-500" />
                    ) : (
                      <Folder className="h-4 w-4 text-blue-500" />
                    )}
                    <span className="font-medium">{dir.split("/").pop() || "root"}</span>
                  </button>

                  {/* Files in directory */}
                  {expandedDirs.has(dir) && (
                    <div className="ml-4 space-y-1">
                      {dirFiles.map(file => (
                        <ContextMenu key={file.id}>
                          <ContextMenuTrigger asChild>
                            <button
                              onClick={() => onFileSelect(file)}
                              className={cn(
                                "flex w-full min-h-[44px] items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent min-w-0",
                                selectedFile?.id === file.id && "bg-accent"
                              )}
                            >
                              {getFileIcon(file.name)}
                              <span className="truncate">{file.name}</span>
                              {file.isModified && (
                                <span className="ml-auto h-2 w-2 rounded-full bg-blue-500" />
                              )}
                            </button>
                          </ContextMenuTrigger>
                          <ContextMenuContent>
                            <ContextMenuItem>
                              <Copy className="mr-2 h-4 w-4" /> Copy Path
                            </ContextMenuItem>
                            <ContextMenuItem>
                              <Edit className="mr-2 h-4 w-4" /> Rename
                            </ContextMenuItem>
                            <ContextMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </ContextMenuItem>
                          </ContextMenuContent>
                        </ContextMenu>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="border-t p-2">
        <Button variant="outline" size="sm" className="w-full gap-2">
          <Plus className="h-4 w-4" />
          New File
        </Button>
      </div>
    </div>
  )
}
