import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FactoryWorkspace from '../components/FactoryWorkspace.vue';
import { conveyorMissions } from '../data/modules';
import { evaluateConveyorPath } from '../utils/conditions';

function getMission(id: string) {
  const mission = conveyorMissions.find((candidate) => candidate.id === id);

  expect(mission).toBeDefined();
  return mission!;
}

describe('FactoryWorkspace', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('highlights gates in sequence and emits when the conveyor finishes', async () => {
    const mission = getMission('line-4');
    const runResult = {
      ...evaluateConveyorPath(mission, mission.card),
      predictionLaneTag: 'other-lane',
      isPredictionCorrect: false,
    };

    const wrapper = mount(FactoryWorkspace, {
      props: {
        mission,
        currentCard: mission.card,
        runResult,
        runState: 'running',
        runNonce: 1,
      },
    });

    expect(wrapper.get('[data-testid="gate-gate-red"]').classes()).not.toContain(
      'rule-signboard--active',
    );

    vi.advanceTimersByTime(mission.speedProfile.approachMs + 10);
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-testid="gate-gate-red"]').classes()).toContain(
      'rule-signboard--active',
    );

    vi.advanceTimersByTime(mission.speedProfile.gateMs + 10);
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-testid="gate-gate-red"]').classes()).toContain(
      'rule-signboard--missed',
    );
    expect(wrapper.get('[data-testid="gate-gate-spade"]').classes()).toContain(
      'rule-signboard--active',
    );

    vi.advanceTimersByTime(mission.speedProfile.gateMs + mission.speedProfile.divertMs + 20);
    await wrapper.vm.$nextTick();

    expect(wrapper.get('[data-testid="lane-spade-lane"]').classes()).toContain(
      'factory-workspace__lane--active',
    );
    expect(wrapper.emitted('animation-finished')).toHaveLength(1);
  });
});
