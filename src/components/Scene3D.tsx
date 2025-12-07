'use client';

import React, { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, PerspectiveCamera, Environment, ContactShadows, Stars, OrbitControls, MeshDistortMaterial, Image as DreiImage } from '@react-three/drei';
import * as THREE from 'three';

function FloatingShape({ position, color, children, scale, speed = 1 }: any) {
    const groupRef = useRef<THREE.Group>(null);
    const [isSpinning, setIsSpinning] = React.useState(false);

    useFrame((state) => {
        if (groupRef.current) {
            // Normal floating rotation
            groupRef.current.rotation.x = state.clock.getElapsedTime() * 0.2 * speed;

            if (isSpinning) {
                // Rapid spin effect
                groupRef.current.rotation.y += 0.5;
                // Stop spinning after some time
                if (groupRef.current.rotation.y > 100) {
                    groupRef.current.rotation.y = groupRef.current.rotation.y % (Math.PI * 2);
                }
            } else {
                groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.3 * speed;
            }
        }
    });

    const handleClick = (e: any) => {
        e.stopPropagation(); // Prevent event bubbling issues
        setIsSpinning(true);
        setTimeout(() => setIsSpinning(false), 1000);
    };

    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={1}>
            <group
                ref={groupRef}
                position={position}
                scale={scale}
            >
                {React.cloneElement(children, {
                    onClick: handleClick,
                    onPointerOver: () => document.body.style.cursor = 'pointer',
                    onPointerOut: () => document.body.style.cursor = 'auto'
                })}
            </group>
        </Float>
    );
}

function ResponsiveAdjuster() {
    const { size, camera } = useThree();

    useFrame(() => {
        // Adjust camera position based on window width (pixels)
        const isMobile = size.width < 768; // Standard mobile breakpoint

        // Move camera back on mobile to see more width
        const targetZ = isMobile ? 22 : 15;

        // Adjust Y position: Move camera DOWN (-Y) to make goats appear HIGHER
        const targetY = isMobile ? -2 : 0;

        // Smoothly interpolate camera position
        camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.1);
        camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, 0.1);
    });

    return null;
}

export default function Scene3D() {
    return (
        <div className="w-full h-full absolute inset-0 bg-black">
            <Canvas shadows camera={{ position: [0, 0, 15], fov: 50 }}>
                <React.Suspense fallback={null}>
                    <ResponsiveAdjuster />
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={1} />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} />

                    <OrbitControls enableZoom={true} autoRotate autoRotateSpeed={0.5} />
                    <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                    {/* Floating Goats Group */}
                    <group position={[0, 0, 0]}>
                        <FloatingShape position={[0, 0, 0]} speed={1}>
                            <DreiImage url="/goats/goat1.png" scale={[4, 4]} transparent />
                        </FloatingShape>
                        <FloatingShape position={[-5, 2, -2]} speed={1.2}>
                            <DreiImage url="/goats/goat2.png" scale={[3, 3]} transparent />
                        </FloatingShape>
                        <FloatingShape position={[5, -2, -3]} speed={0.8}>
                            <DreiImage url="/goats/goat3.png" scale={[3.5, 3.5]} transparent />
                        </FloatingShape>
                        <FloatingShape position={[-4, -3, 1]} speed={1.5}>
                            <DreiImage url="/goats/goat4.png" scale={[3, 3]} transparent />
                        </FloatingShape>
                        <FloatingShape position={[4, 3, 1]} speed={1.1}>
                            <DreiImage url="/goats/goat5.png" scale={[3, 3]} transparent />
                        </FloatingShape>

                        {/* New Goats */}
                        <FloatingShape position={[-6, 4, -4]} speed={0.9}>
                            <DreiImage url="/goats/goat6.png" scale={[3.5, 3.5]} transparent />
                        </FloatingShape>
                        <FloatingShape position={[6, 4, -2]} speed={1.3}>
                            <DreiImage url="/goats/goat7.png" scale={[3, 3]} transparent />
                        </FloatingShape>
                        <FloatingShape position={[-3, -5, -1]} speed={1.1}>
                            <DreiImage url="/goats/goat8.png" scale={[3.2, 3.2]} transparent />
                        </FloatingShape>
                        <FloatingShape position={[3, -5, -3]} speed={1.4}>
                            <DreiImage url="/goats/goat9.png" scale={[3.5, 3.5]} transparent />
                        </FloatingShape>
                    </group>

                    <Environment preset="city" />
                </React.Suspense>
            </Canvas>
        </div>
    );
}
