import type {
  ComparisonOperator,
  ConditionNode,
  ConveyorMission,
  ConveyorRunResult,
  EvaluationContext,
  EvaluationReason,
  GateRule,
  Primitive,
} from '../types/domain';

function readPath(source: unknown, path: string): Primitive | undefined {
  return path.split('.').reduce<unknown>((current, segment) => {
    if (current && typeof current === 'object' && segment in current) {
      return (current as Record<string, unknown>)[segment];
    }
    return undefined;
  }, source) as Primitive | undefined;
}

export function getContextValue(
  context: EvaluationContext,
  field: string,
): Primitive | undefined {
  if (field.startsWith('card.')) {
    return readPath(context.card, field.replace('card.', ''));
  }

  return readPath(context, field);
}

function compareValues(
  actual: Primitive | undefined,
  expected: Primitive,
  op: ComparisonOperator,
): boolean {
  switch (op) {
    case '==':
      return actual === expected;
    case '!=':
      return actual !== expected;
    case '>':
      return Number(actual) > Number(expected);
    case '<':
      return Number(actual) < Number(expected);
    case '>=':
      return Number(actual) >= Number(expected);
    case '<=':
      return Number(actual) <= Number(expected);
    default:
      return false;
  }
}

export function evaluateCondition(
  condition: ConditionNode,
  context: EvaluationContext,
): EvaluationReason {
  if (condition.kind === 'predicate') {
    const actual = getContextValue(context, condition.field);
    return {
      passed: compareValues(actual, condition.value, condition.op),
      reason: `${condition.field} ${condition.op} ${condition.value}`,
    };
  }

  if (condition.kind === 'not') {
    const child = evaluateCondition(condition.child, context);
    return {
      passed: !child.passed,
      reason: `not (${child.reason})`,
    };
  }

  const children = condition.children.map((child) =>
    evaluateCondition(child, context),
  );

  if (condition.operator === 'and') {
    return {
      passed: children.every((child) => child.passed),
      reason: children.map((child) => child.reason).join(' and '),
    };
  }

  return {
    passed: children.some((child) => child.passed),
    reason: children.map((child) => child.reason).join(' or '),
  };
}

function resolveGate(
  gate: GateRule,
  context: EvaluationContext,
): { matched: boolean; reasonLabel: string } {
  if (!gate.condition) {
    return {
      matched: true,
      reasonLabel: gate.matchLabel,
    };
  }

  const result = evaluateCondition(gate.condition, context);
  return {
    matched: result.passed,
    reasonLabel: result.passed ? gate.matchLabel : gate.missLabel,
  };
}

export function evaluateConveyorPath(
  mission: ConveyorMission,
  card: ConveyorRunResult['card'],
): Omit<ConveyorRunResult, 'predictionLaneTag' | 'isPredictionCorrect'> {
  const context: EvaluationContext = {
    card,
  };

  const visitedGates: ConveyorRunResult['visitedGates'] = [];

  for (const gate of mission.gates) {
    const result = resolveGate(gate, context);
    visitedGates.push({
      gateId: gate.id,
      matched: result.matched,
      reasonLabel: result.reasonLabel,
      laneTag: gate.laneTag,
    });

    if (result.matched) {
      return {
        card,
        visitedGates,
        matchedGateId: gate.condition ? gate.id : undefined,
        finalLaneTag: gate.laneTag,
        reasonLabel: result.reasonLabel,
      };
    }
  }

  const fallbackGate = mission.gates[mission.gates.length - 1];
  return {
    card,
    visitedGates,
    matchedGateId: fallbackGate?.condition ? fallbackGate.id : undefined,
    finalLaneTag: fallbackGate?.laneTag ?? mission.lanes[0].tag,
    reasonLabel:
      fallbackGate?.matchLabel ?? '기본 레일로 이동합니다.',
  };
}

export function findLaneLabel(
  mission: ConveyorMission,
  laneTag: string,
): string {
  return mission.lanes.find((lane) => lane.tag === laneTag)?.label ?? laneTag;
}
