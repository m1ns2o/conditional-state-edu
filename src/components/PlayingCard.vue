<script setup lang="ts">
import { computed } from 'vue';
import type { Card } from '../types/domain';
import { suitNames, suitSymbols } from '../utils/cards';

const props = defineProps<{
  card: Card;
  compact?: boolean;
}>();

const cardClass = computed(() => ({
  'playing-card': true,
  'playing-card--compact': props.compact,
  'playing-card--red': props.card.color === 'red',
  'playing-card--black': props.card.color === 'black',
}));

const cardLabel = computed(
  () => `${suitNames[props.card.suit]} ${props.card.rankLabel}`,
);

const pipRows = computed(() => {
  const numericRank = Number(props.card.rankLabel);
  const pipPatternMap: Record<number, number[]> = {
    1: [1],
    2: [1, 1],
    3: [1, 1, 1],
    4: [2, 2],
    5: [2, 1, 2],
    6: [2, 2, 2],
    7: [2, 1, 2, 2],
    8: [2, 2, 2, 2],
    9: [2, 2, 1, 2, 2],
    10: [2, 2, 2, 2, 2],
  };

  const pattern = pipPatternMap[numericRank] ?? [1];
  return pattern.map((count) =>
    Array.from({ length: count }, (_, index) => `${props.card.id}-pip-${count}-${index}`),
  );
});

const pipDensityClass = computed(() => {
  const numericRank = Number(props.card.rankLabel);

  if (numericRank >= 9) {
    return 'playing-card__pips--dense';
  }

  if (numericRank >= 7) {
    return 'playing-card__pips--wide';
  }

  return '';
});
</script>

<template>
  <article :class="cardClass" :aria-label="cardLabel">
    <header class="playing-card__corner">
      <strong>{{ card.rankLabel }}</strong>
      <span>{{ suitSymbols[card.suit] }}</span>
    </header>

    <div class="playing-card__center">
      <div class="playing-card__pips" :class="pipDensityClass">
        <div
          v-for="(row, rowIndex) in pipRows"
          :key="`${card.id}-row-${rowIndex}`"
          class="playing-card__pip-row"
          :class="row.length === 1 ? 'playing-card__pip-row--single' : 'playing-card__pip-row--pair'"
        >
          <span
            v-for="pipId in row"
            :key="pipId"
            class="playing-card__pip"
          >
            {{ suitSymbols[card.suit] }}
          </span>
        </div>
      </div>
    </div>

    <footer class="playing-card__corner playing-card__corner--bottom">
      <strong>{{ card.rankLabel }}</strong>
      <span>{{ suitSymbols[card.suit] }}</span>
    </footer>
  </article>
</template>

<style scoped>
.playing-card {
  position: relative;
  width: 184px;
  min-height: 248px;
  padding: 0.95rem;
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 0.35rem;
  overflow: hidden;
  border-radius: 1.2rem;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.98) 52%),
    linear-gradient(180deg, #ffffff, #f8fafc);
  border: 1px solid rgba(203, 213, 225, 0.92);
  box-shadow:
    0 18px 36px rgba(15, 23, 42, 0.16),
    inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.playing-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(135deg, rgba(148, 163, 184, 0.08), transparent 28%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.14), transparent 42%);
}

.playing-card--compact {
  width: 138px;
  min-height: 192px;
  padding: 0.78rem;
}

.playing-card__corner,
.playing-card__center {
  position: relative;
  z-index: 1;
}

.playing-card__corner {
  display: grid;
  gap: 0.04rem;
  justify-items: start;
}

.playing-card__corner strong {
  font-size: 1.6rem;
  line-height: 1;
}

.playing-card__corner span {
  font-size: 1.1rem;
}

.playing-card--compact .playing-card__corner strong {
  font-size: 1.25rem;
}

.playing-card--compact .playing-card__corner span {
  font-size: 0.96rem;
}

.playing-card__corner--bottom {
  align-self: end;
  justify-items: end;
  transform: rotate(180deg);
}

.playing-card__center {
  display: flex;
  align-items: stretch;
  justify-content: center;
}

.playing-card__pips {
  width: min(100%, 5rem);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.15rem 0;
}

.playing-card__pips--wide {
  width: min(100%, 5.35rem);
}

.playing-card__pips--dense {
  width: min(100%, 5.6rem);
}

.playing-card__pip-row {
  display: flex;
  width: 100%;
}

.playing-card__pip-row--single {
  justify-content: center;
}

.playing-card__pip-row--pair {
  justify-content: space-between;
}

.playing-card__pip {
  font-size: 1.95rem;
  line-height: 1;
}

.playing-card--compact .playing-card__pips {
  width: min(100%, 3.95rem);
}

.playing-card--compact .playing-card__pips--wide {
  width: min(100%, 4.2rem);
}

.playing-card--compact .playing-card__pips--dense {
  width: min(100%, 4.45rem);
}

.playing-card--compact .playing-card__pip {
  font-size: 1.52rem;
}

.playing-card--red {
  color: #d44b47;
}

.playing-card--black {
  color: #111927;
}
</style>
