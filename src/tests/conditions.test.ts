import { describe, expect, it } from 'vitest';
import { conveyorMissions } from '../data/modules';
import type { ConditionNode } from '../types/domain';
import { createCard } from '../utils/cards';
import { evaluateCondition, evaluateConveyorPath } from '../utils/conditions';

describe('condition evaluation', () => {
  it('stops at the first matching gate in conveyor order', () => {
    const mission = conveyorMissions[2];
    const card = mission.queue[1];
    const result = evaluateConveyorPath(mission, card);

    expect(result.finalLaneTag).toBe('black-lane');
    expect(result.visitedGates).toHaveLength(2);
    expect(result.visitedGates[0]?.matched).toBe(false);
    expect(result.visitedGates[1]?.matched).toBe(true);
  });

  it('handles and / or / not with comparison operators', () => {
    const condition: ConditionNode = {
      kind: 'group',
      operator: 'or',
      children: [
        {
          kind: 'group',
          operator: 'and',
          children: [
            {
              kind: 'predicate',
              field: 'card.color',
              op: '==',
              value: 'red',
            },
            {
              kind: 'predicate',
              field: 'card.rankValue',
              op: '>=',
              value: 10,
            },
          ],
        },
        {
          kind: 'not',
          child: {
            kind: 'predicate',
            field: 'card.suit',
            op: '==',
            value: 'club',
          },
        },
      ],
    };

    const passed = evaluateCondition(condition, {
      card: createCard('spade', '4'),
    });
    const failed = evaluateCondition(condition, {
      card: createCard('club', '3'),
    });

    expect(passed.passed).toBe(true);
    expect(failed.passed).toBe(false);
  });

  it('routes low numbers or spades into the if branch of the OR mission', () => {
    const mission = conveyorMissions[3];
    const lowNumber = evaluateConveyorPath(mission, createCard('club', '3'));
    const spade = evaluateConveyorPath(mission, createCard('spade', '7'));

    expect(lowNumber.finalLaneTag).toBe('vip');
    expect(spade.finalLaneTag).toBe('vip');
  });
});
