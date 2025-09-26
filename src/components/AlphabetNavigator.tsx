import { useState, useEffect, useRef } from 'react';
import { Medicine } from '@/types/medicine';
import { cn } from '@/lib/utils';

interface AlphabetNavigatorProps {
  medicines: Medicine[];
  onLetterSelect: (letter: string) => void;
  className?: string;
}

export function AlphabetNavigator({ medicines, onLetterSelect, className }: AlphabetNavigatorProps) {
  const [activeLetter, setActiveLetter] = useState<string>('');
  const [availableLetters, setAvailableLetters] = useState<Set<string>>(new Set());

  // Generate alphabet
  const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

  // Update available letters when medicines change
  useEffect(() => {
    const letters = new Set<string>();
    medicines.forEach(medicine => {
      const firstLetter = medicine.name.charAt(0).toUpperCase();
      if (firstLetter.match(/[A-Z]/)) {
        letters.add(firstLetter);
      }
    });
    setAvailableLetters(letters);
  }, [medicines]);

  const handleLetterClick = (letter: string) => {
    if (availableLetters.has(letter)) {
      setActiveLetter(letter);
      onLetterSelect(letter);
    }
  };

  return (
    <div className={cn(
      "fixed right-2 top-1/2 -translate-y-1/2 z-50",
      "flex flex-col items-center gap-0.5 p-2 rounded-lg",
      "bg-background/95 backdrop-blur-sm border border-border shadow-lg",
      "max-h-[60vh] overflow-y-auto scrollbar-thin",
      className
    )}>
      {alphabet.map((letter) => {
        const isAvailable = availableLetters.has(letter);
        const isActive = activeLetter === letter;
        
        return (
          <button
            key={letter}
            onClick={() => handleLetterClick(letter)}
            disabled={!isAvailable}
            className={cn(
              "w-7 h-7 text-xs font-medium rounded-full transition-all duration-200",
              "flex items-center justify-center",
              isAvailable ? [
                "text-foreground hover:bg-primary hover:text-primary-foreground",
                "active:scale-95 cursor-pointer",
                isActive && "bg-primary text-primary-foreground shadow-md"
              ] : [
                "text-muted-foreground/40 cursor-not-allowed"
              ]
            )}
          >
            {letter}
          </button>
        );
      })}
    </div>
  );
}