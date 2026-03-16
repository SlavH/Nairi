import type { Meta, StoryObj } from '@storybook/react'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription, EmptyContent } from './empty'
import { Button } from './button'
import { FileQuestion } from 'lucide-react'

const meta: Meta = {
  title: 'UI/Empty',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Use for "no data" views with icon and CTA (e.g. no creations, no conversations).',
      },
    },
  },
}

export default meta

type Story = StoryObj

export const Default: Story = {
  render: () => (
    <Empty className="border border-border rounded-lg">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileQuestion />
        </EmptyMedia>
        <EmptyTitle>No creations yet</EmptyTitle>
        <EmptyDescription>
          Create your first project to get started.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>Create your first</Button>
      </EmptyContent>
    </Empty>
  ),
}

export const NoConversations: Story = {
  render: () => (
    <Empty className="border border-border rounded-lg">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileQuestion />
        </EmptyMedia>
        <EmptyTitle>No conversations</EmptyTitle>
        <EmptyDescription>
          Start a new chat to begin.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button>New chat</Button>
      </EmptyContent>
    </Empty>
  ),
}
