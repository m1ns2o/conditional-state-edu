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
  font-family:
    "Baskerville",
    "Times New Roman",
    "Apple SD Gothic Neo",
    serif;
  font-variant-numeric: lining-nums;
  background:
    linear-gradient(180deg, #fffefb 0%, #ffffff 48%, #fbfdff 100%);
  border: 2px solid rgba(15, 23, 42, 0.16);
  box-shadow:
    0 20px 42px rgba(15, 23, 42, 0.16),
    0 2px 0 rgba(15, 23, 42, 0.08);
}

.playing-card::before {
  content: '';
  position: absolute;
  inset: 10px;
  border-radius: 0.8rem;
  border: 1.5px solid rgba(15, 23, 42, 0.14);
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.94), rgba(255, 255, 255, 0.16) 44%, transparent 68%);
}

.playing-card::after {
  content: '';
  position: absolute;
  inset: 18px;
  border-radius: 0.7rem;
  background:
    radial-gradient(circle at center, rgba(15, 23, 42, 0.03), transparent 58%);
  pointer-events: none;
}

.playing-card--compact {
  width: 138px;
  min-height: 192px;
  padding: 0.78rem;
}

.playing-card__corner,
.playing-card__center {
  position: relative;
  z-index: 2;
}

.playing-card__corner {
  display: grid;
  gap: 0.04rem;
  justify-items: start;
}

.playing-card__corner strong {
  font-size: 1.68rem;
  line-height: 1;
}

.playing-card__corner span {
  font-size: 1.18rem;
  line-height: 1;
}

.playing-card--compact .playing-card__corner strong {
  font-size: 1.3rem;
}

.playing-card--compact .playing-card__corner span {
  font-size: 1rem;
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
  padding: 0.2rem 0;
}

.playing-card__pips {
  width: min(100%, 4.8rem);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.2rem 0;
}

.playing-card__pips--wide {
  width: min(100%, 5.1rem);
}

.playing-card__pips--dense {
  width: min(100%, 5.28rem);
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
  font-size: 2rem;
  line-height: 1;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.24);
}

.playing-card--compact .playing-card__pips {
  width: min(100%, 3.8rem);
}

.playing-card--compact .playing-card__pips--wide {
  width: min(100%, 4rem);
}

.playing-card--compact .playing-card__pips--dense {
  width: min(100%, 4.16rem);
}

.playing-card--compact .playing-card__pip {
  font-size: 1.46rem;
}

.playing-card--red {
  color: #c81e1e;
}

.playing-card--black {
  color: #111827;
}
</style>
