"use client"

import { useState, useEffect, useRef } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { 
  AtSign, 
  Slash, 
  FileText, 
  Image, 
  Code, 
  Globe, 
  Calculator,
  Calendar,
  Mail,
  Search,
  Sparkles,
  Brain,
  MessageSquare,
  Zap
} from "lucide-react"

interface CommandMenuProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (command: CommandItem) => void
  triggerType: "@" | "/"
  inputRef?: React.RefObject<HTMLTextAreaElement>
}

interface CommandItem {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  action: string
  category: string
}

const mentionCommands: CommandItem[] = [
  {
    id: "web",
    label: "Web",
    description: "Search the web for information",
    icon: <Globe className="h-4 w-4" />,
    action: "search_web",
    category: "Sources"
  },
  {
    id: "docs",
    label: "Docs",
    description: "Search your documents",
    icon: <FileText className="h-4 w-4" />,
    action: "search_docs",
    category: "Sources"
  },
  {
    id: "code",
    label: "Code",
    description: "Search code repositories",
    icon: <Code className="h-4 w-4" />,
    action: "search_code",
    category: "Sources"
  },
  {
    id: "images",
    label: "Images",
    description: "Search for images",
    icon: <Image className="h-4 w-4" />,
    action: "search_images",
    category: "Sources"
  },
]

const slashCommands: CommandItem[] = [
  {
    id: "summarize",
    label: "Summarize",
    description: "Summarize text or document",
    icon: <FileText className="h-4 w-4" />,
    action: "summarize",
    category: "Actions"
  },
  {
    id: "translate",
    label: "Translate",
    description: "Translate to another language",
    icon: <Globe className="h-4 w-4" />,
    action: "translate",
    category: "Actions"
  },
  {
    id: "explain",
    label: "Explain",
    description: "Explain like I'm 5",
    icon: <Brain className="h-4 w-4" />,
    action: "explain",
    category: "Actions"
  },
  {
    id: "code",
    label: "Code",
    description: "Write or analyze code",
    icon: <Code className="h-4 w-4" />,
    action: "code",
    category: "Actions"
  },
  {
    id: "image",
    label: "Image",
    description: "Generate an image",
    icon: <Image className="h-4 w-4" />,
    action: "generate_image",
    category: "Generate"
  },
  {
    id: "calculate",
    label: "Calculate",
    description: "Perform calculations",
    icon: <Calculator className="h-4 w-4" />,
    action: "calculate",
    category: "Tools"
  },
  {
    id: "research",
    label: "Research",
    description: "Deep research on a topic",
    icon: <Search className="h-4 w-4" />,
    action: "deep_research",
    category: "Actions"
  },
  {
    id: "brainstorm",
    label: "Brainstorm",
    description: "Generate creative ideas",
    icon: <Sparkles className="h-4 w-4" />,
    action: "brainstorm",
    category: "Generate"
  },
]

export function CommandMenu({ isOpen, onClose, onSelect, triggerType, inputRef }: CommandMenuProps) {
  const [search, setSearch] = useState("")
  const commands = triggerType === "@" ? mentionCommands : slashCommands
  
  const filteredCommands = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(search.toLowerCase()) ||
    cmd.description.toLowerCase().includes(search.toLowerCase())
  )

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = []
    }
    acc[cmd.category].push(cmd)
    return acc
  }, {} as Record<string, CommandItem[]>)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
    }
    
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="absolute bottom-full left-0 mb-2 w-80 z-50">
      <Command className="rounded-lg border shadow-lg bg-popover">
        <CommandInput 
          placeholder={triggerType === "@" ? "Search sources..." : "Search commands..."}
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {Object.entries(groupedCommands).map(([category, items], idx) => (
            <div key={category}>
              {idx > 0 && <CommandSeparator />}
              <CommandGroup heading={category}>
                {items.map((item) => (
                  <CommandItem
                    key={item.id}
                    onSelect={() => {
                      onSelect(item)
                      onClose()
                    }}
                    className="flex items-center gap-3 py-2 cursor-pointer"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </Command>
    </div>
  )
}
