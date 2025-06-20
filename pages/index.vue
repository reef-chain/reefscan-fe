<template>
  <div>
    <section>
      <Search
        v-model="search"
        label="Reef Blockchain Explorer"
        placeholder="Search by block number, block hash, extrinsic hash or account address"
        show-stats
        @keydown="doSearch"
      />
      <b-container class="main py-5 dashboard">
        <div class="row">
          <div class="col-md-6 mb-4">
            <LastBlocks />
          </div>
          <div class="col-md-6 mb-4">
            <LastExtrinsics />
          </div>
        </div>
        <div class="row">
          <div class="col">
            <LastTransfers />
          </div>
        </div>
        <div class="row" style="margin-top: 50px">
          <div class="col-md-6 mb-4">
            <LastAccounts />
          </div>
          <div class="col-md-6 mb-4">
            <LastEvents />
          </div>
        </div>
      </b-container>
    </section>
  </div>
</template>
<script>
import LastBlocks from '@/components/LastBlocks.vue'
import LastExtrinsics from '@/components/LastExtrinsics.vue'
import LastTransfers from '@/components/LastTransfers.vue'
import LastAccounts from '@/components/LastAccounts'
import LastEvents from '@/components/LastEvents.vue'
import Search from '@/components/Search.vue'
import { network } from '@/frontend.config.js'
import commonMixin from '@/mixins/commonMixin.js'

export default {
  components: {
    LastBlocks,
    LastExtrinsics,
    LastTransfers,
    LastAccounts,
    LastEvents,
    Search,
  },
  mixins: [commonMixin],
  data: () => {
    return {
      network,
      search: '',
    }
  },
  head() {
    return {
      title: 'Explorer | Reef Network',
      meta: [
        {
          hid: 'description',
          name: 'description',
          content: 'Reef Chain is an EVM compatible chain for DeFi',
        },
      ],
    }
  },
  methods: {
    async doSearch(event) {
      if (event.keyCode === 13) {
        if (await this.isExtrinsicHash(this.search)) {
          this.$router.push({
            path: `/extrinsic/${this.search}`,
          })
        } else if (await this.isBlockHash(this.search)) {
          this.$router.push({
            path: `/block/${this.search}`,
          })
        } else if (this.isAddress(this.search)) {
          this.$router.push({
            path: `/account/${this.search}`,
          })
        } else if (this.isBlockNumber(this.search)) {
          this.$router.push({
            path: `/block?blockNumber=${this.search}`,
          })
        } else if (await this.isContractOrEvmAddress(this.search)) {
          this.$router.push({
            path: `/${await this.isContractOrEvmAddress(this.search)}`,
          })
        }
      }
    },
  },
}
</script>
<style>
.svg-inline--fa,
svg:not(:root).svg-inline--fa {
  overflow: visible;
}

.svg-inline--fa {
  display: inline-block;
  font-size: inherit;
  height: 1em;
  vertical-align: -0.125em;
}

.svg-inline--fa.fa-lg {
  vertical-align: -0.225em;
}

.svg-inline--fa.fa-w-1 {
  width: 0.0625em;
}

.svg-inline--fa.fa-w-2 {
  width: 0.125em;
}

.svg-inline--fa.fa-w-3 {
  width: 0.1875em;
}

.svg-inline--fa.fa-w-4 {
  width: 0.25em;
}

.svg-inline--fa.fa-w-5 {
  width: 0.3125em;
}

.svg-inline--fa.fa-w-6 {
  width: 0.375em;
}

.svg-inline--fa.fa-w-7 {
  width: 0.4375em;
}

.svg-inline--fa.fa-w-8 {
  width: 0.5em;
}

.svg-inline--fa.fa-w-9 {
  width: 0.5625em;
}

.svg-inline--fa.fa-w-10 {
  width: 0.625em;
}

.svg-inline--fa.fa-w-11 {
  width: 0.6875em;
}

.svg-inline--fa.fa-w-12 {
  width: 0.75em;
}

.svg-inline--fa.fa-w-13 {
  width: 0.8125em;
}

.svg-inline--fa.fa-w-14 {
  width: 0.875em;
}

.svg-inline--fa.fa-w-15 {
  width: 0.9375em;
}

.svg-inline--fa.fa-w-16 {
  width: 1em;
}

.svg-inline--fa.fa-w-17 {
  width: 1.0625em;
}

.svg-inline--fa.fa-w-18 {
  width: 1.125em;
}

.svg-inline--fa.fa-w-19 {
  width: 1.1875em;
}

.svg-inline--fa.fa-w-20 {
  width: 1.25em;
}

.svg-inline--fa.fa-pull-left {
  margin-right: 0.3em;
  width: auto;
}

.svg-inline--fa.fa-pull-right {
  margin-left: 0.3em;
  width: auto;
}

.svg-inline--fa.fa-border {
  height: 1.5em;
}

.svg-inline--fa.fa-li {
  width: 2em;
}

.svg-inline--fa.fa-fw {
  width: 1.25em;
}

.fa-layers svg.svg-inline--fa {
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
}

.fa-layers {
  display: inline-block;
  height: 1em;
  position: relative;
  text-align: center;
  vertical-align: -0.125em;
  width: 1em;
}

.fa-layers-counter,
.fa-layers-text {
  display: inline-block;
  position: absolute;
  text-align: center;
}

.fa-layers-text {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  transform-origin: center center;
}

.fa-layers-counter {
  background-color: #ff253a;
  border-radius: 1em;
  box-sizing: border-box;
  color: #fff;
  height: 1.5em;
  line-height: 1;
  max-width: 5em;
  min-width: 1.5em;
  overflow: hidden;
  padding: 0.25em;
  right: 0;
  text-overflow: ellipsis;
  top: 0;
  transform: scale(0.25);
  transform-origin: top right;
}

