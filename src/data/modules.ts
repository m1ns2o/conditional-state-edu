import type {
  ComparisonOperator,
  ConditionNode,
  ConveyorMission,
  MissionCard,
  OutputLane,
  RankLabel,
  RuleToken,
  Suit,
} from '../types/domain';
import {
  colorNames,
  createCard,
  describeCard,
  describeCardShort,
  suitNames,
  suitSymbols,
} from '../utils/cards';

const defaultSpeedProfile = {
  approachMs: 420,
  gateMs: 520,
  divertMs: 640,
};

function missionCard(suit: Suit, rankLabel: RankLabel): MissionCard {
  const base = createCard(suit, rankLabel);
  return {
    ...base,
    displayName: describeCard(base),
    shortLabel: describeCardShort(base),
  };
}

function colorToken(color: 'red' | 'black'): RuleToken {
  return {
    kind: 'color',
    label: colorNames[color],
    tone: color,
  };
}

function suitToken(suit: Suit): RuleToken {
  return {
    kind: 'suit',
    icon: suitSymbols[suit],
    label: suitNames[suit],
    tone: suit === 'heart' || suit === 'diamond' ? 'red' : 'ink',
  };
}

function compareToken(label: string): RuleToken {
  return {
    kind: 'compare',
    label,
    tone: 'gold',
  };
}

function logicToken(label: 'and' | 'or' | 'not'): RuleToken {
  return {
    kind: 'logic',
    label,
    tone: 'teal',
  };
}

function flowToken(label: 'if' | 'elif'): RuleToken {
  return {
    kind: 'word',
    label,
    tone: 'ink',
  };
}

function fallbackToken(label = 'else'): RuleToken {
  return {
    kind: 'fallback',
    label,
    tone: 'ink',
  };
}

function predicate(
  field: string,
  op: ComparisonOperator,
  value: string | number | boolean,
): ConditionNode {
  return {
    kind: 'predicate',
    field,
    op,
    value,
  };
}

function lane(
  tag: string,
  label: string,
  position: OutputLane['position'],
  accent: OutputLane['accent'],
  description: string,
): OutputLane {
  return {
    tag,
    label,
    position,
    accent,
    description,
  };
}

function lineLabel(order: number): string {
  return `${order}번 라인`;
}

