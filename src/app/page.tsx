'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { bibleCharacters, BibleCharacter } from '@/data/bible-characters';

type GameState = 'playing' | 'won' | 'lost';
type Difficulty = 'easy' | 'medium' | 'hard';

interface GameData {
  currentCharacter: BibleCharacter;
  hintsUsed: number;
  maxHints: number;
  score: number;
  gameState: GameState;
  difficulty: Difficulty;
  round: number;
  totalRounds: number;
  streak: number;
  skipsUsed: number;
  maxSkips: number;
  usedCharacterIds: number[];
}

export default function Home() {
  const [gameData, setGameData] = useState<GameData>({
    currentCharacter: bibleCharacters[0],
    hintsUsed: 0,
    maxHints: 4,
    score: 0,
    gameState: 'playing',
    difficulty: 'medium',
    round: 1,
    totalRounds: 100, // Alterado para 100 rodadas
    streak: 0,
    skipsUsed: 0,
    maxSkips: 3,
    usedCharacterIds: []
  });

  const [userGuess, setUserGuess] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [gameLoaded, setGameLoaded] = useState(false);

  const getRandomCharacter = (usedIds: number[]): BibleCharacter | null => {
    const availableCharacters = bibleCharacters.filter(
      (c) => !usedIds.includes(c.id)
    );
    if (availableCharacters.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * availableCharacters.length);
    return availableCharacters[randomIndex];
  };

  // Funções para salvar e carregar o jogo
  const saveGame = (data: GameData) => {
    try {
      localStorage.setItem('bibleGame', JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar jogo:', error);
    }
  };

  const loadGame = (): GameData | null => {
    try {
      const saved = localStorage.getItem('bibleGame');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Verificar se o jogo salvo é válido (não está completo)
        if (parsed.round <= parsed.totalRounds && parsed.gameState !== 'won') {
          // Restaurar o personagem atual
          if (parsed.currentCharacter && parsed.currentCharacter.id) {
            const character = bibleCharacters.find(c => c.id === parsed.currentCharacter.id);
            if (character) {
              parsed.currentCharacter = character;
            }
          }
          if (!parsed.usedCharacterIds) {
            parsed.usedCharacterIds = [parsed.currentCharacter.id];
          }
          return parsed;
        }
      }
    } catch (error) {
      console.error('Erro ao carregar jogo:', error);
    }
    return null;
  };

  const clearSavedGame = () => {
    try {
      localStorage.removeItem('bibleGame');
    } catch (error) {
      console.error('Erro ao limpar jogo salvo:', error);
    }
  };

  const startNewGame = (forceNew = false) => {
    // Se não for forçado novo jogo, tentar carregar jogo salvo
    if (!forceNew && !gameLoaded) {
      const savedGame = loadGame();
      if (savedGame) {
        setGameData(savedGame);
        setGameLoaded(true);
        setMessage('Jogo continuado de onde você parou!');
        setMessageType('info');
        return;
      }
    }

    const firstCharacter = getRandomCharacter([]);
    const newGameData: GameData = {
      currentCharacter: firstCharacter!,
      hintsUsed: 0,
      maxHints: gameData.difficulty === 'easy' ? 5 : gameData.difficulty === 'medium' ? 4 : 3,
      score: 0,
      gameState: 'playing',
      difficulty: gameData.difficulty,
      round: 1,
      totalRounds: 100, // 100 rodadas
      streak: 0,
      skipsUsed: 0,
      maxSkips: gameData.difficulty === 'easy' ? 5 : gameData.difficulty === 'medium' ? 3 : 1,
      usedCharacterIds: firstCharacter ? [firstCharacter.id] : []
    };

    if (forceNew) {
      clearSavedGame();
    }

    setGameData(newGameData);
    saveGame(newGameData);
    setUserGuess('');
    setMessage('');
    setGameLoaded(true);
  };

  const confirmReset = () => {
    setShowResetDialog(true);
  };

  const handleReset = () => {
    setShowResetDialog(false);
    startNewGame(true);
  };

  const nextRound = () => {
    if (gameData.round >= gameData.totalRounds) {
      const finalData = {
        ...gameData,
        gameState: 'won' as GameState,
        usedCharacterIds: [...gameData.usedCharacterIds, gameData.currentCharacter.id],
      };
      setGameData(finalData);
      saveGame(finalData);
      setMessage(`Parabéns! Você completou todas as ${gameData.totalRounds} rodadas com pontuação total de ${gameData.score}!`);
      setMessageType('success');
      // Limpar o jogo salvo quando completar
      clearSavedGame();
      return;
    }

    const updatedUsedIds = [...gameData.usedCharacterIds, gameData.currentCharacter.id];
    const nextCharacter = getRandomCharacter(updatedUsedIds);

    if (!nextCharacter) {
      const finalData = {
        ...gameData,
        usedCharacterIds: updatedUsedIds,
        gameState: 'won' as GameState,
      };
      setGameData(finalData);
      saveGame(finalData);
      setMessage(`Parabéns! Você encontrou todos os personagens disponíveis com pontuação total de ${gameData.score}!`);
      setMessageType('success');
      clearSavedGame();
      return;
    }

    const newRoundData = {
      ...gameData,
      currentCharacter: nextCharacter,
      hintsUsed: 0,
      round: gameData.round + 1,
      usedCharacterIds: updatedUsedIds,
    };

    setGameData(newRoundData);
    saveGame(newRoundData);
    setUserGuess('');
    setMessage('');
  };

  const skipCharacter = () => {
    if (gameData.skipsUsed >= gameData.maxSkips) {
      setMessage('Você já usou todos os pulos disponíveis!');
      setMessageType('error');
      return;
    }

    const skipData = {
      ...gameData,
      skipsUsed: gameData.skipsUsed + 1,
      streak: 0
    };
    
    setGameData(skipData);
    saveGame(skipData);
    
    setMessage(`Você pulou este personagem. A resposta era: ${gameData.currentCharacter.name}`);
    setMessageType('info');
    
    setTimeout(() => {
      nextRound();
    }, 3000);
  };

  const getHint = () => {
    if (gameData.hintsUsed >= gameData.maxHints) {
      setMessage('Você já usou todas as dicas disponíveis!');
      setMessageType('error');
      return;
    }

    const hintData = { ...gameData, hintsUsed: gameData.hintsUsed + 1 };
    setGameData(hintData);
    saveGame(hintData);
  };

  const checkAnswer = () => {
    const normalizedGuess = userGuess.trim().toLowerCase();
    const normalizedAnswer = gameData.currentCharacter.name.toLowerCase();
    
    // Handle special cases like "Abraão (Abrão)"
    const alternativeNames = gameData.currentCharacter.name
      .replace(/[()]/g, '')
      .split(/[\s,;:\/\-]+/)
      .map(name => name.trim().toLowerCase())
      .filter(Boolean);

    const isCorrect = alternativeNames.includes(normalizedGuess);

    if (isCorrect) {
      const basePoints = Math.max(10 - gameData.hintsUsed, 1);
      const streakBonus = Math.min(gameData.streak * 2, 10); // Máximo de 10 pontos de bônus
      const totalPoints = basePoints + streakBonus;
      const newScore = gameData.score + totalPoints;
      
      const answerData = { 
        ...gameData, 
        score: newScore,
        streak: gameData.streak + 1
      };
      
      setGameData(answerData);
      saveGame(answerData);
      
      let successMessage = `Correto! É ${gameData.currentCharacter.name}.`;
      if (basePoints === 10) {
        successMessage += ` Perfeito! ${basePoints} pontos sem usar dicas!`;
      } else {
        successMessage += ` Você ganhou ${basePoints} pontos`;
      }
      
      if (streakBonus > 0) {
        successMessage += ` + ${streakBonus} de bônus por sequência!`;
      }
      
      setMessage(successMessage);
      setMessageType('success');
      
      setTimeout(() => {
        nextRound();
      }, 3000);
    } else {
      const wrongAnswerData = { ...gameData, streak: 0 };
      setGameData(wrongAnswerData);
      saveGame(wrongAnswerData);
      setMessage('Resposta incorreta. Tente novamente!');
      setMessageType('error');
    }
  };

  const setDifficulty = (difficulty: Difficulty) => {
    const maxHints = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 4 : 3;
    const maxSkips = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 3 : 1;
    const difficultyData = {
      ...gameData,
      difficulty,
      maxHints,
      maxSkips
    };
    setGameData(difficultyData);
    saveGame(difficultyData);
  };

  const getAvailableHints = () => {
    const hints = [];
    if (gameData.hintsUsed >= 1) hints.push(gameData.currentCharacter.mainCharacteristic);
    if (gameData.hintsUsed >= 2) hints.push(gameData.currentCharacter.centralQuality);
    if (gameData.hintsUsed >= 3) hints.push(gameData.currentCharacter.curiosity);
    if (gameData.hintsUsed >= 4) hints.push(gameData.currentCharacter.spiritualJewel);
    if (gameData.hintsUsed >= 5) hints.push(gameData.currentCharacter.practicalLesson);
    return hints;
  };

  const getHintLabel = () => {
    if (gameData.hintsUsed === 0) return 'Característica Principal';
    if (gameData.hintsUsed === 1) return 'Qualidade Central';
    if (gameData.hintsUsed === 2) return 'Curiosidade';
    if (gameData.hintsUsed === 3) return 'Joia Espiritual';
    if (gameData.hintsUsed === 4) return 'Lição Prática';
    return 'Sem mais dicas';
  };

  useEffect(() => {
    startNewGame(false);
  }, []);

  if (gameData.gameState === 'won') {
    const completedAllRounds = gameData.round >= gameData.totalRounds;
    const uniqueFoundCount = new Set(gameData.usedCharacterIds || []).size;
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="text-center">
            <CardHeader>
              <CardTitle className="text-3xl text-green-600">🎉 Jogo Concluído!</CardTitle>
              <CardDescription className="text-xl">
                {completedAllRounds
                  ? 'Parabéns por completar todas as rodadas do Quem Sou Eu? da Bíblia!'
                  : 'Parabéns! Você encontrou todos os personagens disponíveis!'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-4xl font-bold text-blue-600">
                Pontuação Final: {gameData.score}
              </div>
              <div className="text-lg text-gray-600">
                {completedAllRounds
                  ? `Você acertou ${gameData.totalRounds} personagens bíblicos!`
                  : `Você acertou ${uniqueFoundCount} personagens bíblicos!`}
              </div>
              <Button onClick={() => startNewGame(true)} size="lg" className="text-lg">
                Jogar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="text-center">
          <CardHeader>
            <CardTitle className="text-3xl text-blue-800">📖 Quem Sou Eu? - Personagens Bíblicos</CardTitle>
            <CardDescription className="text-lg">
              Teste seu conhecimento sobre os personagens da Bíblia com base em suas características!
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Game Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{gameData.score}</div>
              <div className="text-sm text-gray-600">Pontuação</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{gameData.round}/{gameData.totalRounds}</div>
              <div className="text-sm text-gray-600">Rodada</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{gameData.hintsUsed}/{gameData.maxHints}</div>
              <div className="text-sm text-gray-600">Dicas Usadas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{gameData.skipsUsed}/{gameData.maxSkips}</div>
              <div className="text-sm text-gray-600">Pulos Usados</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{gameData.streak}</div>
              <div className="text-sm text-gray-600">Sequência 🔥</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Badge variant={gameData.difficulty === 'easy' ? 'default' : gameData.difficulty === 'medium' ? 'secondary' : 'destructive'}>
                {gameData.difficulty === 'easy' ? 'Fácil' : gameData.difficulty === 'medium' ? 'Médio' : 'Difícil'}
              </Badge>
              <div className="text-sm text-gray-600 mt-1">Dificuldade</div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Progresso do Jogo</span>
              <span className="text-sm text-gray-600">{Math.round((gameData.round - 1) / gameData.totalRounds * 100)}%</span>
            </div>
            <Progress value={(gameData.round - 1) / gameData.totalRounds * 100} className="h-2" />
          </CardContent>
        </Card>

        {/* Hints Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-blue-700">💡 Dicas</CardTitle>
            <CardDescription>
              Use as dicas para descobrir quem é o personagem bíblico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {getAvailableHints().map((hint, index) => (
              <Alert key={index}>
                <AlertDescription className="text-sm">
                  {hint}
                </AlertDescription>
              </Alert>
            ))}
            
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={getHint} 
                disabled={gameData.hintsUsed >= gameData.maxHints || gameData.gameState !== 'playing'}
                variant="outline"
              >
                🎯 Pedir Dica ({getHintLabel()})
              </Button>
              
              <Button 
                onClick={skipCharacter}
                disabled={gameData.skipsUsed >= gameData.maxSkips || gameData.gameState !== 'playing'}
                variant="outline"
              >
                ⏭️ Pular Personagem
              </Button>
              
              <Button 
                onClick={() => setDifficulty('easy')} 
                variant={gameData.difficulty === 'easy' ? 'default' : 'outline'}
                size="sm"
              >
                Fácil
              </Button>
              <Button 
                onClick={() => setDifficulty('medium')} 
                variant={gameData.difficulty === 'medium' ? 'default' : 'outline'}
                size="sm"
              >
                Médio
              </Button>
              <Button 
                onClick={() => setDifficulty('hard')} 
                variant={gameData.difficulty === 'hard' ? 'default' : 'outline'}
                size="sm"
              >
                Difícil
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Answer Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-green-700">🎯 Sua Resposta</CardTitle>
            <CardDescription>
              Digite o nome do personagem bíblico que você acha que é
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Digite o nome do personagem..."
                value={userGuess}
                onChange={(e) => setUserGuess(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
                disabled={gameData.gameState !== 'playing'}
                className="flex-1"
              />
              <Button 
                onClick={checkAnswer}
                disabled={!userGuess.trim() || gameData.gameState !== 'playing'}
              >
                Verificar
              </Button>
            </div>
            
            {message && (
              <Alert className={messageType === 'success' ? 'border-green-200 bg-green-50' : messageType === 'error' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}>
                <AlertDescription className={messageType === 'success' ? 'text-green-800' : messageType === 'error' ? 'text-red-800' : 'text-blue-800'}>
                  {message}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Game Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl text-purple-700">📋 Como Jogar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <p>• O jogo mostrará dicas sobre um personagem bíblico</p>
            <p>• Use as dicas para tentar descobrir quem é o personagem</p>
            <p>• Quanto menos dicas você usar, mais pontos ganhará</p>
            <p>• Acertos consecutivos dão bônus de pontos (sequência 🔥)</p>
            <p>• Use o botão "Pular Personagem" se não souber a resposta</p>
            <p>• Complete todas as 100 rodadas para vencer o jogo</p>
            <p>• Seu progresso é salvo automaticamente e pode continuar onde parou</p>
            <p>• Escolha a dificuldade: Fácil (5 dicas, 5 pulos), Médio (4 dicas, 3 pulos), Difícil (3 dicas, 1 pulo)</p>
          </CardContent>
        </Card>

        {/* Reset Button */}
        <div className="text-center">
          <Button onClick={confirmReset} variant="outline" size="lg">
            🔄 Reiniciar Jogo
          </Button>
        </div>

        {/* Confirmation Dialog */}
        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Reinício</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja reiniciar o jogo? Todo o seu progresso atual será perdido e um novo jogo começará.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResetDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleReset}>
                Sim, Reiniciar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
