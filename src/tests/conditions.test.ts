import { describe, expect, it } from 'vitest';
import { conveyorMissions } from '../data/modules';
import type { ConditionNode } from '../types/domain';
import { createCard } from '../utils/cards';
import { evaluateCondition, evaluateConveyorPath } from '../utils/conditions';

function getMission(id: string) {
  const mission = conveyorMissions.find((candidate) => candidate.id === id);

  expect(mission).toBeDefined();
  return mission!;
}

describe('condition evaluation', () => {
  it('continues to the next gate until it finds a matching branch', () => {
    const mission = getMission('line-4');
    const card = mission.card;
    const result = evaluateConveyorPath(mission, card);

    expect(result.finalLaneTag).toBe('spade-lane');
    expect(result.visitedGates).toHaveLength(2);
    expect(result.visitedGates[0]?.matched).toBe(false);
    expect(result.visitedGates[1]?.matched).toBe(true);
  });

  it('keeps execution on the first if branch even if a later elif would also match', () => {
    const mission = getMission('line-5');
    const card = mission.card;
    const result = evaluateConveyorPath(mission, card);

    expect(result.finalLaneTag).toBe('priority-lane');
    expect(result.visitedGates).toHaveLength(1);
    expect(result.visitedGates[0]?.matched).toBe(true);
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

  it('routes each question by its own rule and card pair', () => {
    const andMission = getMission('line-1');
    const orMission = getMission('line-2');
    const easyOrMission = getMission('line-2a');
    const easyAndMission = getMission('line-2b');
    const notMission = getMission('line-3');
    const andCard = evaluateConveyorPath(andMission, andMission.card);
    const orCard = evaluateConveyorPath(orMission, orMission.card);
    const easyOrCard = evaluateConveyorPath(easyOrMission, easyOrMission.card);
    const easyAndCard = evaluateConveyorPath(easyAndMission, easyAndMission.card);
    const notCard = evaluateConveyorPath(notMission, notMission.card);
    const mixedMission = getMission('line-6');
    const mixedCard = evaluateConveyorPath(mixedMission, mixedMission.card);

    expect(andCard.finalLaneTag).toBe('power');
    expect(orCard.finalLaneTag).toBe('red-suit');
    expect(easyOrCard.finalLaneTag).toBe('easy-or');
    expect(easyAndCard.finalLaneTag).toBe('easy-and');
    expect(notCard.finalLaneTag).toBe('not-black');
    expect(mixedCard.finalLaneTag).toBe('special');
  });
});