const baseConveyorMissions: ConveyorMission[] = [
  {
    id: 'line-1',
    index: 1,
    title: 'IF / ELSE + AND',
    goal: '검은색이고 숫자값이 큰 카드만 IF로 보내면서 AND의 의미를 익히세요.',
    lanes: [
      lane('power', lineLabel(1), 'back', 'gold', 'IF가 참일 때 이동하는 1번 컨베이어'),
      lane('regular', lineLabel(2), 'front', 'ink', 'IF가 거짓일 때 이동하는 2번 컨베이어'),
    ],
    gates: [
      {
        id: 'gate-black-and-high',
        signTokens: [flowToken('if'), colorToken('black'), logicToken('and'), compareToken('>= 8')],
        guideLabel: '검은색이고 숫자값이 8 이상이면',
        laneTag: 'power',
        condition: {
          kind: 'group',
          operator: 'and',
          children: [
            predicate('card.color', '==', 'black'),
            predicate('card.rankValue', '>=', 8),
          ],
        },
        matchLabel: `검은색이고 8 이상이라 IF가 먼저 실행되어 ${lineLabel(1)}`,
        missLabel: 'IF 조건이 아니어서 ELSE 검사',
      },
      {
        id: 'gate-and-default',
        signTokens: [fallbackToken()],
        guideLabel: '그 외에는',
        laneTag: 'regular',
        matchLabel: `앞 IF가 아니어서 ELSE로 ${lineLabel(2)}`,
        missLabel: '기본 레일',
      },
    ],
    card: missionCard('spade', '9'),
    speedProfile: defaultSpeedProfile,
  },
  {
    id: 'line-2',
    index: 2,
    title: 'IF / ELSE + OR',
    goal: '둘 중 하나만 맞아도 IF가 실행되는 OR의 흐름을 익히세요.',
    lanes: [
      lane('red-suit', lineLabel(1), 'back', 'red', 'IF가 참일 때 이동하는 1번 컨베이어'),
      lane('other-suit', lineLabel(2), 'front', 'ink', 'IF가 거짓일 때 이동하는 2번 컨베이어'),
    ],
    gates: [
      {
        id: 'gate-red-suit-or',
        signTokens: [flowToken('if'), suitToken('heart'), logicToken('or'), suitToken('diamond')],
        guideLabel: '하트이거나 다이아이면',
        laneTag: 'red-suit',
        condition: {
          kind: 'group',
          operator: 'or',
          children: [
            predicate('card.suit', '==', 'heart'),
            predicate('card.suit', '==', 'diamond'),
          ],
        },
        matchLabel: `하트 또는 다이아라서 IF가 실행되어 ${lineLabel(1)}`,
        missLabel: 'IF 조건이 아니어서 ELSE 검사',
      },
      {
        id: 'gate-or-default',
        signTokens: [fallbackToken()],
        guideLabel: '그 외에는',
        laneTag: 'other-suit',
        matchLabel: `앞 IF가 아니어서 ELSE로 ${lineLabel(2)}`,
        missLabel: '기본 레일',
      },
    ],
    card: missionCard('diamond', '4'),
    speedProfile: defaultSpeedProfile,
  },
  {
    id: 'line-2a',
    index: 3,
    title: 'IF / ELSE + OR 쉬운',
    goal: 'OR에서 둘 중 하나만 참이어도 IF로 간다는 점을 아주 가볍게 익히세요.',
    lanes: [
      lane('easy-or', lineLabel(1), 'back', 'red', 'IF가 참일 때 이동하는 1번 컨베이어'),
      lane('easy-or-default', lineLabel(2), 'front', 'ink', 'IF가 거짓일 때 이동하는 2번 컨베이어'),
    ],
    gates: [
      {
        id: 'gate-red-or-low',
        signTokens: [flowToken('if'), colorToken('red'), logicToken('or'), compareToken('<= 4')],
        guideLabel: '빨간색이거나 숫자값이 4 이하이면',
        laneTag: 'easy-or',
        condition: {
          kind: 'group',
          operator: 'or',
          children: [
            predicate('card.color', '==', 'red'),
            predicate('card.rankValue', '<=', 4),
          ],
        },
        matchLabel: `빨간색이거나 4 이하라서 IF가 실행되어 ${lineLabel(1)}`,
        missLabel: 'IF 조건이 아니어서 ELSE 검사',
      },
      {
        id: 'gate-red-or-low-default',
        signTokens: [fallbackToken()],
        guideLabel: '그 외에는',
        laneTag: 'easy-or-default',
        matchLabel: `앞 IF가 아니어서 ELSE로 ${lineLabel(2)}`,
        missLabel: '기본 레일',
      },
    ],
    card: missionCard('heart', '3'),
    speedProfile: defaultSpeedProfile,
  },
  {
    id: 'line-2b',
    index: 4,
    title: 'IF / ELSE + AND 쉬운',
    goal: 'AND에서 두 조건이 모두 참이어야 IF로 간다는 점을 쉽게 익히세요.',
    lanes: [
      lane('easy-and', lineLabel(1), 'back', 'gold', 'IF가 참일 때 이동하는 1번 컨베이어'),
      lane('easy-and-default', lineLabel(2), 'front', 'ink', 'IF가 거짓일 때 이동하는 2번 컨베이어'),
    ],
    gates: [
      {
        id: 'gate-black-and-spade',
        signTokens: [flowToken('if'), colorToken('black'), logicToken('and'), suitToken('spade')],
        guideLabel: '검은색이고 스페이드이면',
        laneTag: 'easy-and',
        condition: {
          kind: 'group',
          operator: 'and',
          children: [
            predicate('card.color', '==', 'black'),
            predicate('card.suit', '==', 'spade'),
          ],
        },
        matchLabel: `검은색이고 스페이드라서 IF가 실행되어 ${lineLabel(1)}`,
        missLabel: 'IF 조건이 아니어서 ELSE 검사',
      },
      {
        id: 'gate-black-and-spade-default',
        signTokens: [fallbackToken()],
        guideLabel: '그 외에는',
        laneTag: 'easy-and-default',
        matchLabel: `앞 IF가 아니어서 ELSE로 ${lineLabel(2)}`,
        missLabel: '기본 레일',
      },
    ],
    card: missionCard('spade', '6'),
    speedProfile: defaultSpeedProfile,
  },
  {
    id: 'line-3',
    index: 5,
    title: 'IF / ELSE + NOT',
    goal: 'NOT으로 검사를 뒤집는 방식을 익히세요.',
    lanes: [
      lane('not-black', lineLabel(1), 'back', 'teal', 'IF가 참일 때 이동하는 1번 컨베이어'),
      lane('black-only', lineLabel(2), 'front', 'ink', 'IF가 거짓일 때 이동하는 2번 컨베이어'),
    ],
    gates: [
      {
        id: 'gate-not-black',
        signTokens: [flowToken('if'), logicToken('not'), colorToken('black')],
        guideLabel: '검은색이 아니면',
        laneTag: 'not-black',
        condition: {
          kind: 'not',
          child: predicate('card.color', '==', 'black'),
        },
        matchLabel: `검은색이 아니라서 IF가 실행되어 ${lineLabel(1)}`,
        missLabel: 'IF 조건이 아니어서 ELSE 검사',
      },
      {
        id: 'gate-not-default',
        signTokens: [fallbackToken()],
        guideLabel: '그 외에는',
        laneTag: 'black-only',
        matchLabel: `앞 IF가 아니어서 ELSE로 ${lineLabel(2)}`,
        missLabel: '기본 레일',
      },
    ],
    card: missionCard('diamond', '3'),
    speedProfile: defaultSpeedProfile,
  },
  {
    id: 'line-4',
    index: 6,
    title: 'IF / ELIF / ELSE 색상·문양',
    goal: '첫 IF가 거짓일 때만 ELIF로 내려가는 흐름을 익히세요.',
    lanes: [
      lane('red-lane', lineLabel(1), 'back', 'red', '첫 IF가 참일 때 이동하는 1번 컨베이어'),
      lane('spade-lane', lineLabel(2), 'middle', 'ink', 'ELIF가 참일 때 이동하는 2번 컨베이어'),
      lane('other-lane', lineLabel(3), 'front', 'teal', '앞 조건이 모두 거짓일 때 이동하는 3번 컨베이어'),
    ],
    gates: [
      {
        id: 'gate-red',
        signTokens: [flowToken('if'), colorToken('red')],
        guideLabel: '빨간색이면',
        laneTag: 'red-lane',
        condition: predicate('card.color', '==', 'red'),
        matchLabel: `빨간 카드라서 IF가 먼저 실행되어 ${lineLabel(1)}`,
        missLabel: 'IF 조건이 아니어서 ELIF 검사',
      },
      {
        id: 'gate-spade',
        signTokens: [flowToken('elif'), suitToken('spade')],
        guideLabel: '스페이드이면',
        laneTag: 'spade-lane',
        condition: predicate('card.suit', '==', 'spade'),
        matchLabel: `앞 IF는 아니고 스페이드라서 ELIF로 ${lineLabel(2)}`,
        missLabel: 'ELIF 조건도 아니어서 ELSE로 이동',
      },
      {
        id: 'gate-color-suit-default',
        signTokens: [fallbackToken()],
        guideLabel: '그 외에는',
        laneTag: 'other-lane',
        matchLabel: `앞 IF와 ELIF가 모두 아니어서 ELSE로 ${lineLabel(3)}`,
        missLabel: '기본 레일',
      },
    ],
    card: missionCard('spade', '4'),
    speedProfile: defaultSpeedProfile,
  },
  {
    id: 'line-5',
    index: 7,
    title: 'IF / ELIF / ELSE 순차',
    goal: '카드가 뒤 조건에도 맞더라도 앞 IF가 먼저 참이면 거기서 끝난다는 점을 익히세요.',
    lanes: [
      lane('priority-lane', lineLabel(1), 'back', 'gold', '첫 IF가 참일 때 이동하는 1번 컨베이어'),
      lane('black-lane', lineLabel(2), 'middle', 'ink', 'ELIF가 참일 때 이동하는 2번 컨베이어'),
      lane('branch-default', lineLabel(3), 'front', 'teal', '앞 조건이 모두 거짓일 때 이동하는 3번 컨베이어'),
    ],
    gates: [
      {
        id: 'gate-high-rank',
        signTokens: [flowToken('if'), compareToken('>= 9')],
        guideLabel: '숫자값이 9 이상이면',
        laneTag: 'priority-lane',
        condition: predicate('card.rankValue', '>=', 9),
        matchLabel: `숫자값이 9 이상이라 IF가 먼저 실행되어 ${lineLabel(1)}`,
        missLabel: 'IF 조건이 아니어서 ELIF 검사',
      },
      {
        id: 'gate-black-next',
        signTokens: [flowToken('elif'), colorToken('black')],
        guideLabel: '검은색이면',
        laneTag: 'black-lane',
        condition: predicate('card.color', '==', 'black'),
        matchLabel: `앞 IF는 아니고 검은색이라서 ELIF로 ${lineLabel(2)}`,
        missLabel: 'ELIF 조건도 아니어서 ELSE로 이동',
      },
      {
        id: 'gate-sequence-default',
        signTokens: [fallbackToken()],
        guideLabel: '그 외에는',
        laneTag: 'branch-default',
        matchLabel: `앞 IF와 ELIF가 모두 아니어서 ELSE로 ${lineLabel(3)}`,
        missLabel: '기본 레일',
      },
    ],
    card: missionCard('spade', '10'),
    speedProfile: defaultSpeedProfile,
  },
  {
    id: 'line-6',
    index: 8,
    title: 'IF / ELIF / ELSE + AND / NOT',
    goal: '복합 IF가 거짓일 때 ELIF의 NOT 조건으로 넘어가는 흐름을 익히세요.',
    lanes: [
      lane('power', lineLabel(1), 'back', 'gold', '첫 IF가 참일 때 이동하는 1번 컨베이어'),
      lane('special', lineLabel(2), 'middle', 'red', 'ELIF가 참일 때 이동하는 2번 컨베이어'),
      lane('middle', lineLabel(3), 'front', 'teal', '앞 조건이 모두 거짓일 때 이동하는 3번 컨베이어'),
    ],
    gates: [
      {
        id: 'gate-red-and-high',
        signTokens: [flowToken('if'), colorToken('red'), logicToken('and'), compareToken('>= 10')],
        guideLabel: '빨간색이고 숫자값이 10 이상이면',
        laneTag: 'power',
        condition: {
          kind: 'group',
          operator: 'and',
          children: [
            predicate('card.color', '==', 'red'),
            predicate('card.rankValue', '>=', 10),
          ],
        },
        matchLabel: `빨간색이고 10 이상이라 IF가 먼저 실행되어 ${lineLabel(1)}`,
        missLabel: 'IF 조건이 아니어서 ELIF 검사',
      },
      {
        id: 'gate-not-black-next',
        signTokens: [flowToken('elif'), logicToken('not'), colorToken('black')],
        guideLabel: '검은색이 아니면',
        laneTag: 'special',
        condition: {
          kind: 'not',
          child: predicate('card.color', '==', 'black'),
        },
        matchLabel: `앞 IF는 아니고 검은색이 아니라서 ELIF로 ${lineLabel(2)}`,
        missLabel: 'ELIF 조건도 아니어서 ELSE로 이동',
      },
      {
        id: 'gate-mixed-default',
        signTokens: [fallbackToken()],
        guideLabel: '그 외에는',
        laneTag: 'middle',
        matchLabel: `앞 IF와 ELIF가 모두 아니어서 ELSE로 ${lineLabel(3)}`,
        missLabel: '기본 레일',
      },
    ],
    card: missionCard('heart', '6'),
    speedProfile: defaultSpeedProfile,
  },
  {
    id: 'line-7',
    index: 9,
    title: 'IF / ELSE + 숫자 비교',
    goal: '단일 비교 연산으로도 분기가 갈린다는 점을 익히세요.',
    lanes: [
      lane('low-rank', lineLabel(1), 'back', 'teal', 'IF가 참일 때 이동하는 1번 컨베이어'),
      lane('high-rank', lineLabel(2), 'front', 'gold', 'IF가 거짓일 때 이동하는 2번 컨베이어'),
    ],
    gates: [
      {
        id: 'gate-low-rank',
        signTokens: [flowToken('if'), compareToken('< 5')],
        guideLabel: '숫자값이 5 미만이면',
        laneTag: 'low-rank',
        condition: predicate('card.rankValue', '<', 5),
        matchLabel: `숫자값이 5 미만이라 IF가 실행되어 ${lineLabel(1)}`,
        missLabel: 'IF 조건이 아니어서 ELSE 검사',
      },
      {
        id: 'gate-low-rank-default',
        signTokens: [fallbackToken()],
        guideLabel: '그 외에는',
        laneTag: 'high-rank',
        matchLabel: `앞 IF가 아니어서 ELSE로 ${lineLabel(2)}`,
        missLabel: '기본 레일',
      },
    ],
    card: missionCard('club', '2'),
    speedProfile: defaultSpeedProfile,
  },
  {
    id: 'line-8',
    index: 10,
    title: 'IF / ELIF / ELSE + OR / AND',
    goal: '앞 OR 조건과 뒤 AND 조건이 함께 있을 때 실제 실행 순서를 익히세요.',
    lanes: [
      lane('priority-mix', lineLabel(1), 'back', 'red', '첫 IF가 참일 때 이동하는 1번 컨베이어'),
      lane('black-strong', lineLabel(2), 'middle', 'ink', 'ELIF가 참일 때 이동하는 2번 컨베이어'),
      lane('mix-default', lineLabel(3), 'front', 'teal', '앞 조건이 모두 거짓일 때 이동하는 3번 컨베이어'),
    ],
    gates: [
      {
        id: 'gate-red-or-ten',
        signTokens: [flowToken('if'), colorToken('red'), logicToken('or'), compareToken('>= 10')],
        guideLabel: '빨간색이거나 숫자값이 10 이상이면',
        laneTag: 'priority-mix',
        condition: {
          kind: 'group',
          operator: 'or',
          children: [
            predicate('card.color', '==', 'red'),
            predicate('card.rankValue', '>=', 10),
          ],
        },
        matchLabel: `빨간색이거나 10 이상이라 IF가 먼저 실행되어 ${lineLabel(1)}`,
        missLabel: 'IF 조건이 아니어서 ELIF 검사',
      },
      {
        id: 'gate-black-and-seven',
        signTokens: [flowToken('elif'), colorToken('black'), logicToken('and'), compareToken('>= 7')],
        guideLabel: '검은색이고 숫자값이 7 이상이면',
        laneTag: 'black-strong',
        condition: {
          kind: 'group',
          operator: 'and',
          children: [
            predicate('card.color', '==', 'black'),
            predicate('card.rankValue', '>=', 7),
          ],
        },
        matchLabel: `앞 IF는 아니고 검은색이며 7 이상이라 ELIF로 ${lineLabel(2)}`,
        missLabel: 'ELIF 조건도 아니어서 ELSE로 이동',
      },
      {
        id: 'gate-mix-default',
        signTokens: [fallbackToken()],
        guideLabel: '그 외에는',
        laneTag: 'mix-default',
        matchLabel: `앞 IF와 ELIF가 모두 아니어서 ELSE로 ${lineLabel(3)}`,
        missLabel: '기본 레일',
      },
    ],
    card: missionCard('spade', '8'),
    speedProfile: defaultSpeedProfile,
  },
];

const conveyorMissionOrder = [
  'line-7',
  'line-2a',
  'line-2b',
  'line-3',
  'line-2',
  'line-1',
  'line-4',
  'line-5',
  'line-6',
  'line-8',
] as const;

const conveyorMissionMap = new Map(
  baseConveyorMissions.map((mission) => [mission.id, mission]),
);

export const conveyorMissions: ConveyorMission[] = conveyorMissionOrder.map(
  (missionId, index) => {
    const mission = conveyorMissionMap.get(missionId);

    if (!mission) {
      throw new Error(`Unknown conveyor mission: ${missionId}`);
    }

    return {
      ...mission,
      index: index + 1,
    };
  },
);
