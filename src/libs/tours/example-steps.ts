import type { DriveStep } from 'driver.js';

/**
 * Example tour steps demonstrating the `DriveStep[]` shape.
 *
 * Replace these with your product's own steps. Target real elements with CSS
 * selectors (e.g. `#sidebar`, `[data-tour="new-item"]`); steps whose target is
 * missing or not rendered are skipped automatically by `useTour`.
 */
export const exampleSteps: DriveStep[] = [
  {
    element: '[data-tour="welcome"]',
    popover: {
      title: 'Welcome 👋',
      description: 'This is a quick tour. Press T then R any time to replay it.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="sidebar"]',
    popover: {
      title: 'Navigation',
      description: 'Use the sidebar to move between sections.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="primary-action"]',
    popover: {
      title: 'Get started',
      description: 'Create your first item from here.',
      side: 'bottom',
      align: 'center',
    },
  },
];
