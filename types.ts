export type Vector2 = {
  x: number;
  y: number;
};

export enum GameState {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export interface GameSettings {
  gridSize: number;
  initialSpeed: number;
}

export enum PowerUpType {
  SPEED = 'SPEED',
  INVINCIBLE = 'INVINCIBLE',
}

export interface PowerUpItem {
  position: Vector2;
  type: PowerUpType;
}

export interface ActivePowerUp {
  type: PowerUpType;
  endTime: number;
}