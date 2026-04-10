
export type Operation = 'sum' | 'sub' | 'mul';

export interface GameState {
  operation: Operation;
  level: number;
  score: number;
  streak: number;
  bestStreak: number;
  isGameOver: boolean;
  currentProblem: Problem | null;
  playerName: string;
}

export interface Problem {
  a: number;
  b: number;
  answer: number;
  options: number[];
}

export interface Animal {
  name: string;
  icon: string;
  sound: string;
  color: string;
}

export const ANIMALS: Animal[] = [
  { 
    name: 'Vaca', 
    icon: '🐄', 
    sound: 'https://www.soundjay.com/nature/sounds/cow-moo-1.mp3',
    color: 'bg-white'
  },
  { 
    name: 'Oveja', 
    icon: '🐑', 
    sound: 'https://www.soundjay.com/nature/sounds/sheep-lamb-1.mp3',
    color: 'bg-gray-100'
  },
  { 
    name: 'Pato', 
    icon: '🦆', 
    sound: 'https://www.soundjay.com/nature/sounds/duck-quack-1.mp3',
    color: 'bg-yellow-100'
  },
  { 
    name: 'Pollo', 
    icon: '🐥', 
    sound: 'https://www.soundjay.com/nature/sounds/chicken-cluck-1.mp3',
    color: 'bg-orange-100'
  },
  { 
    name: 'Cerdo', 
    icon: '🐷', 
    sound: 'https://www.soundjay.com/nature/sounds/pig-grunt-1.mp3',
    color: 'bg-pink-100'
  },
  { 
    name: 'León', 
    icon: '🦁', 
    sound: 'https://www.soundjay.com/nature/sounds/lion-growl-1.mp3',
    color: 'bg-orange-200'
  },
  { 
    name: 'Mono', 
    icon: '🐒', 
    sound: 'https://www.soundjay.com/nature/sounds/monkey-1.mp3',
    color: 'bg-amber-200'
  },
  {
    name: 'Elefante',
    icon: '🐘',
    sound: 'https://www.soundjay.com/nature/sounds/elephant-trumpeting-1.mp3',
    color: 'bg-blue-100'
  },
  {
    name: 'Rana',
    icon: '🐸',
    sound: 'https://www.soundjay.com/nature/sounds/frog-croak-1.mp3',
    color: 'bg-green-100'
  },
  {
    name: 'Caballo',
    icon: '🐎',
    sound: 'https://www.soundjay.com/nature/sounds/horse-whinny-1.mp3',
    color: 'bg-brown-100'
  },
  {
    name: 'Gallo',
    icon: '🐓',
    sound: 'https://www.soundjay.com/nature/sounds/rooster-crowing-1.mp3',
    color: 'bg-red-100'
  },
  {
    name: 'Gato',
    icon: '🐱',
    sound: 'https://www.soundjay.com/nature/sounds/cat-meow-1.mp3',
    color: 'bg-orange-50'
  },
  {
    name: 'Perro',
    icon: '🐶',
    sound: 'https://www.soundjay.com/nature/sounds/dog-bark-1.mp3',
    color: 'bg-yellow-50'
  },
  {
    name: 'Búho',
    icon: '🦉',
    sound: 'https://www.soundjay.com/nature/sounds/owl-hooting-1.mp3',
    color: 'bg-indigo-100'
  },
  {
    name: 'Abeja',
    icon: '🐝',
    sound: 'https://www.soundjay.com/nature/sounds/bee-buzzing-1.mp3',
    color: 'bg-yellow-200'
  }
];
