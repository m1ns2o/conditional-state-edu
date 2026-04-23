import type {
  ComparisonOperator,
  ConditionNode,
  ConveyorMission,
  MissionCard,
  OutputLane,
  RuleToken,
  Suit,
  RankLabel,
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

export const conveyorMissions: ConveyorMission[] = [
  {
    id: 'line-1',
    index: 1,
    title: 'IF / ELSE 기본',
    goal: '먼저 IF를 검사하고, 맞지 않으면 ELSE로 내려가는 흐름을 익히세요.',
    lanes: [
      lane('left-red', lineLabel(1), 'back', 'red', 'IF가 참일 때 이동하는 1번 컨베이어'),
      lane('right-black', lineLabel(2), 'front', 'ink', 'IF가 거짓일 때 이동하는 2번 컨베이어'),
    ],
    gates: [
      {
        id: 'gate-red',
        signTokens: [flowToken('if'), colorToken('red')],
        guideLabel: '빨간색이면',
        laneTag: 'left-red',
        condition: predicate('card.color', '==', 'red'),
        matchLabel: `빨간 카드라서 IF가 실행되어 ${lineLabel(1)}`,
        missLabel: 'IF 조건이 아니어서 ELSE 검사',
      },
      {
        id: 'gate-default',
        signTokens: [fallbackToken()],
        guideLabel: '그 외에는',
        laneTag: 'right-black',
        matchLabel: `앞 IF가 아니어서 ELSE로 ${lineLabel(2)}`,
        missLabel: '기본 레일',
      },
    ],
    queue: [
      missionCard('heart', '4'),
      missionCard('spade', '8'),
      missionCard('diamond', '2'),
      missionCard('club', '9'),
      missionCard('heart', '6'),
      missionCard('spade', '4'),
    ],
    speedProfile: defaultSpeedProfile,
  },
  {
    id: 'line-2',
    index: 2,
    title: 'AND 기본',
    goal: 'AND는 두 조건이 모두 참이어야 실행된다는 점을 익히세요.',
    lanes: [
      lane('power', lineLabel(1), 'back', 'gold', 'AND 조건이 참일 때 이동하는 1번 컨베이어'),
      lane('regular', lineLabel(2), 'front', 'ink', 'AND 조건이 거짓일 때 이동하는 2번 컨베이어'),
    ],
    gates: [
      {
        id: 'gate-power',
        signTokens: [
          flowToken('if'),
          colorToken('red'),
          logicToken('and'),
          compareToken('>= 10'),
        ],
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
        matchLabel: `빨강이고 10 이상이라 IF가 실행되어 ${lineLabel(1)}`,
        missLabel: 'AND의 두 조건이 모두 참이 아니라 ELSE 검사',
      },
      {
        id: 'gate-regular',
        signTokens: [fallbackToken()],
        guideLabel: '그 외에는',
        laneTag: 'regular',
        matchLabel: `앞 IF가 아니어서 ELSE로 ${lineLabel(2)}`,
        missLabel: '기본 레일',
      },
    ],
    queue: [
      missionCard('heart', '10'),
      missionCard('club', '3'),
      missionCard('diamond', '10'),
      missionCard('spade', '9'),
      missionCard('heart', '8'),
      missionCard('diamond', '6'),
    ],
    speedProfile: defaultSpeedProfile,
  },
  {
    id: 'line-3',
    index: 3,
    title: 'IF / ELIF / ELSE 순차',
    goal: 'ELIF가 참이어도 위의 IF가 먼저 참이면 IF에서 끝난다는 순차 실행을 익히세요.',
    lanes: [
      lane('heart-lane', lineLabel(1), 'back', 'red', '첫 번째 IF가 참일 때 이동하는 1번 컨베이어'),
      lane('black-lane', lineLabel(2), 'middle', 'ink', 'ELIF가 참일 때 이동하는 2번 컨베이어'),
      lane('other-lane', lineLabel(3), 'front', 'teal', '앞 조건이 모두 거짓일 때 이동하는 3번 컨베이어'),
    ],
    gates: [
      {
        id: 'gate-heart-first',
        signTokens: [flowToken('if'), compareToken('>= 10')],
        guideLabel: '숫자값이 10 이상이면',
        laneTag: 'heart-lane',
        condition: predicate('card.rankValue', '>=', 10),
        matchLabel: `숫자값이 10 이상이라 IF가 먼저 실행되어 ${lineLabel(1)}`,
        missLabel: 'IF 조건이 아니어서 ELIF 검사',
      },
      {
        id: 'gate-black-next',
        signTokens: [flowToken('elif'), colorToken('black')],
        guideLabel: '검은색이면',
        laneTag: 'black-lane',
        condition: predicate('card.color', '==', 'black'),
        matchLabel: `앞 IF는 아니고 검정 카드라서 ELIF로 ${lineLabel(2)}`,
        missLabel: 'ELIF 조건도 아니어서 ELSE로 이동',
      },
      {
        id: 'gate-other-default',
        signTokens: [fallbackToken()],
        guideLabel: '그 외에는',
        laneTag: 'other-lane',
        matchLabel: `앞 IF와 ELIF가 모두 아니어서 ELSE로 ${lineLabel(3)}`,
        missLabel: '기본 레일',
      },
    ],
    queue: [
      missionCard('heart', '7'),
      missionCard('spade', '5'),
      missionCard('diamond', '10'),
      missionCard('club', '6'),
      missionCard('heart', '10'),
      missionCard('diamond', '3'),
      missionCard('spade', '10'),
    ],
    speedProfile: defaultSpeedProfile,
  },
  {
    id: 'line-4',
    index: 4,
    title: 'OR 기본',
    goal: 'OR은 둘 중 하나만 참이어도 실행된다는 점을 익히세요.',
    lanes: [
      lane('vip', lineLabel(1), 'back', 'gold', 'OR 조건이 참일 때 이동하는 1번 컨베이어'),
      lane('garden', lineLabel(2), 'front', 'ink', 'OR 조건이 거짓일 때 이동하는 2번 컨베이어'),
    ],
    gates: [
      {
        id: 'gate-vip',
        signTokens: [
          flowToken('if'),
          compareToken('< 5'),
          logicToken('or'),
          suitToken('spade'),
        ],
        guideLabel: '숫자값이 5 미만이거나 스페이드이면',
        laneTag: 'vip',
        condition: {
          kind: 'group',
          operator: 'or',
          children: [
            predicate('card.rankValue', '<', 5),
            predicate('card.suit', '==', 'spade'),
          ],
        },
        matchLabel: `숫자값이 5 미만이거나 스페이드라 IF로 ${lineLabel(1)}`,
        missLabel: 'OR 조건이 아니어서 ELSE 검사',
      },
      {
        id: 'gate-garden',
        signTokens: [fallbackToken()],
        guideLabel: '그 외에는',
        laneTag: 'garden',
        matchLabel: `앞 IF가 아니어서 ELSE로 ${lineLabel(2)}`,
        missLabel: '기본 레일',
      },
    ],
    queue: [
      missionCard('heart', '10'),
      missionCard('club', '3'),
      missionCard('spade', '7'),
      missionCard('diamond', '8'),
      missionCard('heart', '4'),
      missionCard('spade', '9'),
      missionCard('diamond', '10'),
    ],
    speedProfile: defaultSpeedProfile,
  },
  {
    id: 'line-5',
    index: 5,
    title: 'NOT + ELIF',
    goal: 'NOT과 ELIF를 함께 쓰면서 위의 IF가 먼저 참이면 ELIF를 건너뛰는 흐름을 익히세요.',
    lanes: [
      lane('power', lineLabel(1), 'back', 'gold', '첫 IF가 참일 때 이동하는 1번 컨베이어'),
      lane('special', lineLabel(2), 'middle', 'red', 'ELIF가 참일 때 이동하는 2번 컨베이어'),
      lane('middle', lineLabel(3), 'front', 'teal', '앞 조건이 모두 거짓일 때 이동하는 3번 컨베이어'),
    ],
    gates: [
      {
        id: 'gate-power-high',
        signTokens: [flowToken('if'), suitToken('heart')],
        guideLabel: '하트이면',
        laneTag: 'power',
        condition: predicate('card.suit', '==', 'heart'),
        matchLabel: `하트라서 IF가 먼저 실행되어 ${lineLabel(1)}`,
        missLabel: 'IF 조건이 아니어서 ELIF 검사',
      },
      {
        id: 'gate-special-or',
        signTokens: [flowToken('elif'), logicToken('not'), colorToken('black')],
        guideLabel: '검은색이 아니면',
        laneTag: 'special',
        condition: {
          kind: 'not',
          child: predicate('card.color', '==', 'black'),
        },
        matchLabel: `앞 IF는 아니고 검정이 아니라서 ELIF로 ${lineLabel(2)}`,
        missLabel: 'ELIF 조건도 아니어서 ELSE로 이동',
      },
      {
        id: 'gate-middle',
        signTokens: [fallbackToken()],
        guideLabel: '그 외에는',
        laneTag: 'middle',
        matchLabel: `앞 IF와 ELIF가 모두 아니어서 ELSE로 ${lineLabel(3)}`,
        missLabel: '기본 레일',
      },
    ],
    queue: [
      missionCard('heart', '8'),
      missionCard('club', '3'),
      missionCard('spade', '7'),
      missionCard('diamond', '8'),
      missionCard('heart', '4'),
      missionCard('spade', '9'),
      missionCard('diamond', '10'),
    ],
    speedProfile: defaultSpeedProfile,
  },
];
