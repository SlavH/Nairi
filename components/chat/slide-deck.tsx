import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Slide {
  title: string;
  content: string;
}

interface SlideDeckProps {
  slides: Slide[];
}

export function SlideDeck({ slides }: SlideDeckProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const next = () => setCurrentSlide((prev) => Math.min(prev + 1, slides.length - 1));
  const prev = () => setCurrentSlide((prev) => Math.max(prev - 1, 0));

  return (
    <div className="flex flex-col h-full bg-slate-900 rounded-lg overflow-hidden border border-white/10 shadow-xl">
      <div className="flex-1 relative p-8 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold bg-gradient-to-r from-[#e052a0] to-[#00c9c8] bg-clip-text text-transparent mb-6">
              {slides[currentSlide].title}
            </h2>
            <p className="text-xl text-slate-300 leading-relaxed">
              {slides[currentSlide].content}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
      
      <div className="p-4 bg-black/20 flex justify-between items-center">
        <Button variant="ghost" onClick={prev} disabled={currentSlide === 0}>
          <ChevronLeft />
        </Button>
        <span className="text-sm text-slate-400">
          {currentSlide + 1} / {slides.length}
        </span>
        <Button variant="ghost" onClick={next} disabled={currentSlide === slides.length - 1}>
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
