import type { Meta, StoryObj } from '@storybook/react';

import { Skeleton } from './skeleton';

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  render: () => (
    <div className="space-y-2">
      <Skeleton variant="text" className="h-4 w-[250px]" />
      <Skeleton variant="text" className="h-4 w-[200px]" />
      <Skeleton variant="text" className="h-4 w-[150px]" />
    </div>
  ),
};

export const CardWithAvatar: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Skeleton variant="avatar" className="size-12" />
      <div className="space-y-2">
        <Skeleton variant="text" className="h-4 w-[200px]" />
        <Skeleton variant="text" className="h-4 w-[160px]" />
      </div>
    </div>
  ),
};
