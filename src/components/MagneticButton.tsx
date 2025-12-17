'use client';

import { m as motion, useMotionValue, useSpring } from 'framer-motion';
import { useRef } from 'react';

export default function MagneticButton({ children, className = "" }: { children: React.ReactNode, className?: string }) {
    const ref = useRef<HTMLDivElement>(null);

    // Use MotionValues instead of React State to prevent re-renders on every mouse move
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    // Smooth spring animation for the values
    const springConfig = { type: "spring", stiffness: 150, damping: 15, mass: 0.1 };
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const { left, top, width, height } = ref.current?.getBoundingClientRect() || { left: 0, top: 0, width: 0, height: 0 };
        const center = { x: left + width / 2, y: top + height / 2 };

        // Calculate distance from center
        const distanceX = clientX - center.x;
        const distanceY = clientY - center.y;

        // Update motion values directly (no React render)
        x.set(distanceX * 0.3);
        y.set(distanceY * 0.3);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ x: springX, y: springY }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
