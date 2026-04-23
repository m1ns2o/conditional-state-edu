<script setup lang="ts">
import type { GateRule } from '../types/domain';

withDefaults(
  defineProps<{
    gate: GateRule;
    index: number;
    active?: boolean;
    state?: 'matched' | 'missed' | null;
  }>(),
  {
    active: false,
    state: null,
  },
);

function tokenClass(kind: GateRule['signTokens'][number]['kind']) {
  return `rule-signboard__token--${kind}`;
}
</script>

<template>
  <article
    class="rule-signboard"
    :class="[
      { 'rule-signboard--active': active },
      state ? `rule-signboard--${state}` : '',
    ]"
    :data-testid="`gate-${gate.id}`"
  >
    <div class="rule-signboard__header">
      <span class="rule-signboard__index">Sensor {{ index + 1 }}</span>
      <span class="rule-signboard__led" />
    </div>

    <div class="rule-signboard__tokens">
      <span
        v-for="(token, tokenIndex) in gate.signTokens"
        :key="`${gate.id}-${tokenIndex}-${token.label}`"
        class="rule-signboard__token"
        :class="[
          tokenClass(token.kind),
          token.tone ? `rule-signboard__token--tone-${token.tone}` : '',
        ]"
      >
        <span v-if="token.icon" class="rule-signboard__icon">{{ token.icon }}</span>
        <span>{{ token.label }}</span>
      </span>
    </div>
  </article>
</template>

<style scoped>
.rule-signboard {
  position: relative;
  display: grid;
  gap: 0.8rem;
  padding: 1rem 1.05rem 1.05rem 1.15rem;
  border-radius: 1.3rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.02), transparent 72%),
    linear-gradient(160deg, rgba(19, 31, 49, 0.96), rgba(9, 15, 25, 0.96));
  border: 1px solid rgba(151, 181, 219, 0.12);
  box-shadow:
    0 14px 32px rgba(0, 0, 0, 0.22),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    box-shadow 180ms ease,
    opacity 180ms ease;
}

.rule-signboard::before {
  content: '';
  position: absolute;
  left: 0.95rem;
  top: 0.95rem;
  bottom: 0.95rem;
  width: 3px;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(93, 165, 255, 0.86), rgba(89, 237, 255, 0.2));
  opacity: 0.56;
}

.rule-signboard--active {
  transform: translateY(-3px);
  border-color: rgba(93, 165, 255, 0.38);
  box-shadow:
    0 0 0 1px rgba(93, 165, 255, 0.12),
    0 18px 40px rgba(6, 21, 47, 0.32);
}

.rule-signboard--matched {
  border-color: rgba(120, 224, 143, 0.28);
  box-shadow:
    0 0 0 1px rgba(120, 224, 143, 0.1),
    0 18px 40px rgba(8, 37, 20, 0.22);
}

.rule-signboard--missed {
  opacity: 0.72;
}

.rule-signboard__header {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  align-items: center;
  padding-left: 0.65rem;
}

.rule-signboard__index {
  font-size: 0.74rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: var(--muted);
}

.rule-signboard__led {
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.22);
  box-shadow: 0 0 14px rgba(255, 255, 255, 0.12);
}

.rule-signboard--active .rule-signboard__led {
  background: var(--signal-cyan);
  box-shadow: 0 0 16px rgba(89, 237, 255, 0.72);
}

.rule-signboard--matched .rule-signboard__led {
  background: var(--signal-green);
  box-shadow: 0 0 16px rgba(120, 224, 143, 0.72);
}

.rule-signboard__tokens {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  padding-left: 0.65rem;
}

.rule-signboard__token {
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  padding: 0.5rem 0.68rem;
  border-radius: 999px;
  border: 1px solid rgba(151, 181, 219, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: var(--ink);
  font-size: 0.84rem;
}

.rule-signboard__token--tone-red {
  background: rgba(255, 107, 102, 0.14);
  border-color: rgba(255, 107, 102, 0.18);
}

.rule-signboard__token--tone-black,
.rule-signboard__token--tone-ink {
  background: rgba(201, 216, 234, 0.08);
}

.rule-signboard__token--tone-gold {
  background: rgba(255, 202, 95, 0.14);
  border-color: rgba(255, 202, 95, 0.2);
}

.rule-signboard__token--tone-teal {
  background: rgba(89, 237, 255, 0.14);
  border-color: rgba(89, 237, 255, 0.18);
}

.rule-signboard__token--tone-neutral {
  background: rgba(255, 255, 255, 0.05);
}

.rule-signboard__icon {
  line-height: 1;
}
</style>
