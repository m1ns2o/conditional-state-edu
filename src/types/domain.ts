export type Primitive = string | number | boolean;

export type Suit = 'heart' | 'diamond' | 'spade' | 'club';
export type CardColor = 'red' | 'black';
export type RankLabel =
  | 'A'
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K';

export interface Card {
  id: string;
  suit: Suit;
  color: CardColor;
  rankLabel: RankLabel;
  rankValue: number;
}

export interface MissionCard extends Card {
  displayName: string;
  shortLabel: string;
}

export interface EvaluationContext {
  card: Card;
}

export type ComparisonOperator = '==' | '!=' | '>' | '<' | '>=' | '<=';

export interface PredicateCondition {
  kind: 'predicate';
  field: string;
  op: ComparisonOperator;
  value: Primitive;
}

export interface GroupCondition {
  kind: 'group';
  operator: 'and' | 'or';
  children: ConditionNode[];
}

export interface NotCondition {
  kind: 'not';
  child: ConditionNode;
}

export type ConditionNode = PredicateCondition | GroupCondition | NotCondition;

export interface EvaluationReason {
  passed: boolean;
  reason: string;
}

export type RuleTokenKind =
  | 'color'
  | 'suit'
  | 'rank'
  | 'compare'
  | 'logic'
  | 'word'
  | 'lane'
  | 'fallback';

export interface RuleToken {
  kind: RuleTokenKind;
  label: string;
  icon?: string;
  tone?: 'red' | 'black' | 'gold' | 'teal' | 'ink' | 'neutral';
}

export interface GateRule {
  id: string;
  signTokens: RuleToken[];
  guideLabel?: string;
  laneTag: string;
  condition?: ConditionNode;
  matchLabel: string;
  missLabel: string;
}

export interface OutputLane {
  tag: string;
  label: string;
  position: 'back' | 'middle' | 'front';
  accent: 'red' | 'ink' | 'teal' | 'gold';
  description: string;
}

export interface SpeedProfile {
  approachMs: number;
  gateMs: number;
  divertMs: number;
}

export interface ConveyorMission {
  id: string;
  index: number;
  title: string;
  goal: string;
  gates: GateRule[];
  lanes: OutputLane[];
  queue: MissionCard[];
  speedProfile: SpeedProfile;
}

export interface VisitedGate {
  gateId: string;
  matched: boolean;
  reasonLabel: string;
  laneTag: string;
}

export interface ConveyorRunResult {
  card: Card;
  visitedGates: VisitedGate[];
  matchedGateId?: string;
  finalLaneTag: string;
  reasonLabel: string;
  predictionLaneTag?: string;
  isPredictionCorrect: boolean;
}

export type ConveyorRunState = 'idle' | 'running' | 'resolved';

export interface MissionProgress {
  correct: number;
  total: number;
  completed: boolean;
  currentCardIndex: number;
}
