import confetti from 'canvas-confetti';

export const triggerCoinExplosion = (x: number, y: number) => {
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

export const triggerGoatExplosion = (x: number, y: number) => {
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
