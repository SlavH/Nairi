"use client"

import { useRef, useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FlowStoryStep {
  id: string
  type: "prompt" | "intermediate" | "final"
  content: string
}

export interface FlowStory {
  id: string
  title: string
  steps: FlowStoryStep[]
  created_at: string
}

interface FlowStoriesProps {
  stories: FlowStory[]
  onStoryClick?: (story: FlowStory, stepIndex: number) => void
}

function StoryCard({ story, onClick }: { story: FlowStory; onClick: (stepIndex: number) => void }) {
  const stepLabels = ["Prompt", "Process", "Result"]
  const stepColors = [
    "from-purple-500 to-pink-500",
    "from-blue-500 to-cyan-500",
    "from-green-500 to-emerald-500",
  ]
  
  return (
    <div className="flex flex-col gap-2 min-w-[140px]">
      <div className="flex gap-2">
        {story.steps.slice(0, 3).map((step, index) => (
          <button
            key={step.id}
            onClick={() => onClick(index)}
            className={cn(
              "flex-1 h-20 rounded-xl bg-gradient-to-br p-0.5 transition-transform hover:scale-105",
              stepColors[index]
            )}
          >
            <div className="w-full h-full rounded-[10px] bg-[#0d0d0d] flex items-center justify-center p-2">
              <span className="text-[10px] font-medium text-white/80 line-clamp-2 text-center">
                {step.content.substring(0, 40)}...
              </span>
            </div>
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 px-1">
        <Sparkles className="h-3 w-3 text-[#e052a0] shrink-0" />
        <span className="text-xs text-white/80 truncate">{story.title}</span>
      </div>
    </div>
  )
}

function StoryStepModal({ 
  story, 
  stepIndex, 
  onClose,
  onStepChange 
}: { 
  story: FlowStory
  stepIndex: number
  onClose: () => void
  onStepChange: (index: number) => void
}) {
  const step = story.steps[stepIndex]
  const stepLabels = ["Prompt", "Process", "Result"]
  const stepColors = ["text-purple-400", "text-blue-400", "text-green-400"]
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{story.title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            &times;
          </button>
        </div>
        
        <div className="flex gap-2 mb-4">
          {stepLabels.map((label, idx) => (
            <button
              key={label}
              onClick={() => onStepChange(idx)}
              className={cn(
                "flex-1 py-2 rounded-lg text-sm font-medium transition-all",
                stepIndex === idx
                  ? "bg-white/20 text-white"
                  : "bg-white/5 text-muted-foreground hover:bg-white/10"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        
        <div className="bg-[#0d0d0d] rounded-xl p-4 min-h-[150px]">
          <p className={cn("text-sm font-medium mb-2", stepColors[stepIndex])}>
            {stepLabels[stepIndex]}
          </p>
          <p className="text-white/90 text-sm whitespace-pre-wrap">
            {step.content}
          </p>
        </div>
        
        <div className="flex justify-between mt-4">
          <button
            onClick={() => onStepChange(Math.max(0, stepIndex - 1))}
            disabled={stepIndex === 0}
            className={cn(
              "px-4 py-2 rounded-lg text-sm transition-all",
              stepIndex === 0
                ? "bg-white/5 text-muted-foreground cursor-not-allowed"
                : "bg-white/10 text-white hover:bg-white/20"
            )}
          >
            Previous
          </button>
          <button
            onClick={() => onStepChange(Math.min(story.steps.length - 1, stepIndex + 1))}
            disabled={stepIndex === story.steps.length - 1}
            className={cn(
              "px-4 py-2 rounded-lg text-sm transition-all",
              stepIndex === story.steps.length - 1
                ? "bg-white/5 text-muted-foreground cursor-not-allowed"
                : "bg-white/10 text-white hover:bg-white/20"
            )}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export function FlowStories({ stories, onStoryClick }: FlowStoriesProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [selectedStory, setSelectedStory] = useState<FlowStory | null>(null)
  const [selectedStep, setSelectedStep] = useState(0)
  
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }
  
  useEffect(() => {
    checkScroll()
    const scrollEl = scrollRef.current
    if (scrollEl) {
      scrollEl.addEventListener("scroll", checkScroll)
      window.addEventListener("resize", checkScroll)
    }
    return () => {
      if (scrollEl) {
        scrollEl.removeEventListener("scroll", checkScroll)
      }
      window.removeEventListener("resize", checkScroll)
    }
  }, [stories])
  
  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 300
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      })
    }
  }
  
  const handleStoryClick = (story: FlowStory, stepIndex: number) => {
    setSelectedStory(story)
    setSelectedStep(stepIndex)
    onStoryClick?.(story, stepIndex)
  }
  
  if (stories.length === 0) {
    return null
  }
  
  return (
    <>
      <div className="relative group">
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {stories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              onClick={(stepIndex) => handleStoryClick(story, stepIndex)}
            />
          ))}
        </div>
        
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {selectedStory && (
        <StoryStepModal
          story={selectedStory}
          stepIndex={selectedStep}
          onClose={() => setSelectedStory(null)}
          onStepChange={setSelectedStep}
        />
      )}
    </>
  )
}
