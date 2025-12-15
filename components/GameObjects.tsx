import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Float, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Vector2, PowerUpType } from '../types';
import { COLORS, GRID_SIZE } from '../constants';

interface SnakeProps {
  segments: Vector2[];
  isInvincible: boolean;
}

export const Snake: React.FC<SnakeProps> = ({ segments, isInvincible }) => {
  return (
    <group>
      {segments.map((segment, index) => {
        const isHead = index === 0;
        const color = isInvincible 
          ? COLORS.snakeInvincible 
          : (isHead ? COLORS.snakeHead : COLORS.snakeBody);
        
        return (
          <mesh
            key={`${index}-${segment.x}-${segment.y}`}
            position={[segment.x, 0.5, segment.y]}
          >
            <RoundedBox args={[0.9, 0.9, 0.9]} radius={0.15} smoothness={4}>
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={isInvincible ? 0.8 : (isHead ? 0.6 : 0.2)}
                roughness={0.2}
                metalness={0.8}
                transparent={isInvincible}
                opacity={isInvincible ? 0.8 : 1}
              />
            </RoundedBox>
            {isHead && (
              <>
                <mesh position={[0.25, 0.2, -0.4]}>
                    <boxGeometry args={[0.15, 0.15, 0.1]} />
                    <meshBasicMaterial color="black" />
                </mesh>
                <mesh position={[-0.25, 0.2, -0.4]}>
                    <boxGeometry args={[0.15, 0.15, 0.1]} />
                    <meshBasicMaterial color="black" />
                </mesh>
              </>
            )}
          </mesh>
        );
      })}
    </group>
  );
};

interface FoodProps {
  position: Vector2;
}

export const Food: React.FC<FoodProps> = ({ position }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 2;
      meshRef.current.rotation.z += delta;
      const scale = 1 + Math.sin(state.clock.elapsedTime * 5) * 0.1;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={0.5}>
      <mesh ref={meshRef} position={[position.x, 0.5, position.y]}>
        <octahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial
          color={COLORS.food}
          emissive={COLORS.food}
          emissiveIntensity={0.8}
          toneMapped={false}
        />
        <pointLight color={COLORS.food} distance={3} intensity={5} />
      </mesh>
    </Float>
  );
};

interface PowerUpMeshProps {
  position: Vector2;
  type: PowerUpType;
}

export const PowerUpMesh: React.FC<PowerUpMeshProps> = ({ position, type }) => {
  const meshRef = useRef<THREE.Group>(null);
  const color = type === PowerUpType.SPEED ? COLORS.powerUpSpeed : COLORS.powerUpInvincible;

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 3;
      meshRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
    }
  });

  return (
    <group ref={meshRef} position={[position.x, 0.5, position.y]}>
      <mesh>
        {type === PowerUpType.SPEED ? (
          <coneGeometry args={[0.3, 0.8, 8]} />
        ) : (
          <dodecahedronGeometry args={[0.35, 0]} />
        )}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1}
          toneMapped={false}
        />
      </mesh>
      <pointLight color={color} distance={2} intensity={3} />
    </group>
  );
};

export const GameBoard: React.FC = () => {
  const boundary = Math.floor(GRID_SIZE / 2);
  const wallLength = GRID_SIZE + 0.2;
  const wallThickness = 0.2;
  const wallHeight = 0.5;
  const wallOffset = boundary + 0.6;
  
  return (
    <group>
      {/* Floor Grid */}
      <gridHelper 
        args={[GRID_SIZE, GRID_SIZE, COLORS.grid, '#111111']} 
        position={[0, 0, 0]} 
      />
      
      {/* Reflective floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial 
          color="#050505" 
          roughness={0.1} 
          metalness={0.5} 
        />
      </mesh>

      {/* Visible Walls */}
      {/* Top */}
      <mesh position={[0, wallHeight/2, -wallOffset]}>
        <boxGeometry args={[wallLength, wallHeight, wallThickness]} />
        <meshStandardMaterial color={COLORS.wall} emissive={COLORS.wall} emissiveIntensity={0.5} />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, wallHeight/2, wallOffset]}>
        <boxGeometry args={[wallLength, wallHeight, wallThickness]} />
        <meshStandardMaterial color={COLORS.wall} emissive={COLORS.wall} emissiveIntensity={0.5} />
      </mesh>
      {/* Left */}
      <mesh position={[-wallOffset, wallHeight/2, 0]}>
        <boxGeometry args={[wallThickness, wallHeight, wallLength]} />
        <meshStandardMaterial color={COLORS.wall} emissive={COLORS.wall} emissiveIntensity={0.5} />
      </mesh>
      {/* Right */}
      <mesh position={[wallOffset, wallHeight/2, 0]}>
        <boxGeometry args={[wallThickness, wallHeight, wallLength]} />
        <meshStandardMaterial color={COLORS.wall} emissive={COLORS.wall} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};