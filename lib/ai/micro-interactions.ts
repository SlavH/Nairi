/**
 * Micro-Interactions Library
 * Pre-built animation patterns for common UI interactions
 */

export interface MicroInteraction {
  name: string;
  description: string;
  category: 'hover' | 'click' | 'focus' | 'loading' | 'success' | 'error' | 'scroll' | 'gesture';
  css: string;
  tailwind: string;
  keyframes?: string;
  example: string;
}

export const MICRO_INTERACTIONS: MicroInteraction[] = [
  // ===== HOVER EFFECTS =====
  {
    name: 'Lift on Hover',
    description: 'Card lifts up with shadow on hover',
    category: 'hover',
    css: `
.lift-hover {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.lift-hover:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px -8px rgba(0,0,0,0.15);
}`,
    tailwind: 'transition-all duration-200 hover:-translate-y-1 hover:shadow-xl',
    example: '<div className="transition-all duration-200 hover:-translate-y-1 hover:shadow-xl">Card</div>'
  },
  {
    name: 'Scale on Hover',
    description: 'Element scales up slightly on hover',
    category: 'hover',
    css: `
.scale-hover {
  transition: transform 0.2s ease;
}
.scale-hover:hover {
  transform: scale(1.05);
}`,
    tailwind: 'transition-transform duration-200 hover:scale-105',
    example: '<button className="transition-transform duration-200 hover:scale-105">Button</button>'
  },
  {
    name: 'Glow on Hover',
    description: 'Adds a colored glow effect on hover',
    category: 'hover',
    css: `
.glow-hover {
  transition: box-shadow 0.3s ease;
}
.glow-hover:hover {
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
}`,
    tailwind: 'transition-shadow duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]',
    example: '<button className="transition-shadow duration-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.5)]">Glow</button>'
  },
  {
    name: 'Border Reveal',
    description: 'Border animates in on hover',
    category: 'hover',
    css: `
.border-reveal {
  position: relative;
  overflow: hidden;
}
.border-reveal::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: currentColor;
  transition: width 0.3s ease;
}
.border-reveal:hover::after {
  width: 100%;
}`,
    tailwind: 'relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-current after:transition-all after:duration-300 hover:after:w-full',
    example: '<a className="relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-current after:transition-all after:duration-300 hover:after:w-full">Link</a>'
  },
  {
    name: 'Color Shift',
    description: 'Background color smoothly transitions on hover',
    category: 'hover',
    css: `
.color-shift {
  transition: background-color 0.3s ease, color 0.3s ease;
}
.color-shift:hover {
  background-color: var(--primary);
  color: white;
}`,
    tailwind: 'transition-colors duration-300 hover:bg-primary hover:text-white',
    example: '<button className="bg-gray-100 transition-colors duration-300 hover:bg-indigo-600 hover:text-white">Button</button>'
  },
  {
    name: 'Icon Slide',
    description: 'Icon slides in from left on hover',
    category: 'hover',
    css: `
.icon-slide .icon {
  transform: translateX(-10px);
  opacity: 0;
  transition: all 0.3s ease;
}
.icon-slide:hover .icon {
  transform: translateX(0);
  opacity: 1;
}`,
    tailwind: 'group',
    example: `<button className="group flex items-center gap-2">
  <span className="-translate-x-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">→</span>
  <span>Learn More</span>
</button>`
  },
  
  // ===== CLICK EFFECTS =====
  {
    name: 'Ripple Effect',
    description: 'Material Design ripple on click',
    category: 'click',
    css: `
.ripple {
  position: relative;
  overflow: hidden;
}
.ripple::after {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 10%, transparent 10%);
  transform: scale(10);
  opacity: 0;
  transition: transform 0.5s, opacity 0.5s;
}
.ripple:active::after {
  transform: scale(0);
  opacity: 1;
  transition: 0s;
}`,
    tailwind: 'relative overflow-hidden active:scale-95 transition-transform',
    example: '<button className="relative overflow-hidden active:scale-95 transition-transform">Click Me</button>'
  },
  {
    name: 'Press Down',
    description: 'Button presses down on click',
    category: 'click',
    css: `
.press-down {
  transition: transform 0.1s ease;
}
.press-down:active {
  transform: scale(0.95);
}`,
    tailwind: 'transition-transform active:scale-95',
    example: '<button className="transition-transform active:scale-95">Press</button>'
  },
  {
    name: 'Bounce Click',
    description: 'Bouncy feedback on click',
    category: 'click',
    css: `
.bounce-click:active {
  animation: bounce-click 0.3s ease;
}
@keyframes bounce-click {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(0.9); }
}`,
    tailwind: 'active:animate-bounce-click',
    keyframes: `@keyframes bounce-click {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(0.9); }
}`,
    example: '<button className="active:animate-[bounce-click_0.3s_ease]">Bounce</button>'
  },
  
  // ===== FOCUS EFFECTS =====
  {
    name: 'Ring Focus',
    description: 'Animated focus ring',
    category: 'focus',
    css: `
.ring-focus {
  outline: none;
  transition: box-shadow 0.2s ease;
}
.ring-focus:focus {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.5);
}`,
    tailwind: 'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-shadow',
    example: '<input className="focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-shadow" />'
  },
  {
    name: 'Border Focus',
    description: 'Border color changes on focus',
    category: 'focus',
    css: `
.border-focus {
  border: 2px solid #e5e7eb;
  transition: border-color 0.2s ease;
}
.border-focus:focus {
  border-color: #6366f1;
}`,
    tailwind: 'border-2 border-gray-200 focus:border-indigo-500 transition-colors outline-none',
    example: '<input className="border-2 border-gray-200 focus:border-indigo-500 transition-colors outline-none" />'
  },
  {
    name: 'Label Float',
    description: 'Label floats up when input is focused',
    category: 'focus',
    css: `
.float-label {
  position: relative;
}
.float-label label {
  position: absolute;
  top: 50%;
  left: 12px;
  transform: translateY(-50%);
  transition: all 0.2s ease;
  pointer-events: none;
}
.float-label input:focus + label,
.float-label input:not(:placeholder-shown) + label {
  top: 0;
  font-size: 12px;
  background: white;
  padding: 0 4px;
}`,
    tailwind: 'peer',
    example: `<div className="relative">
  <input className="peer placeholder-transparent" placeholder="Email" />
  <label className="absolute left-3 top-1/2 -translate-y-1/2 transition-all peer-focus:top-0 peer-focus:text-xs peer-focus:bg-white peer-focus:px-1">Email</label>
</div>`
  },
  
  // ===== LOADING STATES =====
  {
    name: 'Spinner',
    description: 'Simple spinning loader',
    category: 'loading',
    css: `
.spinner {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}`,
    tailwind: 'animate-spin',
    example: '<div className="w-6 h-6 border-2 border-gray-200 border-t-indigo-600 rounded-full animate-spin" />'
  },
  {
    name: 'Pulse',
    description: 'Pulsing placeholder animation',
    category: 'loading',
    css: `
.pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}`,
    tailwind: 'animate-pulse',
    example: '<div className="h-4 bg-gray-200 rounded animate-pulse" />'
  },
  {
    name: 'Skeleton',
    description: 'Shimmer loading skeleton',
    category: 'loading',
    css: `
.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}`,
    tailwind: 'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]',
    keyframes: `@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}`,
    example: '<div className="h-4 rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-[shimmer_1.5s_infinite]" />'
  },
  {
    name: 'Dots Loading',
    description: 'Three bouncing dots',
    category: 'loading',
    css: `
.dots-loading span {
  animation: dots-bounce 1.4s infinite ease-in-out both;
}
.dots-loading span:nth-child(1) { animation-delay: -0.32s; }
.dots-loading span:nth-child(2) { animation-delay: -0.16s; }
@keyframes dots-bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}`,
    tailwind: 'flex gap-1',
    keyframes: `@keyframes dots-bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}`,
    example: `<div className="flex gap-1">
  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-[dots-bounce_1.4s_infinite_ease-in-out_-0.32s]" />
  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-[dots-bounce_1.4s_infinite_ease-in-out_-0.16s]" />
  <span className="w-2 h-2 bg-indigo-600 rounded-full animate-[dots-bounce_1.4s_infinite_ease-in-out]" />
</div>`
  },
  {
    name: 'Progress Bar',
    description: 'Animated progress bar',
    category: 'loading',
    css: `
.progress-bar {
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  overflow: hidden;
}
.progress-bar::after {
  content: '';
  display: block;
  width: 30%;
  height: 100%;
  background: #6366f1;
  animation: progress 1.5s infinite;
}
@keyframes progress {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}`,
    tailwind: 'w-full h-1 bg-gray-200 overflow-hidden',
    keyframes: `@keyframes progress {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}`,
    example: `<div className="w-full h-1 bg-gray-200 overflow-hidden">
  <div className="w-1/3 h-full bg-indigo-600 animate-[progress_1.5s_infinite]" />
</div>`
  },
  
  // ===== SUCCESS/ERROR STATES =====
  {
    name: 'Checkmark',
    description: 'Animated checkmark for success',
    category: 'success',
    css: `
.checkmark {
  stroke-dasharray: 50;
  stroke-dashoffset: 50;
  animation: checkmark 0.5s ease forwards;
}
@keyframes checkmark {
  to { stroke-dashoffset: 0; }
}`,
    tailwind: 'animate-[checkmark_0.5s_ease_forwards]',
    keyframes: `@keyframes checkmark {
  from { stroke-dashoffset: 50; }
  to { stroke-dashoffset: 0; }
}`,
    example: `<svg className="w-6 h-6 text-green-500">
  <path className="stroke-current stroke-2 fill-none animate-[checkmark_0.5s_ease_forwards]" style={{strokeDasharray: 50, strokeDashoffset: 50}} d="M5 12l5 5L20 7" />
</svg>`
  },
  {
    name: 'Success Bounce',
    description: 'Icon bounces in on success',
    category: 'success',
    css: `
.success-bounce {
  animation: success-bounce 0.5s ease;
}
@keyframes success-bounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}`,
    tailwind: 'animate-[success-bounce_0.5s_ease]',
    keyframes: `@keyframes success-bounce {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}`,
    example: '<div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center animate-[success-bounce_0.5s_ease]">✓</div>'
  },
  {
    name: 'Shake Error',
    description: 'Shake animation for errors',
    category: 'error',
    css: `
.shake-error {
  animation: shake 0.5s ease;
}
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-10px); }
  40%, 80% { transform: translateX(10px); }
}`,
    tailwind: 'animate-[shake_0.5s_ease]',
    keyframes: `@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-10px); }
  40%, 80% { transform: translateX(10px); }
}`,
    example: '<input className="border-red-500 animate-[shake_0.5s_ease]" />'
  },
  
  // ===== SCROLL ANIMATIONS =====
  {
    name: 'Fade In Up',
    description: 'Element fades in while moving up',
    category: 'scroll',
    css: `
.fade-in-up {
  opacity: 0;
  transform: translateY(20px);
  animation: fade-in-up 0.6s ease forwards;
}
@keyframes fade-in-up {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}`,
    tailwind: 'animate-[fade-in-up_0.6s_ease_forwards]',
    keyframes: `@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}`,
    example: '<div className="opacity-0 translate-y-5 animate-[fade-in-up_0.6s_ease_forwards]">Content</div>'
  },
  {
    name: 'Slide In Left',
    description: 'Element slides in from left',
    category: 'scroll',
    css: `
.slide-in-left {
  opacity: 0;
  transform: translateX(-50px);
  animation: slide-in-left 0.6s ease forwards;
}
@keyframes slide-in-left {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}`,
    tailwind: 'animate-[slide-in-left_0.6s_ease_forwards]',
    keyframes: `@keyframes slide-in-left {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}`,
    example: '<div className="opacity-0 -translate-x-12 animate-[slide-in-left_0.6s_ease_forwards]">Content</div>'
  },
  {
    name: 'Scale In',
    description: 'Element scales in from small',
    category: 'scroll',
    css: `
.scale-in {
  opacity: 0;
  transform: scale(0.8);
  animation: scale-in 0.5s ease forwards;
}
@keyframes scale-in {
  to {
    opacity: 1;
    transform: scale(1);
  }
}`,
    tailwind: 'animate-[scale-in_0.5s_ease_forwards]',
    keyframes: `@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}`,
    example: '<div className="opacity-0 scale-75 animate-[scale-in_0.5s_ease_forwards]">Content</div>'
  },
  {
    name: 'Stagger Children',
    description: 'Children animate in sequence',
    category: 'scroll',
    css: `
.stagger-children > * {
  opacity: 0;
  transform: translateY(20px);
  animation: fade-in-up 0.5s ease forwards;
}
.stagger-children > *:nth-child(1) { animation-delay: 0.1s; }
.stagger-children > *:nth-child(2) { animation-delay: 0.2s; }
.stagger-children > *:nth-child(3) { animation-delay: 0.3s; }
.stagger-children > *:nth-child(4) { animation-delay: 0.4s; }
.stagger-children > *:nth-child(5) { animation-delay: 0.5s; }`,
    tailwind: '[&>*]:opacity-0 [&>*]:translate-y-5 [&>*]:animate-[fade-in-up_0.5s_ease_forwards] [&>*:nth-child(1)]:delay-100 [&>*:nth-child(2)]:delay-200 [&>*:nth-child(3)]:delay-300',
    keyframes: `@keyframes fade-in-up {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}`,
    example: `<div className="[&>*]:opacity-0 [&>*]:translate-y-5 [&>*]:animate-[fade-in-up_0.5s_ease_forwards] [&>*:nth-child(1)]:delay-100 [&>*:nth-child(2)]:delay-200 [&>*:nth-child(3)]:delay-300">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>`
  }
];

