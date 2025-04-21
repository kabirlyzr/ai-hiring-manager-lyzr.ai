'use client';

import { ReactNode, useEffect } from 'react';
import { configureAmplify } from '@/utils/amplify-config';

export function AmplifyProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    configureAmplify();
  }, []);

  return <>{children}</>;
}
