<template>
  <a
    href="https://www.gate.io/de/trade/REEF_USDT"
    target="_blank"
    class="reef-price"
    :class="`reef-price--${trendType}`"
  >
    <div class="reef-price__price">${{ USDConversion }}</div>
    <div class="reef-price__trend">({{ USD24hChange }}%)</div>
  </a>
</template>
<script>
export default {
  computed: {
    USDConversion() {
      return this.$store.getters['price/usd']()
    },
    USD24hChange() {
      return this.$store.getters['price/usd24hChange']()
    },
    trendType() {
      return this.$store.getters['price/trendType']()
    },
  },
}
</script>

<style lang="scss">
.reef-price {
  display: flex;
  flex-flow: row nowrap;
  justify-content: flex-start;
  align-items: flex-end;
  background: #eaedf3;
  border-radius: 99px;
  padding: 7px 11px 8px 11px;
  transition: none !important;

  .reef-price__label {
    font-size: 13px;
    line-height: 1;
    font-weight: 500;
    color: rgba(white, 0.9);
  }

  .reef-price__price {
    font-size: 14px;
    line-height: 14px;
    font-weight: 500;
    color: white;
    margin-left: 5px;
  }

  .reef-price__trend {
    font-size: 12px;
    line-height: 13px;
    font-weight: 500;
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;
    align-items: center;
    color: white;
    margin-left: 7px;
  }

  $good: #1dc584;
  $bad: #ea3943;

  &--up {
    background: $good;
  }

  &--down {
    background: $bad;
  }

  &:hover {
    text-decoration: none;
    background: linear-gradient(130deg, #b01f6c, #3c127b);
  }
}
</style>
