import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './input'
import { Label } from './label'

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm space-y-2">
        <Label htmlFor="input-demo">Label</Label>
        <Story />
      </div>
    ),
  ],
}

export default meta

type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: { id: 'input-demo', placeholder: 'Placeholder' },
}

export const WithError: Story = {
  args: {
    id: 'input-error',
    placeholder: 'Email',
    'aria-invalid': true,
    'aria-describedby': 'input-error-desc',
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm space-y-2">
        <Label htmlFor="input-error">Email</Label>
        <Story />
        <p id="input-error-desc" className="text-sm text-destructive" role="alert">
          Please enter a valid email address.
        </p>
      </div>
    ),
  ],
}

export const Disabled: Story = {
  args: { id: 'input-disabled', placeholder: 'Disabled', disabled: true },
}
