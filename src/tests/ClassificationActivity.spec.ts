import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App.vue';
import { conveyorMissions } from '../data/modules';

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

    await wrapper.get('[data-testid="predict-right-black"]').trigger('click');
    await wrapper.get('[data-testid="start-run"]').trigger('click');

    const mission = conveyorMissions[0];
    vi.advanceTimersByTime(
      mission.speedProfile.approachMs +
        mission.speedProfile.gateMs +
        mission.speedProfile.divertMs +
        20,
    );
    await wrapper.vm.$nextTick();

    const text = wrapper.text();
    expect(text).toContain('빨간 카드라서 IF가 실행되어 1번 라인');
    expect(text).toContain('if');
    expect(text).toContain('else');
  });
});
