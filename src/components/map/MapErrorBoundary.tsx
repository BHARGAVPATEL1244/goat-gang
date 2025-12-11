'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Text } from '@react-three/drei';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

export class ThreeErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.warn("3D Component Error caught:", error);
    }

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            // Default Fallback: A 3D Error Text
            return (
                <group position={[0, 2, 0]}>
                    <Text color="red" fontSize={0.5} anchorX="center" anchorY="middle">
                        Model Missing
                    </Text>
                </group>
            );
        }

        return this.props.children;
    }
}
