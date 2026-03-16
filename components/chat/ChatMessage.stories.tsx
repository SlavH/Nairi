import type { Meta, StoryObj } from '@storybook/react'
import { ChatMessage } from './chat-message'

const meta = {
  title: 'Chat/ChatMessage',
  component: ChatMessage,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    role: {
      control: 'select',
      options: ['user', 'assistant', 'system'],
    },
  },
} satisfies Meta<typeof ChatMessage>

export default meta
type Story = StoryObj<typeof meta>

export const UserMessage: Story = {
  args: {
    role: 'user',
    content: 'Hello, can you help me with my project?',
    timestamp: new Date(),
  },
}

export const AssistantMessage: Story = {
  args: {
    role: 'assistant',
    content: 'Of course! I\'d be happy to help you with your project. What do you need assistance with?',
    timestamp: new Date(),
  },
}

export const SystemMessage: Story = {
  args: {
    role: 'system',
    content: 'Chat session started',
    timestamp: new Date(),
  },
}

export const LongMessage: Story = {
  args: {
    role: 'assistant',
    content: `Here's a detailed explanation of how to implement a feature:

1. First, you need to set up the basic structure
2. Then, implement the core functionality
3. Add error handling
4. Write tests
5. Document your code

Let me know if you need more details on any of these steps!`,
    timestamp: new Date(),
  },
}

export const CodeMessage: Story = {
  args: {
    role: 'assistant',
    content: `Here's an example:

\`\`\`typescript
function greet(name: string): string {
  return \`Hello, \${name}!\`
}
\`\`\`

This function takes a name and returns a greeting.`,
    timestamp: new Date(),
  },
}
