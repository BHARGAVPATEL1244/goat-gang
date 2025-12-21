'use client';

import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

/**
 * Hook to trigger haptic feedback on supported devices.
 * Gracefully sends "nothing" on unsupported devices.
 */
export function useHaptic() {
    const trigger = useCallback((type: HapticType = 'light') => {
        if (typeof navigator === 'undefined' || !navigator.vibrate) return;

        try {
            switch (type) {
                case 'light':
                    navigator.vibrate(10);
                    break;
                case 'medium':
                    navigator.vibrate(20);
                    break;
                case 'heavy':
                    navigator.vibrate(40);
                    break;
                case 'success':
                    navigator.vibrate([10, 30, 10]);
                    break;
                case 'warning':
                    navigator.vibrate([30, 50, 10]);
                    break;
                case 'error':
                    navigator.vibrate([50, 30, 50, 30, 50]);
                    break;
            }
        } catch (e) {
            // Ignore errors (some browsers restrict this API)
        }
    }, []);

    return { trigger };
}
