import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Foundations/Design Tokens',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Design tokens from globals.css: colors, radius, spacing, typography. Use these for consistent UI.',
      },
    },
  },
}

export default meta

type Story = StoryObj

const colorTokens = [
  { name: 'background', class: 'bg-background', text: 'text-foreground' },
  { name: 'card', class: 'bg-card', text: 'text-card-foreground' },
  { name: 'primary', class: 'bg-primary', text: 'text-primary-foreground' },
  { name: 'secondary', class: 'bg-secondary', text: 'text-secondary-foreground' },
  { name: 'muted', class: 'bg-muted', text: 'text-muted-foreground' },
  { name: 'accent', class: 'bg-accent', text: 'text-accent-foreground' },
  { name: 'destructive', class: 'bg-destructive', text: 'text-destructive-foreground' },
  { name: 'border', class: 'bg-border', text: 'text-foreground' },
]

export const Colors: Story = {
  render: () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Colors (CSS variables → Tailwind)</h2>
      <div className="flex flex-wrap gap-4">
        {colorTokens.map(({ name, class: bg, text }) => (
          <div key={name} className="flex flex-col items-center gap-2">
            <div className={bg + ' ' + text + ' h-16 w-24 rounded-lg border border-border p-2 text-xs'}>{name}</div>
            <span className="text-muted-foreground text-xs">{name}</span>
          </div>
        ))}
      </div>
    </div>
  ),
}

const radiusTokens = [
  { name: 'sm', class: 'rounded-sm' },
  { name: 'md', class: 'rounded-md' },
  { name: 'lg', class: 'rounded-lg' },
  { name: 'xl', class: 'rounded-xl' },
]

export const Radius: Story = {
  render: () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Radius (--radius scale)</h2>
      <div className="flex flex-wrap gap-6">
        {radiusTokens.map(({ name, class: r }) => (
          <div key={name} className="flex flex-col items-center gap-2">
            <div className={r + ' h-16 w-24 border-2 border-primary bg-card'} />
            <span className="text-muted-foreground text-xs">{name}</span>
          </div>
        ))}
      </div>
    </div>
  ),
}

const spacingScale = [1, 2, 3, 4, 5, 6, 8, 10, 12]

export const Spacing: Story = {
  render: () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Spacing (Tailwind: 4px base)</h2>
      <div className="space-y-2">
        {spacingScale.map((n) => (
          <div key={n} className="flex items-center gap-4">
            <span className="text-muted-foreground w-8 text-xs">{n}</span>
            <div className="h-6 bg-primary" style={{ width: `${n * 4}px` }} />
            <span className="text-muted-foreground text-xs">{n * 4}px</span>
          </div>
        ))}
      </div>
    </div>
  ),
}

export const Typography: Story = {
  render: () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Typography (Inter, Geist Mono)</h2>
      <div className="space-y-2 font-sans">
        <p className="text-xs">text-xs — labels, captions</p>
        <p className="text-sm">text-sm — body small</p>
        <p className="text-base">text-base — body</p>
        <p className="text-lg font-semibold">text-lg font-semibold — subhead</p>
        <p className="text-xl font-semibold">text-xl font-semibold — heading</p>
        <p className="text-2xl font-bold">text-2xl font-bold — title</p>
        <p className="text-3xl font-bold">text-3xl font-bold — display</p>
      </div>
      <div className="mt-4 border-t border-border pt-4 font-mono text-sm">font-mono — code, Geist Mono</div>
    </div>
  ),
}

export const MotionTokens: Story = {
  render: () => (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Motion (CSS variables)</h2>
      <ul className="text-muted-foreground list-inside list-disc text-sm">
        <li>--duration-fast: 150ms</li>
        <li>--duration-normal: 250ms</li>
        <li>--duration-slow: 350ms</li>
        <li>--ease-default: cubic-bezier(0.4, 0, 0.2, 1)</li>
        <li>--ease-out: cubic-bezier(0, 0, 0.2, 1)</li>
      </ul>
      <p className="text-muted-foreground text-xs">Use for transitions and animations. Respect prefers-reduced-motion.</p>
    </div>
  ),
}
