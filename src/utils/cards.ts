import type { Card, CardColor, RankLabel, Suit } from '../types/domain';

export const suitSymbols: Record<Suit, string> = {
  heart: '♥',
  diamond: '♦',
  spade: '♠',
  club: '♣',
};

export const suitNames: Record<Suit, string> = {
  heart: '하트',
  diamond: '다이아',
  spade: '스페이드',
  club: '클로버',
};

export const colorNames: Record<CardColor, string> = {
  red: '빨강',
  black: '검정',
};

const rankValues: Record<RankLabel, number> = {
  A: 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
};

export function deriveColor(suit: Suit): CardColor {
  return suit === 'heart' || suit === 'diamond' ? 'red' : 'black';
}

export function deriveRankValue(rankLabel: RankLabel): number {
  return rankValues[rankLabel];
}

export function createCard(suit: Suit, rankLabel: RankLabel): Card {
  return {
    id: `${suit}-${rankLabel}`,
    suit,
    rankLabel,
    rankValue: deriveRankValue(rankLabel),
    color: deriveColor(suit),
  };
}

export function describeCard(card: Card): string {
  return `${colorNames[card.color]} ${suitNames[card.suit]} ${card.rankLabel}`;
}

export function describeCardShort(card: Card): string {
  return `${suitSymbols[card.suit]} ${card.rankLabel}`;
}
