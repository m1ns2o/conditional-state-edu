import { describe, expect, it } from 'vitest';
import { createCard, deriveColor, deriveRankValue } from '../utils/cards';

describe('card helpers', () => {
  it('derives colors from suits', () => {
    expect(deriveColor('heart')).toBe('red');
    expect(deriveColor('diamond')).toBe('red');
    expect(deriveColor('spade')).toBe('black');
    expect(deriveColor('club')).toBe('black');
  });

  it('maps rank labels to numeric values with A as 1', () => {
    expect(deriveRankValue('A')).toBe(1);
    expect(deriveRankValue('10')).toBe(10);
    expect(deriveRankValue('J')).toBe(11);
    expect(deriveRankValue('Q')).toBe(12);
    expect(deriveRankValue('K')).toBe(13);
  });

  it('creates a normalized card object', () => {
    expect(createCard('spade', 'A')).toEqual({
      id: 'spade-A',
      suit: 'spade',
      color: 'black',
      rankLabel: 'A',
      rankValue: 1,
    });
  });
});
