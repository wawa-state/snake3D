import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, PerspectiveCamera } from '@react-three/drei';
import { GameState, Direction, Vector2, PowerUpType, PowerUpItem, ActivePowerUp } from './types';
import { COLORS, BASE_SPEED, SPEED_INCREMENT, MIN_SPEED, INITIAL_SNAKE_LENGTH, POINTS_PER_FOOD, POWERUP_DURATION, POWERUP_SPAWN_INTERVAL } from './constants';
import { getNextHeadPosition, checkCollision, getRandomPosition, isOppositeDirection, wrapPosition } from './utils/gameLogic';
import { Snake, Food, GameBoard, PowerUpMesh } from './components/GameObjects';
import Controls from './components/Controls';

// Custom hook for interval handling
function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      const id = setInterval(() => savedCallback.current(), delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [snake, setSnake] = useState<Vector2[]>([
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 0, y: 2 },
  ]);
  const [food, setFood] = useState<Vector2>({ x: 3, y: 0 });
  const [direction, setDirection] = useState<Direction>(Direction.UP);
  const [nextDirection, setNextDirection] = useState<Direction>(Direction.UP);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [baseSpeed, setBaseSpeed] = useState(BASE_SPEED);
  
  // PowerUp State
  const [powerUpItem, setPowerUpItem] = useState<PowerUpItem | null>(null);
  const [activePowerUp, setActivePowerUp] = useState<ActivePowerUp | null>(null);
  const lastPowerUpSpawnTime = useRef<number>(0);

  // Initialize High Score
  useEffect(() => {
    const savedHighScore = localStorage.getItem('neon-snake-highscore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  // Update High Score Persistence
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('neon-snake-highscore', score.toString());
    }
  }, [score, highScore]);

  // Audio Context
  const playSound = useCallback((type: 'eat' | 'die' | 'powerup') => {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    const now = ctx.currentTime;

    if (type === 'eat') {
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'powerup') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.1);
      osc.frequency.linearRampToValueAtTime(1200, now + 0.2);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(50, now + 0.3);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  }, []);

  const resetGame = () => {
    setSnake([
      { x: 0, y: 2 },
      { x: 0, y: 3 },
      { x: 0, y: 4 },
    ]);
    setFood({ x: 0, y: -3 });
    setDirection(Direction.UP);
    setNextDirection(Direction.UP);
    setScore(0);
    setBaseSpeed(BASE_SPEED);
    setGameState(GameState.PLAYING);
    setPowerUpItem(null);
    setActivePowerUp(null);
    lastPowerUpSpawnTime.current = Date.now();
  };

  const handleInput = useCallback((newDir: Direction) => {
    if (!isOppositeDirection(direction, newDir) && !isOppositeDirection(nextDirection, newDir)) {
      setNextDirection(newDir);
    }
  }, [direction, nextDirection]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': handleInput(Direction.UP); break;
        case 'ArrowDown': case 's': case 'S': handleInput(Direction.DOWN); break;
        case 'ArrowLeft': case 'a': case 'A': handleInput(Direction.LEFT); break;
        case 'ArrowRight': case 'd': case 'D': handleInput(Direction.RIGHT); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInput]);

  // Game Loop
  const gameTick = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;

    // Check PowerUp Expiration
    if (activePowerUp && Date.now() > activePowerUp.endTime) {
      setActivePowerUp(null);
    }

    // Spawn PowerUp Logic
    if (!powerUpItem && Date.now() - lastPowerUpSpawnTime.current > POWERUP_SPAWN_INTERVAL) {
      // 50% chance to spawn speed, 50% invincible
      const type = Math.random() > 0.5 ? PowerUpType.SPEED : PowerUpType.INVINCIBLE;
      // Get position avoiding snake and food
      const exclude = [...snake, food];
      setPowerUpItem({
        position: getRandomPosition(exclude),
        type
      });
      lastPowerUpSpawnTime.current = Date.now();
    }

    setDirection(nextDirection);
    
    const head = snake[0];
    let newHead = getNextHeadPosition(head, nextDirection);

    const isInvincible = activePowerUp?.type === PowerUpType.INVINCIBLE;

    // Special Invincibility Logic
    if (isInvincible) {
       // Check if out of bounds, if so, wrap
       newHead = wrapPosition(newHead);
       // We skip self-collision check for invincible mode
    } else {
       // Standard Collision
       if (checkCollision(newHead, snake)) {
         playSound('die');
         setGameState(GameState.GAME_OVER);
         return;
       }
    }

    const newSnake = [newHead, ...snake];

    // Check Food
    if (newHead.x === food.x && newHead.y === food.y) {
      playSound('eat');
      setScore(s => s + POINTS_PER_FOOD);
      setBaseSpeed(s => Math.max(MIN_SPEED, s - SPEED_INCREMENT));
      
      // Ensure food spawns away from snake AND existing powerup
      const exclude = [...newSnake];
      if (powerUpItem) exclude.push(powerUpItem.position);
      setFood(getRandomPosition(exclude));
      
    } else if (powerUpItem && newHead.x === powerUpItem.position.x && newHead.y === powerUpItem.position.y) {
      // Check PowerUp
      playSound('powerup');
      setActivePowerUp({
        type: powerUpItem.type,
        endTime: Date.now() + POWERUP_DURATION
      });
      setPowerUpItem(null);
      lastPowerUpSpawnTime.current = Date.now(); // Reset spawn timer
      newSnake.pop(); // Remove tail (didn't eat food)
    } else {
      newSnake.pop(); // Remove tail
    }

    setSnake(newSnake);
  }, [gameState, snake, nextDirection, food, powerUpItem, activePowerUp, playSound]);

  // Calculate actual tick rate
  const currentSpeed = activePowerUp?.type === PowerUpType.SPEED 
    ? baseSpeed * 0.5  // Speed Boost (runs 2x faster)
    : baseSpeed;

  useInterval(gameTick, gameState === GameState.PLAYING ? currentSpeed : null);

  return (
    <div className="w-full h-screen bg-black relative select-none">
      
      {/* 3D Scene */}
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 15, 12]} fov={50} />
        <OrbitControls 
          enableZoom={false} 
          enablePan={false} 
          maxPolarAngle={Math.PI / 2.5} 
          minPolarAngle={0.5}
        />
        
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 20, 10]} intensity={1} castShadow />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <GameBoard />
        <Snake segments={snake} isInvincible={activePowerUp?.type === PowerUpType.INVINCIBLE} />
        {gameState !== GameState.GAME_OVER && <Food position={food} />}
        
        {gameState !== GameState.GAME_OVER && powerUpItem && (
          <PowerUpMesh position={powerUpItem.position} type={powerUpItem.type} />
        )}

        <fog attach="fog" args={[COLORS.background, 10, 40]} />
      </Canvas>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none flex flex-col justify-between p-6">
        
        {/* Header HUD */}
        <div className="flex justify-between items-start text-white drop-shadow-lg">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-500">NEON SNAKE</h1>
            <p className="text-xs text-gray-400 opacity-80 mb-1">Desktop: WASD | Mobile: On-screen</p>
            {activePowerUp && (
              <div className={`text-sm font-bold animate-pulse ${activePowerUp.type === PowerUpType.SPEED ? 'text-cyan-400' : 'text-yellow-400'}`}>
                ACTIVE: {activePowerUp.type}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-4xl font-mono font-bold">{score}</div>
            <div className="text-sm text-gray-400">HIGH: {highScore}</div>
          </div>
        </div>

        {/* Menu / Game Over Screens */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {gameState === GameState.MENU && (
             <div className="bg-black/60 backdrop-blur-md p-8 rounded-2xl border border-green-500/30 text-center pointer-events-auto transform transition-all hover:scale-105 shadow-[0_0_30px_rgba(0,255,100,0.3)]">
               <h2 className="text-5xl font-black mb-6 text-white tracking-wider">START</h2>
               <button 
                onClick={resetGame}
                className="px-8 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-full transition-colors text-lg"
               >
                 PLAY GAME
               </button>
             </div>
          )}

          {gameState === GameState.GAME_OVER && (
            <div className="bg-black/80 backdrop-blur-md p-8 rounded-2xl border border-red-500/30 text-center pointer-events-auto shadow-[0_0_50px_rgba(255,0,80,0.4)]">
              <h2 className="text-5xl font-black mb-2 text-red-500">GAME OVER</h2>
              <p className="text-xl text-white mb-6">Final Score: {score}</p>
              <button 
               onClick={resetGame}
               className="px-8 py-3 bg-white hover:bg-gray-200 text-black font-bold rounded-full transition-colors text-lg"
              >
                TRY AGAIN
              </button>
            </div>
          )}
        </div>

        {gameState === GameState.PLAYING && (
          <div className="pointer-events-auto md:hidden">
             <Controls onMove={handleInput} />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;