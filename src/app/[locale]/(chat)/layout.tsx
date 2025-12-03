import type { ReactNode } from 'react';

import { DashboardScaffold } from '@/features/dashboard/DashboardScaffold';

export default function ChatLayout(props: { children: ReactNode }) {
  return (
    <DashboardScaffold>
      {props.children}
    </DashboardScaffold>
  );
}
