<template>
  <div v-if="lastBlock" class="chain-info">
    <div class="card">
      <div class="card-body">
        <h4 class="mb-3">{{ $t('components.network.last_block') }}</h4>
        <nuxt-link
          v-b-tooltip.hover
          :to="`/block?blockNumber=${lastBlock}`"
          title="Click to see block info!"
        >
          <h6 class="d-inline-block">#{{ formatNumber(lastBlock) }}</h6>
        </nuxt-link>
      </div>
    </div>
    <div class="card">
      <div class="card-body">
        <h4 class="mb-3">
          {{ $t('components.network.last_block_finalized') }}
        </h4>
        <nuxt-link
          v-b-tooltip.hover
          :to="`/block?blockNumber=${lastFinalizedBlock}`"
          title="Click to see block info!"
        >
          <h6 class="d-inline-block">
            #{{ formatNumber(lastFinalizedBlock) }}
          </h6>
        </nuxt-link>
      </div>
    </div>
    <div class="card">
      <div class="card-body">
        <h4 class="mb-3">Total extrinsics</h4>
        <nuxt-link
          v-b-tooltip.hover
          to="/extrinsics"
          title="Click to see extrinsics!"
        >
          <h6 class="d-inline-block">
            {{ formatNumber(totalExtrinsics) }}
          </h6>
        </nuxt-link>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <h4 class="mb-3">Total events</h4>
        <nuxt-link v-b-tooltip.hover to="/events" title="Click to see events!">
          <h6 class="d-inline-block">{{ formatNumber(totalEvents) }}</h6>
        </nuxt-link>
      </div>
    </div>
    <div class="card">
      <div class="card-body">
        <h4 class="mb-3">{{ $t('components.network.accounts') }}</h4>
        <nuxt-link
          v-b-tooltip.hover
          to="/accounts"
          title="Click to see accounts!"
        >
          <h6 class="d-inline-block">
            {{ formatNumber(totalAccounts) }}
          </h6>
        </nuxt-link>
      </div>
    </div>

    <div class="card">
      <div class="card-body">
        <h4 class="mb-3">{{ $t('components.network.transfers') }}</h4>
        <nuxt-link
          v-b-tooltip.hover
          to="/transfers"
          title="Click to see tranfers!"
        >
          <h6 class="d-inline-block">{{ formatNumber(totalTransfers) }}</h6>
        </nuxt-link>
      </div>
    </div>
    <div class="card">
      <div class="card-body">
        <h4 class="mb-3">{{ $t('components.network.contracts') }}</h4>
        <nuxt-link
          v-b-tooltip.hover
          to="/contracts"
          title="Click to see contracts!"
        >
          <h6 class="d-inline-block">
            {{ formatNumber(totalContracts) }}
          </h6>
        </nuxt-link>
      </div>
    </div>
    <div class="card">
      <div class="card-body">
        <h4 class="mb-3">Block time</h4>
        <h6 class="d-inline-block">10s</h6>
      </div>
    </div>
  </div>
</template>

<script>
import { BigNumber } from 'bignumber.js'
import { gql } from 'graphql-tag'
import commonMixin from '../mixins/commonMixin.js'
import { network } from '../frontend.config.js'
import BlockTimeout from '@/utils/polling.js'

