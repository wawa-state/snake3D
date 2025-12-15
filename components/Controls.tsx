import React from 'react';
import { Direction } from '../types';

interface ControlsProps {
  onMove: (dir: Direction) => void;
}

const Controls: React.FC<ControlsProps> = ({ onMove }) => {
  // Prevent default behavior to stop double-tap zoom or scrolling
  const handleTouch = (e: React.TouchEvent, dir: Direction) => {
    e.preventDefault();
    e.stopPropagation();
    onMove(dir);
  };

  const handleClick = (e: React.MouseEvent, dir: Direction) => {
    e.preventDefault();
    onMove(dir);
  }

  const ButtonBase = "w-16 h-16 bg-white/10 backdrop-blur-md rounded-full border border-white/20 active:bg-white/30 flex items-center justify-center text-white text-2xl select-none touch-none shadow-lg";

  return (
    <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center z-10 pointer-events-none">
      <div className="relative w-48 h-48 pointer-events-auto">
        {/* UP */}
        <button
          className={`${ButtonBase} absolute top-0 left-1/2 -translate-x-1/2`}
          onTouchStart={(e) => handleTouch(e, Direction.UP)}
          onMouseDown={(e) => handleClick(e, Direction.UP)}
        >
          ▲
        </button>
        
        {/* DOWN */}
        <button
          className={`${ButtonBase} absolute bottom-0 left-1/2 -translate-x-1/2`}
          onTouchStart={(e) => handleTouch(e, Direction.DOWN)}
          onMouseDown={(e) => handleClick(e, Direction.DOWN)}
        >
          ▼
        </button>
        
        {/* LEFT */}
        <button
          className={`${ButtonBase} absolute left-0 top-1/2 -translate-y-1/2`}
          onTouchStart={(e) => handleTouch(e, Direction.LEFT)}
          onMouseDown={(e) => handleClick(e, Direction.LEFT)}
        >
          ◀
        </button>
        
        {/* RIGHT */}
        <button
          className={`${ButtonBase} absolute right-0 top-1/2 -translate-y-1/2`}
          onTouchStart={(e) => handleTouch(e, Direction.RIGHT)}
          onMouseDown={(e) => handleClick(e, Direction.RIGHT)}
        >
          ▶
        </button>
      </div>
    </div>
  );
};

export default Controls;