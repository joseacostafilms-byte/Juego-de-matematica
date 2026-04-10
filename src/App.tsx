/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { 
  Trophy, 
  Star, 
  RotateCcw, 
  Play, 
  Plus, 
  Minus, 
  X, 
  Heart,
  Clock,
  Shuffle
} from 'lucide-react';
import { Operation, GameState, Problem, ANIMALS, Animal, GameMode, HighScore } from './types';

const COLORS = [
  'bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-yellow-400', 
  'bg-purple-400', 'bg-pink-400', 'bg-orange-400', 'bg-teal-400'
];

const BG_COLORS = [
  'bg-sky-400', 'bg-indigo-400', 'bg-violet-400', 'bg-fuchsia-400', 
  'bg-rose-400', 'bg-orange-400', 'bg-emerald-400'
];

export default function App() {
  const [view, setView] = useState<'story' | 'menu' | 'game' | 'result'>('story');
  const [storyStep, setStoryStep] = useState(0);
  const [selectedMode, setSelectedMode] = useState<GameMode>('normal');
  const [highScores, setHighScores] = useState<HighScore[]>(() => {
    const saved = localStorage.getItem('mathGameScores');
    return saved ? JSON.parse(saved) : [];
  });
  const [gameState, setGameState] = useState<GameState>({
    operation: 'sum',
    mode: 'normal',
    level: 1,
    score: 0,
    streak: 0,
    bestStreak: 0,
    isGameOver: false,
    currentProblem: null,
    playerName: '',
  });
  const [feedback, setFeedback] = useState<{ 
    type: 'correct' | 'wrong', 
    animal: Animal, 
    isLevelUp?: boolean,
    selectedAnswer?: number,
    correctAnswer?: number
  } | null>(null);
  const [lives, setLives] = useState(3);

  const generateProblem = useCallback((op: Operation, level: number): Problem => {
    let a, b, answer;
    const range = 5 + level * 5;

    let actualOp: 'sum' | 'sub' | 'mul' = op === 'mixed' 
      ? (['sum', 'sub', 'mul'][Math.floor(Math.random() * 3)] as 'sum' | 'sub' | 'mul')
      : op as 'sum' | 'sub' | 'mul';

    if (actualOp === 'sum') {
      a = Math.floor(Math.random() * range) + 1;
      b = Math.floor(Math.random() * range) + 1;
      answer = a + b;
    } else if (actualOp === 'sub') {
      a = Math.floor(Math.random() * range) + level;
      b = Math.floor(Math.random() * a);
      answer = a - b;
    } else {
      // Multiplication
      const mulRange = Math.min(10, 2 + Math.floor(level / 2));
      a = Math.floor(Math.random() * mulRange) + 1;
      b = Math.floor(Math.random() * 10) + 1;
      answer = a * b;
    }

    const options = [answer];
    while (options.length < 4) {
      const offset = Math.floor(Math.random() * 10) - 5;
      const wrong = Math.max(0, answer + (offset === 0 ? 7 : offset));
      if (!options.includes(wrong)) {
        options.push(wrong);
      }
    }

    return {
      a,
      b,
      answer,
      options: options.sort(() => Math.random() - 0.5),
      actualOp
    };
  }, []);

  const playAnimalSound = (animal: Animal) => {
    const audio = new Audio(animal.sound);
    audio.play().catch(e => console.log('Audio play failed', e));
  };

  const startGame = (op: Operation) => {
    const firstProblem = generateProblem(op, 1);
    setGameState(prev => ({
      ...prev,
      operation: op,
      mode: selectedMode,
      level: 1,
      score: 0,
      streak: 0,
      bestStreak: 0,
      isGameOver: false,
      currentProblem: firstProblem,
      timeLeft: selectedMode === 'time_attack' ? 60 : undefined,
    }));
    setLives(3);
    setView('game');
  };

  const endGame = useCallback((finalState: GameState) => {
    const newScore: HighScore = {
      name: finalState.playerName || 'Héroe Anónimo',
      score: finalState.score,
      mode: finalState.mode,
      operation: finalState.operation,
      date: new Date().toISOString()
    };
    setHighScores(prev => {
      const updated = [...prev, newScore].sort((a, b) => b.score - a.score).slice(0, 5);
      localStorage.setItem('mathGameScores', JSON.stringify(updated));
      return updated;
    });
    setView('result');
    setFeedback(null);
  }, []);

  useEffect(() => {
    if (gameState.isGameOver) {
      endGame(gameState);
    }
  }, [gameState.isGameOver, gameState, endGame]);

  useEffect(() => {
    if (view === 'game' && gameState.mode === 'time_attack' && !feedback && gameState.timeLeft !== undefined && gameState.timeLeft > 0) {
      const timer = setInterval(() => {
        setGameState(prev => ({ ...prev, timeLeft: (prev.timeLeft || 0) - 1 }));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [view, gameState.mode, feedback, gameState.timeLeft]);

  useEffect(() => {
    if (view === 'game' && gameState.mode === 'time_attack' && gameState.timeLeft === 0 && !gameState.isGameOver) {
       setGameState(prev => ({ ...prev, isGameOver: true }));
    }
  }, [gameState.timeLeft, view, gameState.isGameOver]);

  const handleAnswer = (selected: number) => {
    if (!gameState.currentProblem || feedback || gameState.isGameOver) return;

    const isCorrect = selected === gameState.currentProblem.answer;
    const randomAnimal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];

    if (isCorrect) {
      playAnimalSound(randomAnimal);
      
      const newStreak = gameState.streak + 1;
      const newScore = gameState.score + (10 * gameState.level);
      const shouldLevelUp = newStreak % 5 === 0;

      setFeedback({ type: 'correct', animal: randomAnimal, isLevelUp: shouldLevelUp });
      
      if (shouldLevelUp) {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FFA500', '#FF4500']
        });
      }

      if (gameState.mode === 'time_attack') {
        setGameState(prev => ({ ...prev, timeLeft: (prev.timeLeft || 0) + 3 }));
      }

      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          score: newScore,
          streak: newStreak,
          bestStreak: Math.max(prev.bestStreak, newStreak),
          level: shouldLevelUp ? prev.level + 1 : prev.level,
          currentProblem: generateProblem(prev.operation, shouldLevelUp ? prev.level + 1 : prev.level)
        }));
        setFeedback(null);
      }, 1500);
    } else {
      setFeedback({ 
        type: 'wrong', 
        animal: randomAnimal, 
        selectedAnswer: selected, 
        correctAnswer: gameState.currentProblem.answer 
      });
      
      if (gameState.mode === 'normal') {
        setLives(prev => prev - 1);
        if (lives <= 1) {
          setTimeout(() => {
            setGameState(prev => ({ ...prev, isGameOver: true }));
          }, 3000);
        } else {
          setTimeout(() => {
            setGameState(prev => ({
              ...prev,
              streak: 0,
              currentProblem: generateProblem(prev.operation, prev.level)
            }));
            setFeedback(null);
          }, 3000);
        }
      } else {
        setGameState(prev => ({ ...prev, timeLeft: Math.max(0, (prev.timeLeft || 0) - 5) }));
        setTimeout(() => {
          setGameState(prev => ({
            ...prev,
            streak: 0,
            currentProblem: generateProblem(prev.operation, prev.level)
          }));
          setFeedback(null);
        }, 2000);
      }
    }
  };

  const nextStoryStep = () => {
    if (storyStep < 5) {
      setStoryStep(prev => prev + 1);
    } else {
      setView('menu');
    }
  };

  const currentBg = view === 'game' ? BG_COLORS[(gameState.level - 1) % BG_COLORS.length] : 'bg-sky-400';

  return (
    <div className={`min-h-screen ${currentBg} font-sans text-white overflow-hidden flex flex-col items-center justify-center p-4 md:p-8 transition-colors duration-1000`}>
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 left-10 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
        <div className="absolute bottom-20 right-10 w-48 h-48 bg-yellow-300/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-pink-300/20 rounded-full blur-xl" />
      </div>

      <AnimatePresence mode="wait">
        {view === 'story' && (
          <motion.div
            key="story"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="z-10 w-full max-w-2xl p-8 md:p-12 text-white text-center relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {storyStep === 0 && (
                <motion.div
                  key="step0"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="text-8xl mb-6">📖</div>
                  <h2 className="text-3xl md:text-4xl font-black mb-6 drop-shadow-md">¡Bienvenido al Cuento!</h2>
                  <p className="text-xl mb-8 font-bold">Había una vez un valiente aventurero llamado...</p>
                  <input
                    type="text"
                    placeholder="Escribe tu nombre aquí"
                    value={gameState.playerName}
                    onChange={(e) => setGameState(prev => ({ ...prev, playerName: e.target.value }))}
                    className="w-full max-w-sm p-4 rounded-2xl border-4 border-white/30 bg-white/10 text-white placeholder:text-white/50 text-2xl text-center focus:border-white outline-none transition-colors mb-8"
                  />
                  {gameState.playerName && (
                    <motion.button
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      onClick={nextStoryStep}
                      className="bg-white text-sky-500 px-8 py-4 rounded-2xl text-2xl font-black shadow-lg hover:bg-sky-50 transition-colors"
                    >
                      ¡EMPEZAR!
                    </motion.button>
                  )}
                </motion.div>
              )}

              {storyStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <motion.div 
                    animate={{ rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-8xl mb-6"
                  >
                    🏰
                  </motion.div>
                  <h2 className="text-3xl font-black mb-6 drop-shadow-md">El Reino de los Números</h2>
                  <p className="text-xl leading-relaxed font-medium">
                    En el Reino de los Números, todo era paz... ¡hasta que un puente se rompió! 
                    El Rey necesitaba a alguien inteligente como <strong className="text-yellow-300">{gameState.playerName}</strong>.
                  </p>
                  <button onClick={nextStoryStep} className="mt-8 bg-white text-sky-500 px-8 py-4 rounded-2xl text-xl font-black shadow-lg hover:bg-sky-50 transition-all">SIGUIENTE</button>
                </motion.div>
              )}

              {storyStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="flex gap-4 mb-6">
                    <motion.div animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="text-6xl">🧱</motion.div>
                    <motion.div animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="text-6xl">🧱</motion.div>
                    <motion.div animate={{ y: [0, -20, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="text-6xl">🧱</motion.div>
                  </div>
                  <h2 className="text-3xl font-black mb-6 drop-shadow-md">El Poder de la SUMA</h2>
                  <p className="text-xl leading-relaxed font-medium">
                    <strong className="text-yellow-300">{gameState.playerName}</strong> usó el poder de la <strong>SUMA</strong> para juntar los ladrillos. 
                    ¡1 + 1 + 1... el puente volvió a brillar!
                  </p>
                  <button onClick={nextStoryStep} className="mt-8 bg-white text-sky-500 px-8 py-4 rounded-2xl text-xl font-black shadow-lg hover:bg-sky-50 transition-all">SIGUIENTE</button>
                </motion.div>
              )}

              {storyStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <motion.div 
                    animate={{ scale: [1, 0.5, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-8xl mb-6"
                  >
                    🪨
                  </motion.div>
                  <h2 className="text-3xl font-black mb-6 drop-shadow-md">La Roca Gigante</h2>
                  <p className="text-xl leading-relaxed font-medium">
                    ¡Cuidado! Una roca bloqueaba el camino. Con la <strong>RESTA</strong>, 
                    <strong className="text-yellow-300">{gameState.playerName}</strong> quitó pedacitos hasta que la roca desapareció.
                  </p>
                  <button onClick={nextStoryStep} className="mt-8 bg-white text-sky-500 px-8 py-4 rounded-2xl text-xl font-black shadow-lg hover:bg-sky-50 transition-all">SIGUIENTE</button>
                </motion.div>
              )}

              {storyStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {[...Array(9)].map((_, i) => (
                      <motion.div 
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="text-3xl"
                      >
                        🍎
                      </motion.div>
                    ))}
                  </div>
                  <h2 className="text-3xl font-black mb-6 drop-shadow-md">Cosecha Mágica</h2>
                  <p className="text-xl leading-relaxed font-medium">
                    Para alimentar al pueblo, <strong className="text-yellow-300">{gameState.playerName}</strong> usó la <strong>MULTIPLICACIÓN</strong>. 
                    ¡Una manzana se convirtió en nueve! ¡Nadie pasó hambre!
                  </p>
                  <button onClick={nextStoryStep} className="mt-8 bg-white text-sky-500 px-8 py-4 rounded-2xl text-xl font-black shadow-lg hover:bg-sky-50 transition-all">SIGUIENTE</button>
                </motion.div>
              )}

              {storyStep === 5 && (
                <motion.div
                  key="step5"
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -50, opacity: 0 }}
                  className="flex flex-col items-center"
                >
                  <motion.div 
                    animate={{ y: [0, -10, 0], scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-8xl mb-6"
                  >
                    👑
                  </motion.div>
                  <h2 className="text-3xl font-black mb-6 drop-shadow-md">¡Un Gran Héroe!</h2>
                  <p className="text-xl leading-relaxed font-medium">
                    Todo el reino celebra a <strong className="text-yellow-300">{gameState.playerName}</strong>. 
                    ¡Ahora estás listo para demostrar tus poderes matemáticos!
                  </p>
                  <button onClick={nextStoryStep} className="mt-8 bg-yellow-400 text-sky-700 px-12 py-6 rounded-2xl text-2xl font-black shadow-xl hover:bg-yellow-300 transition-all">¡A JUGAR!</button>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Progress dots */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className={`w-3 h-3 rounded-full transition-colors ${i === storyStep ? 'bg-white' : 'bg-white/30'}`} />
              ))}
            </div>
          </motion.div>
        )}

        {view === 'menu' && (
          <motion.div
            key="menu"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="z-10 text-center max-w-md w-full px-4 flex flex-col items-center"
          >
            <motion.h1 
              className="text-5xl md:text-6xl font-black mb-8 drop-shadow-lg text-white"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              MUNDO<br/>MATEMÁTICO
            </motion.h1>

            <div className="flex justify-center gap-4 mb-8 w-full">
              <button 
                onClick={() => setSelectedMode('normal')} 
                className={`flex-1 py-3 rounded-2xl font-black text-sm md:text-lg transition-all ${selectedMode === 'normal' ? 'bg-white text-sky-500 shadow-lg scale-105' : 'bg-white/20 text-white hover:bg-white/30'}`}
              >
                ❤️ NORMAL
              </button>
              <button 
                onClick={() => setSelectedMode('time_attack')} 
                className={`flex-1 py-3 rounded-2xl font-black text-sm md:text-lg transition-all ${selectedMode === 'time_attack' ? 'bg-white text-sky-500 shadow-lg scale-105' : 'bg-white/20 text-white hover:bg-white/30'}`}
              >
                ⏱️ CONTRA RELOJ
              </button>
            </div>
            
            <div className="grid gap-4 w-full">
              <MenuButton 
                icon={<Plus className="w-8 h-8" />} 
                label="SUMAR" 
                color="bg-green-500" 
                onClick={() => startGame('sum')} 
              />
              <MenuButton 
                icon={<Minus className="w-8 h-8" />} 
                label="RESTAR" 
                color="bg-orange-500" 
                onClick={() => startGame('sub')} 
              />
              <MenuButton 
                icon={<X className="w-8 h-8" />} 
                label="MULTIPLICAR" 
                color="bg-purple-500" 
                onClick={() => startGame('mul')} 
              />
              <MenuButton 
                icon={<Shuffle className="w-8 h-8" />} 
                label="MIXTO" 
                color="bg-pink-500" 
                onClick={() => startGame('mixed')} 
              />
            </div>

            <p className="mt-8 text-white/80 font-bold text-xl">¡Hola, {gameState.playerName}! 👋</p>

            {highScores.length > 0 && (
              <div className="mt-8 w-full bg-white/10 rounded-3xl p-6 backdrop-blur-sm">
                <h3 className="text-xl font-black mb-4 flex items-center justify-center gap-2"><Trophy className="text-yellow-300 w-6 h-6"/> MEJORES PUNTAJES</h3>
                <div className="space-y-2">
                  {highScores.map((score, i) => (
                    <div key={i} className="flex justify-between items-center bg-white/10 px-4 py-2 rounded-xl">
                      <span className="font-bold truncate max-w-[120px] text-left">{i + 1}. {score.name}</span>
                      <div className="flex gap-2 text-sm font-bold opacity-90 items-center">
                        <span className="text-lg">{score.mode === 'time_attack' ? '⏱️' : '❤️'}</span>
                        <span className="text-lg">{score.operation === 'sum' ? '+' : score.operation === 'sub' ? '-' : score.operation === 'mul' ? '×' : '🔀'}</span>
                        <span className="text-yellow-300 w-16 text-right">{score.score} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {view === 'game' && gameState.currentProblem && (
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="z-10 w-full max-w-2xl flex flex-col items-center px-4"
          >
            {/* HUD */}
            <div className="w-full flex justify-between items-center mb-6 md:mb-8">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 md:px-4 py-2 rounded-full">
                <Trophy className="text-yellow-300 w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xl md:text-2xl font-bold">{gameState.score}</span>
              </div>
              
              <div className="flex gap-1 items-center">
                {gameState.mode === 'normal' ? (
                  [...Array(3)].map((_, i) => (
                    <Heart 
                      key={i} 
                      className={`w-6 h-6 md:w-8 md:h-8 ${i < lives ? 'text-red-500 fill-red-500' : 'text-white/30'}`} 
                    />
                  ))
                ) : (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-black text-xl md:text-2xl ${gameState.timeLeft! <= 10 ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`}>
                    <Clock className="w-5 h-5 md:w-6 md:h-6" />
                    {gameState.timeLeft}s
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 md:px-4 py-2 rounded-full">
                <Star className="text-yellow-300 w-5 h-5 md:w-6 md:h-6" />
                <span className="text-xl md:text-2xl font-bold">Nivel {gameState.level}</span>
              </div>
            </div>

            {/* Problem Card */}
            <motion.div 
              className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl text-sky-600 mb-8 md:mb-12 w-full text-center relative overflow-hidden"
              layoutId="problem-card"
            >
              <div className="text-6xl md:text-8xl font-black flex items-center justify-center gap-4 md:gap-6 flex-wrap">
                <span>{gameState.currentProblem.a}</span>
                <span className="text-sky-300">
                  {gameState.currentProblem.actualOp === 'sum' ? '+' : gameState.currentProblem.actualOp === 'sub' ? '-' : '×'}
                </span>
                <span>{gameState.currentProblem.b}</span>
                <span className="text-sky-300">=</span>
                <span className="text-sky-200">?</span>
              </div>

              {/* Feedback Overlay */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`absolute inset-0 flex flex-col items-center justify-center z-20 ${
                      feedback.type === 'correct' ? 'bg-green-500/95' : 'bg-red-500/95'
                    } text-white p-4`}
                  >
                    {feedback.type === 'correct' ? (
                      <div className="relative flex flex-col items-center">
                        {/* Floating Stars */}
                        {[...Array(12)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0, x: 0, y: 0 }}
                            animate={{ 
                              scale: [0, 1, 0],
                              x: (Math.random() - 0.5) * 400,
                              y: (Math.random() - 0.5) * 400,
                              rotate: Math.random() * 360
                            }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="absolute"
                          >
                            <Star className="w-6 h-6 md:w-8 md:h-8 text-yellow-300 fill-yellow-300" />
                          </motion.div>
                        ))}
                        
                        <motion.span 
                          initial={{ scale: 0, rotate: -20 }}
                          animate={{ 
                            scale: [0, 1.5, 1.2],
                            rotate: [0, 10, -10, 0],
                          }}
                          className="text-7xl md:text-9xl mb-4 drop-shadow-2xl"
                        >
                          {feedback.animal.icon}
                        </motion.span>
                        
                        <motion.div
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="text-center"
                        >
                          <span className="text-3xl md:text-5xl font-black uppercase tracking-widest block mb-2">
                            {feedback.isLevelUp ? '¡NIVEL COMPLETADO!' : '¡GENIAL!'}
                          </span>
                          {gameState.streak > 1 && !feedback.isLevelUp && (
                            <motion.span 
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 0.5 }}
                              className="bg-yellow-400 text-green-700 px-4 py-1 rounded-full text-xl md:text-2xl font-black"
                            >
                              COMBO x{gameState.streak + 1}
                            </motion.span>
                          )}
                          {feedback.isLevelUp && (
                            <motion.span 
                              animate={{ y: [0, -5, 0] }}
                              transition={{ repeat: Infinity, duration: 0.6 }}
                              className="bg-white text-green-600 px-6 py-2 rounded-full text-2xl md:text-3xl font-black shadow-lg"
                            >
                              ¡SUBISTE AL NIVEL {gameState.level + 1}!
                            </motion.span>
                          )}
                        </motion.div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center w-full px-4 md:px-8">
                        <motion.span 
                          animate={{ x: [-10, 10, -10, 10, 0] }}
                          transition={{ duration: 0.4 }}
                          className="text-7xl md:text-8xl mb-4 grayscale"
                        >
                          {feedback.animal.icon}
                        </motion.span>
                        <span className="text-3xl md:text-4xl font-black uppercase tracking-widest mb-6">
                          ¡CASI!
                        </span>

                        {/* Visual Hint */}
                        {feedback.correctAnswer !== undefined && feedback.selectedAnswer !== undefined && feedback.correctAnswer <= 50 && (
                          <div className="bg-white/20 p-4 md:p-6 rounded-3xl backdrop-blur-sm w-full max-w-md">
                            <p className="text-lg md:text-xl font-bold mb-4 text-center">
                              {feedback.selectedAnswer < feedback.correctAnswer 
                                ? "¡Te faltaron algunos para llegar!" 
                                : "¡Te pasaste un poquito!"}
                            </p>
                            <div className="flex flex-wrap justify-center gap-1 md:gap-2">
                              {/* Show the selected amount */}
                              {[...Array(Math.min(feedback.selectedAnswer, feedback.correctAnswer))].map((_, i) => (
                                <motion.div
                                  key={`solid-${i}`}
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-4 h-4 md:w-6 md:h-6 bg-white rounded-full shadow-sm"
                                />
                              ))}
                              
                              {/* Show the difference */}
                              {feedback.selectedAnswer < feedback.correctAnswer && (
                                [...Array(feedback.correctAnswer - feedback.selectedAnswer)].map((_, i) => (
                                  <motion.div
                                    key={`hint-${i}`}
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ 
                                      scale: [0.8, 1.1, 1],
                                      opacity: [0.3, 0.6, 0.3] 
                                    }}
                                    transition={{ 
                                      repeat: Infinity, 
                                      duration: 1,
                                      delay: i * 0.1
                                    }}
                                    className="w-4 h-4 md:w-6 md:h-6 border-2 border-white border-dashed rounded-full"
                                  />
                                ))
                              )}

                              {/* Show the extra ones if they overshot */}
                              {feedback.selectedAnswer > feedback.correctAnswer && (
                                [...Array(Math.min(feedback.selectedAnswer - feedback.correctAnswer, 20))].map((_, i) => (
                                  <motion.div
                                    key={`extra-${i}`}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-4 h-4 md:w-6 md:h-6 bg-red-300 rounded-full flex items-center justify-center relative"
                                  >
                                    <div className="absolute w-full h-0.5 bg-red-600 rotate-45" />
                                    <div className="absolute w-full h-0.5 bg-red-600 -rotate-45" />
                                  </motion.div>
                                ))
                              )}
                            </div>
                            <p className="mt-4 text-xs md:text-sm font-bold opacity-80 text-center uppercase tracking-tighter">
                              ¡Cuenta los círculos para encontrar la respuesta!
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Options Grid */}
            <div className="grid grid-cols-2 gap-4 md:gap-6 w-full max-w-lg">
              {gameState.currentProblem.options.map((opt, i) => (
                <motion.button
                  key={`${gameState.score}-${opt}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleAnswer(opt)}
                  className={`${COLORS[i % COLORS.length]} rounded-2xl p-5 text-4xl md:text-5xl font-black shadow-xl border-b-8 border-black/20 hover:border-b-4 hover:translate-y-1 transition-all`}
                >
                  {opt}
                </motion.button>
              ))}
            </div>

            <button 
              onClick={() => setView('menu')}
              className="mt-8 md:mt-12 text-white/60 hover:text-white flex items-center gap-2 font-bold"
            >
              <RotateCcw className="w-5 h-5" />
              SALIR AL MENÚ
            </button>
          </motion.div>
        )}

        {view === 'result' && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="z-10 text-center bg-white rounded-3xl p-8 md:p-12 shadow-2xl text-sky-600 max-w-md w-full mx-4"
          >
            <Trophy className="w-20 h-20 md:w-24 md:h-24 text-yellow-400 mx-auto mb-6" />
            <h2 className="text-4xl md:text-5xl font-black mb-2 uppercase">¡Increíble, {gameState.playerName}!</h2>
            <p className="text-xl font-bold text-sky-400 mb-8">
              {gameState.mode === 'time_attack' ? '¡Se acabó el tiempo!' : '¡Eres un genio matemático!'}
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-sky-50 p-4 rounded-2xl">
                <span className="block text-sm text-sky-300 font-bold uppercase">Puntos</span>
                <span className="text-2xl md:text-3xl font-black">{gameState.score}</span>
              </div>
              <div className="bg-sky-50 p-4 rounded-2xl">
                <span className="block text-sm text-sky-300 font-bold uppercase">Mejor Racha</span>
                <span className="text-2xl md:text-3xl font-black">{gameState.bestStreak}</span>
              </div>
            </div>

            <button
              onClick={() => setView('menu')}
              className="w-full bg-sky-500 text-white rounded-2xl p-5 text-xl md:text-2xl font-black shadow-xl border-b-8 border-sky-700 hover:border-b-4 hover:translate-y-1 transition-all flex items-center justify-center gap-3"
            >
              <Play className="w-8 h-8 fill-current" />
              JUGAR DE NUEVO
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <div className="fixed bottom-4 text-white/40 text-xs md:text-sm font-bold tracking-widest uppercase">
        Aprende Jugando • {new Date().getFullYear()}
      </div>
    </div>
  );
}

function MenuButton({ icon, label, color, onClick }: { icon: ReactNode, label: string, color: string, onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, x: 10 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`${color} w-full flex items-center gap-6 p-5 rounded-2xl shadow-xl border-b-8 border-black/20 hover:border-b-4 hover:translate-y-1 transition-all`}
    >
      <div className="bg-white/20 p-3 rounded-xl">
        {icon}
      </div>
      <span className="text-3xl font-black tracking-wide">{label}</span>
    </motion.button>
  );
}
