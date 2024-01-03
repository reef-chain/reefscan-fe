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
import { reefState } from '@reef-chain/util-lib'
import { BigNumber } from 'bignumber.js'
import commonMixin from '../mixins/commonMixin.js'
import { network } from '../frontend.config.js'
import axiosInstance from '~/utils/axios'

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
  created() {
    this.updateData()
    reefState.selectedProvider$.subscribe(async (provider) => {
      this.unsubscribe = await provider.api.rpc.chain.subscribeNewHeads(() =>
        this.updateData()
      )
    })
  },
  destroyed() {
    this.unsubscribe()
  },
  methods: {
    async updateData() {
      // chain info query
      const chainInfoResponse = await axiosInstance.post('', {
        query: `
          query chain_info {
            chainInfo: chainInfos(limit: 10) {
              id
              count
            }
          }
        `,
      })
      const chainInfoData = chainInfoResponse.data.data

      this.totalAccounts = this.findCount(chainInfoData.chainInfo, 'accounts')
      this.totalContracts = this.findCount(chainInfoData.chainInfo, 'contracts')
      this.totalEvents = this.findCount(chainInfoData.chainInfo, 'events')
      this.totalExtrinsics = this.findCount(
        chainInfoData.chainInfo,
        'extrinsics'
      )
      this.totalTransfers = this.findCount(chainInfoData.chainInfo, 'transfers')
      // chain finalized
      const finalizedResponse = await axiosInstance.post('', {
        query: `
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
      })
      const finalizedData = finalizedResponse.data.data

      const dataArr = []
      if (finalizedData.finalized.edges) {
        for (let idx = 0; idx < finalizedData.finalized.edges.length; idx++) {
          dataArr.push(finalizedData.finalized.edges[idx].node)
        }
        finalizedData.finalized = dataArr
        this.finalized = dataArr
      }
      this.lastFinalizedBlock = finalizedData.finalized[0].height
      // chain lastBlock
      const lastBlockResponse = await axiosInstance.post('', {
        query: `
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
      })
      const lastBlockData = lastBlockResponse.data.data
      const lastBlockDataArr = []
      if (lastBlockData.lastBlock.edges) {
        for (let idx = 0; idx < lastBlockData.lastBlock.edges.length; idx++) {
          lastBlockDataArr.push(lastBlockData.lastBlock.edges[idx].node)
        }
        lastBlockData.lastBlock = lastBlockDataArr
        this.lastBlock = lastBlockDataArr
      }
      this.lastBlock = lastBlockData.lastBlock[0].height
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