.fa-layers-bottom-right {
  bottom: 0;
  right: 0;
  top: auto;
  transform: scale(0.25);
  transform-origin: bottom right;
}

.fa-layers-bottom-left {
  bottom: 0;
  left: 0;
  right: auto;
  top: auto;
  transform: scale(0.25);
  transform-origin: bottom left;
}

.fa-layers-top-right {
  right: 0;
  top: 0;
  transform: scale(0.25);
  transform-origin: top right;
}

.fa-layers-top-left {
  left: 0;
  right: auto;
  top: 0;
  transform: scale(0.25);
  transform-origin: top left;
}

.fa-lg {
  font-size: 1.33333em;
  line-height: 0.75em;
  vertical-align: -0.0667em;
}

.fa-xs {
  font-size: 0.75em;
}

.fa-sm {
  font-size: 0.875em;
}

.fa-1x {
  font-size: 1em;
}

.fa-2x {
  font-size: 2em;
}

.fa-3x {
  font-size: 3em;
}

.fa-4x {
  font-size: 4em;
}

.fa-5x {
  font-size: 5em;
}

.fa-6x {
  font-size: 6em;
}

.fa-7x {
  font-size: 7em;
}

.fa-8x {
  font-size: 8em;
}

.fa-9x {
  font-size: 9em;
}

.fa-10x {
  font-size: 10em;
}

.fa-fw {
  text-align: center;
  width: 1.25em;
}

.fa-ul {
  list-style-type: none;
  margin-left: 2.5em;
  padding-left: 0;
}

.fa-ul > li {
  position: relative;
}

.fa-li {
  left: -2em;
  position: absolute;
  text-align: center;
  width: 2em;
  line-height: inherit;
}

.fa-border {
  border: 0.08em solid #eee;
  border-radius: 0.1em;
  padding: 0.2em 0.25em 0.15em;
}

.fa-pull-left {
  float: left;
}

.fa-pull-right {
  float: right;
}

.fa.fa-pull-left,
.fab.fa-pull-left,
.fal.fa-pull-left,
.far.fa-pull-left,
.fas.fa-pull-left {
  margin-right: 0.3em;
}

.fa.fa-pull-right,
.fab.fa-pull-right,
.fal.fa-pull-right,
.far.fa-pull-right,
.fas.fa-pull-right {
  margin-left: 0.3em;
}

.fa-spin {
  -webkit-animation: fa-spin 2s linear infinite;
  animation: fa-spin 2s linear infinite;
}

.fa-pulse {
  -webkit-animation: fa-spin 1s steps(8) infinite;
  animation: fa-spin 1s steps(8) infinite;
}

@-webkit-keyframes fa-spin {
  0% {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(1turn);
  }
}

@keyframes fa-spin {
  0% {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(1turn);
  }
}

.fa-rotate-90 {
  -ms-filter: 'progid:DXImageTransform.Microsoft.BasicImage(rotation=1)';
  transform: rotate(90deg);
}

.fa-rotate-180 {
  -ms-filter: 'progid:DXImageTransform.Microsoft.BasicImage(rotation=2)';
  transform: rotate(180deg);
}

.fa-rotate-270 {
  -ms-filter: 'progid:DXImageTransform.Microsoft.BasicImage(rotation=3)';
  transform: rotate(270deg);
}

.fa-flip-horizontal {
  -ms-filter: 'progid:DXImageTransform.Microsoft.BasicImage(rotation=0, mirror=1)';
  transform: scaleX(-1);
}

.fa-flip-vertical {
  transform: scaleY(-1);
}

.fa-flip-both,
.fa-flip-horizontal.fa-flip-vertical,
.fa-flip-vertical {
  -ms-filter: 'progid:DXImageTransform.Microsoft.BasicImage(rotation=2, mirror=1)';
}

.fa-flip-both,
.fa-flip-horizontal.fa-flip-vertical {
  transform: scale(-1);
}

:root .fa-flip-both,
:root .fa-flip-horizontal,
:root .fa-flip-vertical,
:root .fa-rotate-90,
:root .fa-rotate-180,
:root .fa-rotate-270 {
  filter: none;
}

.fa-stack {
  display: inline-block;
  height: 2em;
  position: relative;
  width: 2.5em;
}

.fa-stack-1x,
.fa-stack-2x {
  bottom: 0;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  top: 0;
}

.svg-inline--fa.fa-stack-1x {
  height: 1em;
  width: 1.25em;
}

.svg-inline--fa.fa-stack-2x {
  height: 2em;
  width: 2.5em;
}

.fa-inverse {
  color: #fff;
}

.sr-only {
  border: 0;
  clip: rect(0, 0, 0, 0);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  width: 1px;
}

.sr-only-focusable:active,
.sr-only-focusable:focus {
  clip: auto;
  height: auto;
  margin: 0;
  overflow: visible;
  position: static;
  width: auto;
}

.svg-inline--fa .fa-primary {
  fill: currentColor;
  fill: var(--fa-primary-color, currentColor);
  opacity: 1;
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa .fa-secondary {
  fill: currentColor;
  fill: var(--fa-secondary-color, currentColor);
}

.svg-inline--fa .fa-secondary,
.svg-inline--fa.fa-swap-opacity .fa-primary {
  opacity: 0.4;
  opacity: var(--fa-secondary-opacity, 0.4);
}

.svg-inline--fa.fa-swap-opacity .fa-secondary {
  opacity: 1;
  opacity: var(--fa-primary-opacity, 1);
}

.svg-inline--fa mask .fa-primary,
.svg-inline--fa mask .fa-secondary {
  fill: #000;
}

.fad.fa-inverse {
  color: #fff;
}
</style>
