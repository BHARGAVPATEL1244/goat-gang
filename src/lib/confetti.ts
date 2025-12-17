// Dynamically imported to reduce initial bundle size

export const triggerCoinExplosion = async (x: number, y: number) => {
    const confetti = (await import('canvas-confetti')).default;
    const scalar = 2;
    const coinShape = confetti.shapeFromText({ text: '🟡', scalar });

    confetti({
        particleCount: 30,
        scalar,
        spread: 80,
        origin: { x, y },
        shapes: [coinShape],
        colors: ['#FFD700', '#FFA500'], // Gold and Orange
        gravity: 0.8,
        drift: 0,
        ticks: 100,
    });
};

export const triggerGoatExplosion = async (x: number, y: number) => {
    const confetti = (await import('canvas-confetti')).default;
    const scalar = 2.5;
    const goatShape = confetti.shapeFromText({ text: '🐐', scalar });

    confetti({
        particleCount: 20,
        scalar,
        spread: 100,
        origin: { x, y },
        shapes: [goatShape],
        gravity: 1.2,
        drift: 0.5,
        ticks: 150,
        startVelocity: 30,
    });
};
