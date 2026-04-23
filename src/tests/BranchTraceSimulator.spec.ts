import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import FactoryWorkspace from '../components/FactoryWorkspace.vue';
import { conveyorMissions } from '../data/modules';
import { evaluateConveyorPath } from '../utils/conditions';

describe('FactoryWorkspace', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('highlights gates in sequence and emits when the conveyor finishes', async () => {
    const mission = conveyorMissions[2];
    const runResult = {
      ...evaluateConveyorPath(mission, mission.queue[1]),
      predictionLaneTag: 'other-lane',
      isPredictionCorrect: false,
    };

    const wrapper = mount(FactoryWorkspace, {
      props: {
        mission,
        currentCard: mission.queue[1],
        runResult,
        runState: 'running',
        runNonce: 1,
      },
    });

    expect(wrapper.get('[data-testid="gate-gate-heart-first"]').classes()).not.toContain(
      'rule-signboard--active',
    );

    vi.advanceTimersByTime(mission.speedProfile.approachMs + 10);
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-testid="gate-gate-heart-first"]').classes()).toContain(
      'rule-signboard--active',
    );

    vi.advanceTimersByTime(mission.speedProfile.gateMs + 10);
    await wrapper.vm.$nextTick();
    expect(wrapper.get('[data-testid="gate-gate-heart-first"]').classes()).toContain(
      'rule-signboard--missed',
    );
    expect(wrapper.get('[data-testid="gate-gate-black-next"]').classes()).toContain(
      'rule-signboard--active',
    );

    vi.advanceTimersByTime(mission.speedProfile.gateMs + mission.speedProfile.divertMs + 20);
    await wrapper.vm.$nextTick();

    expect(wrapper.get('[data-testid="lane-black-lane"]').classes()).toContain(
      'factory-workspace__lane--active',
    );
    expect(wrapper.emitted('animation-finished')).toHaveLength(1);
  });
});
