<template>
  <!-- Filter -->
  <div>
    <b-row class="mb-4 search-section">
      <div class="search-section__alert container">
        <!--
        <div v-if="network.name == 'Testnet'" class="search-section__alert-message">
          🚨 Testnet network was reset and indexed data here is out of sync for the moment.
        </div>
        -->
      </div>
      <div class="container">
        <div v-if="label || $slots.label" class="search-section__label-section">
          <label v-if="label" class="search-section__label">{{ label }}</label>
          <div v-if="maintainingIndexer" class="maintainingIndexing">
            <div class="blinkingdot"></div>
            <div class="maintainingIndexingText">Indexing in maintenance</div>
          </div>
          <slot name="label" />
        </div>

        <b-form-input
          id="searchInput"
          :value="value"
          class="search-section__input"
          type="search"
          :placeholder="placeholder"
          @keydown.native="$emit('keydown', $event)"
          @input="$emit('input', $event)"
        />
        <Chain v-if="showStats" />
        <slot name="bottom" />
      </div>

      <bubbles :amount="20" />
    </b-row>
  </div>
</template>

<script>
import Chain from '@/components/Chain.vue'
import bubbles from '@/components/BubblesAnimation.vue'
import { EventBus } from '~/utils/eventBus'
import { network } from '@/frontend.config.js'

export default {
  components: { bubbles, Chain },
  model: {
    prop: 'value',
  },
  props: {
    value: { type: String, default: '' },
    label: { type: String, default: '' },
    infoMsg: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    showStats: { type: Boolean, default: false },
  },
  data() {
    return {
      network,
      maintainingIndexer: false,
    }
  },
  created() {
    EventBus.$on('maintaining-indexer', this.maintainIndexer)
  },
  destroyed() {
    EventBus.$off('maintaining-indexer', this.maintainIndexer)
  },
  methods: {
    maintainIndexer(eventData) {
      this.maintainingIndexer = eventData
    },
  },
}
</script>

<style lang="scss">
.search-section {
  position: relative;
  background: linear-gradient(130deg, #a51863, #3c127b);
  margin: 0 !important;
  display: flex;
  flex-flow: column nowrap;

  .search-section__alert {
    width: 100%;
    display: flex;
    flex-flow: row nowrap;
    justify-content: center;
    align-items: center;
    padding: 40px 0 35px 0;

    .search-section__alert-message {
      text-align: center;
      border-radius: 99px;
      background: lighten(#a51863, 5%);
      padding: 9px 17px;
      color: white;
      font-size: 0.875rem;
      line-height: 1.35;
    }
  }

  .search-section__label-section {
    width: 100%;
    display: flex;
    flex-flow: row nowrap;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;

    .search-section__label {
      font-size: 15px;
      font-weight: 500;
      color: white;
      line-height: 1;
      margin-bottom: 0;
    }
  }

  .search-section__input {
    padding: 25px 21px;
    border: none;
    transition: all 0.2s;
    position: relative;
    z-index: 2;
    margin-bottom: 70px;
    border-radius: 10px;

    &::placeholder {
      color: rgba(black, 0.75);
    }

    &:hover {
      transition: all 0.15s;
      box-shadow: 0 0 0 5px rgba(white, 0.25);
    }

    &:focus {
      transition: all 0.25s;
      background: white;
      box-shadow: 0 0 0 8px rgba(white, 0.25);
      border-radius: 25px;
      color: black;
    }
  }

  @media only screen and (max-width: 576px) {
    padding: 0 5px 5px 5px;

    .search-section__alert {
      padding-left: 15px;
      padding-right: 15px;
    }

    .search-section__label-section {
      flex-flow: column nowrap;
      justify-content: flex-start;
      align-items: flex-start;
    }

    .search-section__input {
      font-size: 14px;
      padding: 25px 20px;
      margin-bottom: 45px;
    }
  }
}

.blinkingdot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: red;
  animation: blink 1s infinite;
  margin: 4px;
}

@keyframes blink {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
.maintainingIndexing {
  display: flex;
  position: relative;
  color: white;
}

.maintainingIndexingText {
  font-size: 12px;
}
</style>