/**
 * Get interactions by category
 */
export function getInteractionsByCategory(category: MicroInteraction['category']): MicroInteraction[] {
  return MICRO_INTERACTIONS.filter(i => i.category === category);
}

/**
 * Get all unique keyframes needed for selected interactions
 */
export function getRequiredKeyframes(interactions: MicroInteraction[]): string {
  const keyframes = interactions
    .filter(i => i.keyframes)
    .map(i => i.keyframes!)
    .filter((v, i, a) => a.indexOf(v) === i); // unique
  
  return keyframes.join('\n\n');
}

/**
 * Generate Tailwind config extension for custom animations
 */
export function generateTailwindConfig(): string {
  return `
// Add to tailwind.config.js
module.exports = {
  theme: {
    extend: {
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        'slide-in-left': {
          '0%': { opacity: '0', transform: 'translateX(-50px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' }
        },
        'success-bounce': {
          '0%': { transform: 'scale(0)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' }
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-10px)' },
          '40%, 80%': { transform: 'translateX(10px)' }
        },
        'shimmer': {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' }
        },
        'dots-bounce': {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' }
        }
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s ease forwards',
        'slide-in-left': 'slide-in-left 0.6s ease forwards',
        'scale-in': 'scale-in 0.5s ease forwards',
        'success-bounce': 'success-bounce 0.5s ease',
        'shake': 'shake 0.5s ease',
        'shimmer': 'shimmer 1.5s infinite'
      }
    }
  }
}
`;
}

