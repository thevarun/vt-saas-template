import { beforeEach, describe, expect, it } from 'vitest';

import { useEntityDialogStore } from './entity-dialog-store';

describe('entity-dialog-store', () => {
  beforeEach(() => {
    useEntityDialogStore.getState().close();
  });

  it('starts closed', () => {
    expect(useEntityDialogStore.getState().mode).toEqual({ kind: 'closed' });
  });

  it('opens the create mode', () => {
    useEntityDialogStore.getState().openCreate();

    expect(useEntityDialogStore.getState().mode).toEqual({ kind: 'create' });
  });

  it('carries the entity id in edit mode', () => {
    useEntityDialogStore.getState().openEdit('abc');

    expect(useEntityDialogStore.getState().mode).toEqual({ kind: 'edit', entityId: 'abc' });
  });

  it('resets to closed', () => {
    useEntityDialogStore.getState().openEdit('abc');
    useEntityDialogStore.getState().close();

    expect(useEntityDialogStore.getState().mode).toEqual({ kind: 'closed' });
  });
});
