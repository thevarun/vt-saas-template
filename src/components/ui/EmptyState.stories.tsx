import type { Meta, StoryObj } from '@storybook/react';

import { EmptyState } from './EmptyState';

const meta = {
  title: 'UI/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
  argTypes: { variant: { control: 'select', options: ['default', 'search', 'error'] } },
} satisfies Meta<typeof EmptyState>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'No items yet',
    description: 'Get started by creating your first item.',
    action: { label: 'Create item', onClick: () => {} },
  },
};

export const Search: Story = {
  args: {
    variant: 'search',
    title: 'No results found',
    description: 'Try adjusting your search criteria.',
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Failed to load data',
    description: 'Something went wrong. Please try again.',
    action: { label: 'Retry', onClick: () => {} },
  },
};
