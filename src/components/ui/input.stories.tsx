import type { Meta, StoryObj } from '@storybook/react';

import { Input } from './input';

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  args: { placeholder: 'Enter text…' },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Email: Story = { args: { type: 'email', placeholder: 'you@example.com' } };
export const Password: Story = { args: { type: 'password', placeholder: '••••••••' } };
export const Disabled: Story = { args: { disabled: true, value: 'Read only' } };
export const WithLabel: Story = {
  render: args => (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <label htmlFor="email" className="text-sm font-medium">Email</label>
      <Input id="email" {...args} />
    </div>
  ),
  args: { type: 'email', placeholder: 'you@example.com' },
};
