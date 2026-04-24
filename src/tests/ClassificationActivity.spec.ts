import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App.vue';
import { conveyorMissions } from '../data/modules';
import { HINT_PENALTY } from '../stores/learning';
import { evaluateConveyorPath } from '../utils/conditions';

describe('App conveyor flow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps Korean explanations hidden until a hint is opened and deducts points for it', async () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia()],
      },
    });

    const mission = conveyorMissions[0];
    const firstGate = mission.gates.find((gate) => gate.guideLabel);

    await wrapper.get('button[aria-label="분류 시작"]').trigger('click');
    expect(wrapper.get('[data-testid="workspace-tutorial"]').text()).toContain(
      '이 벨트를 눌러 볼까요?',
    );

    expect(firstGate).toBeTruthy();
    expect(wrapper.text()).toContain('힌트 보기');
    expect(wrapper.text()).not.toContain(firstGate?.guideLabel ?? '');
    expect(wrapper.text()).toContain('0점');

    await wrapper.get(`[data-testid="hint-${firstGate!.id}"]`).trigger('click');
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain(firstGate!.guideLabel ?? '');
    expect(wrapper.text()).toContain(`-${HINT_PENALTY}점`);
    expect(wrapper.get(`[data-testid="hint-${firstGate!.id}"]`).text()).toContain('힌트 확인함');
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
        vi.advanceTimersByTime(2020);
        await wrapper.vm.$nextTick();
        continue;
      }

      expect(wrapper.text()).toContain('모든 카드가 제자리를 잘 찾았어요');
      expect(wrapper.get('[data-testid="ending-score"]').text()).toContain('최종 점수');
      expect(wrapper.get('[data-testid="ending-score"]').text()).toContain(`${(index + 1) * 10}점`);
      expect(wrapper.text()).toContain(
        `${conveyorMissions.length}개의 문제를 차근차근 끝까지 해냈어요.`,
      );
    }
  });
});
