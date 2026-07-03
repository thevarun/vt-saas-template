import type { Meta, StoryObj } from '@storybook/react';

import { Badge } from './badge';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  args: { children: 'Badge' },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Secondary: Story = { args: { variant: 'secondary' } };
export const Destructive: Story = { args: { variant: 'destructive' } };
export const Outline: Story = { args: { variant: 'outline' } };

export const StatusVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="active">Active</Badge>
      <Badge variant="suspended">Suspended</Badge>
      <Badge variant="pending">Pending</Badge>
    </div>
  ),
};

export const ChangelogTags: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="new">New</Badge>
      <Badge variant="improved">Improved</Badge>
      <Badge variant="fixed">Fixed</Badge>
    </div>
  ),
};
