import { Vector2, Direction } from '../types';
import { GRID_SIZE } from '../constants';

const BOUNDARY = Math.floor(GRID_SIZE / 2);

export const getRandomPosition = (exclude: Vector2[]): Vector2 => {
  let newPos: Vector2;
  let isColliding;

  do {
    newPos = {
      x: Math.floor(Math.random() * GRID_SIZE) - BOUNDARY,
      y: Math.floor(Math.random() * GRID_SIZE) - BOUNDARY,
    };

    // eslint-disable-next-line no-loop-func
    isColliding = exclude.some(pos => pos.x === newPos.x && pos.y === newPos.y);
  } while (isColliding);

  return newPos;
};

export const checkCollision = (head: Vector2, snakeBody: Vector2[]): boolean => {
  // Wall Collision
  if (Math.abs(head.x) > BOUNDARY || Math.abs(head.y) > BOUNDARY) {
    return true;
  }

  // Self Collision (start from index 1 because index 0 is head)
  for (let i = 1; i < snakeBody.length; i++) {
    if (head.x === snakeBody[i].x && head.y === snakeBody[i].y) {
      return true;
    }
  }

  return false;
};

export const wrapPosition = (pos: Vector2): Vector2 => {
  const newPos = { ...pos };
  if (newPos.x > BOUNDARY) newPos.x = -BOUNDARY;
  else if (newPos.x < -BOUNDARY) newPos.x = BOUNDARY;
  
  if (newPos.y > BOUNDARY) newPos.y = -BOUNDARY;
  else if (newPos.y < -BOUNDARY) newPos.y = BOUNDARY;
  
  return newPos;
};

export const getNextHeadPosition = (head: Vector2, direction: Direction): Vector2 => {
  const newHead = { ...head };
  switch (direction) {
    case Direction.UP:
      newHead.y -= 1; // In 3D top-down view, -y is often "up" or "forward" depending on camera
      break;
    case Direction.DOWN:
      newHead.y += 1;
      break;
    case Direction.LEFT:
      newHead.x -= 1;
      break;
    case Direction.RIGHT:
      newHead.x += 1;
      break;
  }
  return newHead;
};

export const isOppositeDirection = (dir1: Direction, dir2: Direction): boolean => {
  if (dir1 === Direction.UP && dir2 === Direction.DOWN) return true;
  if (dir1 === Direction.DOWN && dir2 === Direction.UP) return true;
  if (dir1 === Direction.LEFT && dir2 === Direction.RIGHT) return true;
  if (dir1 === Direction.RIGHT && dir2 === Direction.LEFT) return true;
  return false;
};