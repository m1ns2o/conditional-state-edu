import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App.vue';
import { conveyorMissions } from '../data/modules';
import { evaluateConveyorPath } from '../utils/conditions';

describe('App conveyor flow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows only signage-based UI and minimal result feedback after a run', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()],
      },
    });

    const mission = conveyorMissions[0];
    const result = evaluateConveyorPath(mission, mission.card);

    await wrapper.get(`[data-testid="predict-${result.finalLaneTag}"]`).trigger('click');
    await wrapper.get('[data-testid="start-run"]').trigger('click');

    vi.advanceTimersByTime(
      mission.speedProfile.approachMs +
        mission.speedProfile.gateMs * result.visitedGates.length +
        mission.speedProfile.divertMs +
        20,
    );
    await wrapper.vm.$nextTick();

    const text = wrapper.text();
    expect(text).toContain('숫자값이 5 미만이라 IF가 실행되어 1번 라인');
    expect(text).toContain('if');
    expect(text).toContain('< 5');
    expect(text).toContain('else');
  });

  it('progresses through every question and only completes after the final one', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()],
      },
    });

    for (const [index, mission] of conveyorMissions.entries()) {
      const result = evaluateConveyorPath(mission, mission.card);

      await wrapper.get(`[data-testid="predict-${result.finalLaneTag}"]`).trigger('click');
      await wrapper.get('[data-testid="start-run"]').trigger('click');

      vi.advanceTimersByTime(
        mission.speedProfile.approachMs +
          mission.speedProfile.gateMs * result.visitedGates.length +
          mission.speedProfile.divertMs +
          20,
      );
      await wrapper.vm.$nextTick();

      if (index < conveyorMissions.length - 1) {
        expect(wrapper.text()).not.toContain('모든 라인 통과');
        vi.advanceTimersByTime(920);
        await wrapper.vm.$nextTick();
        continue;
      }

      expect(wrapper.text()).toContain('모든 카드가 제자리를 찾았어요');
      expect(wrapper.text()).toContain(
        `${conveyorMissions.length}개의 문제를 끝까지 해결했어요.`,
      );
    }
  });
});
