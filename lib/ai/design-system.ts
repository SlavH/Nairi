/**
 * Design System Intelligence
 * Ensures consistent, professional UI generation
 */

export interface DesignTokens {
  colors: ColorPalette;
  typography: TypographyScale;
  spacing: SpacingScale;
  borderRadius: BorderRadiusScale;
  shadows: ShadowScale;
  animations: AnimationPresets;
}

export interface ColorPalette {
  primary: string;
  primaryHover: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  error: string;
  success: string;
  warning: string;
}

export interface TypographyScale {
  fontFamily: string;
  headingFamily: string;
  sizes: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
  };
  weights: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  lineHeights: {
    tight: string;
    normal: string;
    relaxed: string;
  };
}

export interface SpacingScale {
  unit: number; // Base unit in pixels (usually 4 or 8)
  scale: Record<string, string>;
}

export interface BorderRadiusScale {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface ShadowScale {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface AnimationPresets {
  durations: {
    fast: string;
    normal: string;
    slow: string;
  };
  easings: {
    default: string;
    in: string;
    out: string;
    inOut: string;
    bounce: string;
  };
}

// Predefined design system presets
export const DESIGN_PRESETS: Record<string, DesignTokens> = {
  modern: {
    colors: {
      primary: 'bg-blue-600',
      primaryHover: 'hover:bg-blue-700',
      secondary: 'bg-slate-100',
      accent: 'bg-violet-500',
      background: 'bg-white',
      foreground: 'text-slate-900',
      muted: 'bg-slate-100',
      mutedForeground: 'text-slate-500',
      border: 'border-slate-200',
      error: 'text-red-500',
      success: 'text-green-500',
      warning: 'text-amber-500'
    },
    typography: {
      fontFamily: 'font-sans',
      headingFamily: 'font-sans',
      sizes: {
        xs: 'text-xs',
        sm: 'text-sm',
        base: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
        '2xl': 'text-2xl',
        '3xl': 'text-3xl',
        '4xl': 'text-4xl',
        '5xl': 'text-5xl'
      },
      weights: {
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold'
      },
      lineHeights: {
        tight: 'leading-tight',
        normal: 'leading-normal',
        relaxed: 'leading-relaxed'
      }
    },
    spacing: {
      unit: 4,
      scale: {
        '0': '0',
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '6': '1.5rem',
        '8': '2rem',
        '12': '3rem',
        '16': '4rem',
        '24': '6rem'
      }
    },
    borderRadius: {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full'
    },
    shadows: {
      none: 'shadow-none',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl'
    },
    animations: {
      durations: {
        fast: 'duration-150',
        normal: 'duration-300',
        slow: 'duration-500'
      },
      easings: {
        default: 'ease-out',
        in: 'ease-in',
        out: 'ease-out',
        inOut: 'ease-in-out',
        bounce: 'ease-bounce'
      }
    }
  },
  
  dark: {
    colors: {
      primary: 'bg-violet-600',
      primaryHover: 'hover:bg-violet-700',
      secondary: 'bg-slate-800',
      accent: 'bg-cyan-500',
      background: 'bg-slate-950',
      foreground: 'text-white',
      muted: 'bg-slate-800',
      mutedForeground: 'text-slate-400',
      border: 'border-slate-700',
      error: 'text-red-400',
      success: 'text-green-400',
      warning: 'text-amber-400'
    },
    typography: {
      fontFamily: 'font-sans',
      headingFamily: 'font-sans',
      sizes: {
        xs: 'text-xs',
        sm: 'text-sm',
        base: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
        '2xl': 'text-2xl',
        '3xl': 'text-3xl',
        '4xl': 'text-4xl',
        '5xl': 'text-5xl'
      },
      weights: {
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold'
      },
      lineHeights: {
        tight: 'leading-tight',
        normal: 'leading-normal',
        relaxed: 'leading-relaxed'
      }
    },
    spacing: {
      unit: 4,
      scale: {
        '0': '0',
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '6': '1.5rem',
        '8': '2rem',
        '12': '3rem',
        '16': '4rem',
        '24': '6rem'
      }
    },
    borderRadius: {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full'
    },
    shadows: {
      none: 'shadow-none',
      sm: 'shadow-sm shadow-black/20',
      md: 'shadow-md shadow-black/30',
      lg: 'shadow-lg shadow-black/40',
      xl: 'shadow-xl shadow-black/50'
    },
    animations: {
      durations: {
        fast: 'duration-150',
        normal: 'duration-300',
        slow: 'duration-500'
      },
      easings: {
        default: 'ease-out',
        in: 'ease-in',
        out: 'ease-out',
        inOut: 'ease-in-out',
        bounce: 'ease-bounce'
      }
    }
  },
  
  glassmorphism: {
    colors: {
      primary: 'bg-white/20 backdrop-blur-lg',
      primaryHover: 'hover:bg-white/30',
      secondary: 'bg-white/10 backdrop-blur-md',
      accent: 'bg-gradient-to-r from-purple-500 to-pink-500',
      background: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
      foreground: 'text-white',
      muted: 'bg-white/5',
      mutedForeground: 'text-white/60',
      border: 'border-white/20',
      error: 'text-red-400',
      success: 'text-green-400',
      warning: 'text-amber-400'
    },
    typography: {
      fontFamily: 'font-sans',
      headingFamily: 'font-sans',
      sizes: {
        xs: 'text-xs',
        sm: 'text-sm',
        base: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
        '2xl': 'text-2xl',
        '3xl': 'text-3xl',
        '4xl': 'text-4xl',
        '5xl': 'text-5xl'
      },
      weights: {
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold'
      },
      lineHeights: {
        tight: 'leading-tight',
        normal: 'leading-normal',
        relaxed: 'leading-relaxed'
      }
    },
    spacing: {
      unit: 4,
      scale: {
        '0': '0',
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '6': '1.5rem',
        '8': '2rem',
        '12': '3rem',
        '16': '4rem',
        '24': '6rem'
      }
    },
    borderRadius: {
      none: 'rounded-none',
      sm: 'rounded-lg',
      md: 'rounded-xl',
      lg: 'rounded-2xl',
      xl: 'rounded-3xl',
      full: 'rounded-full'
    },
    shadows: {
      none: 'shadow-none',
      sm: 'shadow-lg shadow-purple-500/10',
      md: 'shadow-xl shadow-purple-500/20',
      lg: 'shadow-2xl shadow-purple-500/30',
      xl: 'shadow-2xl shadow-purple-500/40'
    },
    animations: {
      durations: {
        fast: 'duration-200',
        normal: 'duration-400',
        slow: 'duration-700'
      },
      easings: {
        default: 'ease-out',
        in: 'ease-in',
        out: 'ease-out',
        inOut: 'ease-in-out',
        bounce: 'ease-bounce'
      }
    }
  },
  
  minimal: {
    colors: {
      primary: 'bg-black',
      primaryHover: 'hover:bg-gray-800',
      secondary: 'bg-gray-100',
      accent: 'bg-black',
      background: 'bg-white',
      foreground: 'text-black',
      muted: 'bg-gray-50',
      mutedForeground: 'text-gray-500',
      border: 'border-gray-200',
      error: 'text-red-600',
      success: 'text-green-600',
      warning: 'text-amber-600'
    },
    typography: {
      fontFamily: 'font-sans',
      headingFamily: 'font-sans',
      sizes: {
        xs: 'text-xs',
        sm: 'text-sm',
        base: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
        '2xl': 'text-2xl',
        '3xl': 'text-3xl',
        '4xl': 'text-4xl',
        '5xl': 'text-5xl'
      },
      weights: {
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold'
      },
      lineHeights: {
        tight: 'leading-tight',
        normal: 'leading-normal',
        relaxed: 'leading-relaxed'
      }
    },
    spacing: {
      unit: 8,
      scale: {
        '0': '0',
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '6': '1.5rem',
        '8': '2rem',
        '12': '3rem',
        '16': '4rem',
        '24': '6rem'
      }
    },
    borderRadius: {
      none: 'rounded-none',
      sm: 'rounded',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      full: 'rounded-full'
    },
    shadows: {
      none: 'shadow-none',
      sm: 'shadow-sm',
      md: 'shadow',
      lg: 'shadow-md',
      xl: 'shadow-lg'
    },
    animations: {
      durations: {
        fast: 'duration-100',
        normal: 'duration-200',
        slow: 'duration-300'
      },
      easings: {
        default: 'ease-out',
        in: 'ease-in',
        out: 'ease-out',
        inOut: 'ease-in-out',
        bounce: 'ease-bounce'
      }
    }
  },
  
  playful: {
    colors: {
      primary: 'bg-gradient-to-r from-pink-500 to-orange-500',
      primaryHover: 'hover:from-pink-600 hover:to-orange-600',
      secondary: 'bg-yellow-100',
      accent: 'bg-gradient-to-r from-cyan-500 to-blue-500',
      background: 'bg-gradient-to-br from-pink-50 via-white to-cyan-50',
      foreground: 'text-gray-800',
      muted: 'bg-pink-50',
      mutedForeground: 'text-gray-500',
      border: 'border-pink-200',
      error: 'text-red-500',
      success: 'text-green-500',
      warning: 'text-amber-500'
    },
    typography: {
      fontFamily: 'font-sans',
      headingFamily: 'font-sans',
      sizes: {
        xs: 'text-xs',
        sm: 'text-sm',
        base: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl',
        '2xl': 'text-2xl',
        '3xl': 'text-3xl',
        '4xl': 'text-4xl',
        '5xl': 'text-5xl'
      },
      weights: {
        normal: 'font-normal',
        medium: 'font-medium',
        semibold: 'font-semibold',
        bold: 'font-bold'
      },
      lineHeights: {
        tight: 'leading-tight',
        normal: 'leading-normal',
        relaxed: 'leading-relaxed'
      }
    },
    spacing: {
      unit: 4,
      scale: {
        '0': '0',
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '6': '1.5rem',
        '8': '2rem',
        '12': '3rem',
        '16': '4rem',
        '24': '6rem'
      }
    },
    borderRadius: {
      none: 'rounded-none',
      sm: 'rounded-lg',
      md: 'rounded-xl',
      lg: 'rounded-2xl',
      xl: 'rounded-3xl',
      full: 'rounded-full'
    },
    shadows: {
      none: 'shadow-none',
      sm: 'shadow-md shadow-pink-500/10',
      md: 'shadow-lg shadow-pink-500/20',
      lg: 'shadow-xl shadow-pink-500/25',
      xl: 'shadow-2xl shadow-pink-500/30'
    },
    animations: {
      durations: {
        fast: 'duration-200',
        normal: 'duration-400',
        slow: 'duration-600'
      },
      easings: {
        default: 'ease-out',
        in: 'ease-in',
        out: 'ease-out',
        inOut: 'ease-in-out',
        bounce: 'ease-bounce'
      }
    }
  }
};

/**
 * Generate design system instructions for AI prompt
 */
export function generateDesignSystemPrompt(preset: keyof typeof DESIGN_PRESETS = 'modern'): string {
  const tokens = DESIGN_PRESETS[preset];
  
  return `
## Design System Guidelines

Use these consistent design tokens throughout the code:

### Colors
- Primary: ${tokens.colors.primary} ${tokens.colors.primaryHover}
- Background: ${tokens.colors.background}
- Text: ${tokens.colors.foreground}
- Muted: ${tokens.colors.muted} / ${tokens.colors.mutedForeground}
- Border: ${tokens.colors.border}
- Accent: ${tokens.colors.accent}

### Typography
- Font: ${tokens.typography.fontFamily}
- Headings: Use ${tokens.typography.sizes['4xl']} for h1, ${tokens.typography.sizes['3xl']} for h2, ${tokens.typography.sizes['2xl']} for h3
- Body: ${tokens.typography.sizes.base}
- Small: ${tokens.typography.sizes.sm}

### Spacing (8px grid)
- Use p-2, p-4, p-6, p-8 for padding
- Use gap-2, gap-4, gap-6, gap-8 for flex/grid gaps
- Use space-y-4, space-y-6, space-y-8 for vertical rhythm

### Border Radius
- Buttons: ${tokens.borderRadius.md}
- Cards: ${tokens.borderRadius.lg}
- Inputs: ${tokens.borderRadius.md}
- Avatars: ${tokens.borderRadius.full}

### Shadows
- Cards: ${tokens.shadows.md}
- Dropdowns: ${tokens.shadows.lg}
- Modals: ${tokens.shadows.xl}

### Animations
- Transitions: transition-all ${tokens.animations.durations.normal} ${tokens.animations.easings.default}
- Hover states: Always add hover transitions
- Use animate-fadeIn for entrance animations
`;
}

/**
 * Layout patterns for common components
 */
export const LAYOUT_PATTERNS = {
  hero: `
    <section className="min-h-[80vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        {/* Headline */}
        {/* Subheadline */}
        {/* CTA Buttons */}
      </div>
    </section>
  `,
  
  features: `
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          {/* Section title */}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Feature cards */}
        </div>
      </div>
    </section>
  `,
  
  pricing: `
    <section className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          {/* Section title */}
          {/* Billing toggle */}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Pricing cards - highlight middle one */}
        </div>
      </div>
    </section>
  `,
  
  testimonials: `
    <section className="py-16 px-4 bg-muted">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          {/* Section title */}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Testimonial cards with avatar, quote, name, role */}
        </div>
      </div>
    </section>
  `,
  
  cta: `
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto text-center bg-primary rounded-2xl p-12">
        {/* CTA headline */}
        {/* CTA description */}
        {/* CTA button */}
      </div>
    </section>
  `,
  
  footer: `
    <footer className="py-12 px-4 border-t">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Footer columns with links */}
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t">
          {/* Copyright */}
          {/* Social links */}
        </div>
      </div>
    </footer>
  `
};

/**
 * Responsive breakpoint helpers
 */
export const RESPONSIVE_PATTERNS = {
  container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  grid2to1: 'grid grid-cols-1 md:grid-cols-2 gap-6',
  grid3to1: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
  grid4to2to1: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6',
  flexWrap: 'flex flex-wrap gap-4',
  stackToRow: 'flex flex-col md:flex-row gap-4',
  hideOnMobile: 'hidden md:block',
  showOnMobile: 'md:hidden',
  textResponsive: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl'
};

export default {
  DESIGN_PRESETS,
  generateDesignSystemPrompt,
  LAYOUT_PATTERNS,
  RESPONSIVE_PATTERNS
};
