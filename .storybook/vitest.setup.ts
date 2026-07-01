import { setProjectAnnotations } from '@storybook/nextjs-vite';
import { beforeAll } from 'vitest';

import * as previewAnnotations from './preview';

// Applies this project's Storybook config (decorators, globals, parameters from
// preview.ts) to every story rendered as a Vitest test.
const annotations = setProjectAnnotations([previewAnnotations]);

beforeAll(annotations.beforeAll);