export default {
  mixins: [commonMixin],
  data() {
    return {
      network,
      lastBlock: 0,
      lastFinalizedBlock: 0,
      totalExtrinsics: 0,
      totalEvents: 0,
      totalAccounts: 0,
      totalContracts: 0,
      totalIssuance: 0,
      totalTransfers: 0,
      callbackId: null,
    }
  },
  apollo: {
    chainInfo: {
      query: gql`
        query chain_info {
          chainInfo: chainInfos(limit: 10) {
            id
            count
          }
        }
      `,
      fetchPolicy: 'network-only',
      result({ data }) {
        this.totalAccounts = this.findCount(data.chainInfo, 'accounts')
        this.totalContracts = this.findCount(data.chainInfo, 'contracts')
        this.totalEvents = this.findCount(data.chainInfo, 'events')
        this.totalExtrinsics = this.findCount(data.chainInfo, 'extrinsics')
        this.totalTransfers = this.findCount(data.chainInfo, 'transfers')
      },
    },
    finalized: {
      query: gql`
        query blocks {
          finalized: blocksConnection(
            first: 1
            orderBy: height_DESC
            where: { finalized_eq: true }
          ) {
            edges {
              node {
                height
              }
            }
          }
        }
      `,
      fetchPolicy: 'network-only',
      result({ data }) {
        const dataArr = []
        if (data.finalized.edges) {
          for (let idx = 0; idx < data.finalized.edges.length; idx++) {
            dataArr.push(data.finalized.edges[idx].node)
          }
          data.finalized = dataArr
          this.finalized = dataArr
        }
        this.lastFinalizedBlock = data.finalized[0].height
      },
    },
    lastBlock: {
      query: gql`
        query blocks {
          lastBlock: blocksConnection(first: 1, orderBy: height_DESC) {
            edges {
              node {
                height
              }
            }
          }
        }
      `,
      fetchPolicy: 'network-only',
      result({ data }) {
        const dataArr = []
        if (data.lastBlock.edges) {
          for (let idx = 0; idx < data.lastBlock.edges.length; idx++) {
            dataArr.push(data.lastBlock.edges[idx].node)
          }
          data.lastBlock = dataArr
          this.lastBlock = dataArr
        }
        this.lastBlock = data.lastBlock[0].height
      },
    },
  },
  created() {
    // force fetch the latest data
    this.updateData()
    BlockTimeout.addCallback(this.updateData)
  },
  destroyed() {
    BlockTimeout.removeCallback(this.updateData)
  },
  methods: {
    updateData() {
      this.$apollo.queries.chainInfo.refetch()
      this.$apollo.queries.finalized.refetch()
      this.$apollo.queries.lastBlock.refetch()
    },
    formatAmount(amount) {
      return `${new BigNumber(amount)
        .div(new BigNumber(10).pow(network.tokenDecimals))
        .toFixed(0)
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')} ${network.tokenSymbol}`
    },
    findCount(counts, name) {
      return counts.find((count) => count.id === name).count
    },
  },
}
</script>

<style lang="scss">
.chain-info {
  display: flex;
  flex-flow: row nowrap;
  justify-content: space-between;
  align-items: flex-end;
  padding-bottom: 30px;
  position: relative;
  z-index: 2;

  .card {
    border: none;
    box-shadow: none;
    background: transparent;

    .card-body {
      padding: 0;
    }

    h4 {
      font-size: 13px;
      line-height: 15px;
      color: #ff51ca;
      margin-bottom: 5px !important;
      text-shadow: 1px 1px 1px rgba(black, 0.25);
      white-space: nowrap;
      text-overflow: ellipsis;
      max-width: 100%;
      overflow: hidden;
    }

    h6 {
      font-size: 17px;
      line-height: 19px;
      font-weight: 500;
      margin-bottom: 0 !important;
      color: white;
      text-shadow: 1px 1px 1px rgba(black, 0.25);
    }

    a {
      &:hover {
        h6 {
          text-decoration: underline;
        }
      }
    }

    & + .card {
      margin-left: 50px;
    }
  }

  @media only screen and (max-width: 1199.98px) {
    flex-wrap: wrap;
    justify-content: flex-start;
    margin-top: -20px;

    .card {
      width: 25%;
      margin-top: 20px;

      & + .card {
        margin-left: 0;
      }
    }
  }

  @media only screen and (max-width: 768px) {
    .card {
      width: 33.33%;
    }
  }

  @media only screen and (max-width: 576px) {
    .card {
      width: 50%;
    }
  }
}
</style>