/**
 * Generate animation instructions for AI prompt
 */
export function generateAnimationPrompt(level: 'subtle' | 'moderate' | 'rich' | 'maximum'): string {
  const instructions: Record<string, string> = {
    subtle: `
## Animation Level: Subtle
Add minimal, professional animations:
- Hover: transition-colors duration-200 on buttons and links
- Focus: focus:ring-2 focus:ring-offset-2 on inputs
- No entrance animations
- No scroll animations`,
    
    moderate: `
## Animation Level: Moderate
Add smooth, purposeful animations:
- Hover: transition-all duration-200 hover:scale-105 on cards, hover:-translate-y-1 hover:shadow-lg
- Focus: focus:ring-2 focus:ring-offset-2 with transition
- Buttons: active:scale-95 for click feedback
- Simple fade-in for page content`,
    
    rich: `
## Animation Level: Rich
Add engaging, polished animations:
- Hover: Cards lift with shadow, buttons scale, links have underline animation
- Focus: Animated focus rings
- Click: Ripple or press effects
- Entrance: Fade-in-up for sections as they enter viewport
- Stagger: List items animate in sequence with delay
- Loading: Skeleton shimmer for loading states`,
    
    maximum: `
## Animation Level: Maximum
Add immersive, dynamic animations:
- Hover: Complex multi-property transitions, 3D transforms
- Focus: Glowing focus states
- Click: Ripple effects, bounce feedback
- Entrance: Every section has unique entrance animation
- Scroll: Parallax effects, scroll-linked animations
- Micro-interactions: Every interactive element responds
- Page transitions: Smooth route change animations
- Background: Subtle animated gradients or particles`
  };
  
  return instructions[level];
}

export default {
  MICRO_INTERACTIONS,
  getInteractionsByCategory,
  getRequiredKeyframes,
  generateTailwindConfig,
  generateAnimationPrompt
};
