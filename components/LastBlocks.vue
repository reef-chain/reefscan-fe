<template>
  <div class="last-blocks">
    <div class="headline">
      <nuxt-link
        v-b-tooltip.hover
        :to="`/blocks`"
        title="Click to see last blocks"
      >
        Last Blocks
      </nuxt-link>
    </div>
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <Table v-else>
      <THead>
        <Cell>Block</Cell>
        <Cell>Hash</Cell>
        <Cell>Status</Cell>
        <!--        <Cell align="center">Extrinsics</Cell>
        <Cell align="center">Events</Cell>-->
      </THead>
      <Row v-for="(item, index) in blocks" :key="'item-' + index">
        <Cell :link="`/block?blockNumber=${item.id}`"
          ># {{ formatNumber(item.id) }}</Cell
        >

        <Cell>{{ shortHash(item.hash) }}</Cell>

        <Cell>
          <font-awesome-icon
            :icon="item.finalized ? 'check' : 'spinner'"
            :class="
              item.finalized ? 'text-success' : 'last-blocks__processing-icon'
            "
            style="margin-right: 5px"
          />
          <span>{{ item.finalized ? 'Finalized' : 'Processing' }}</span>
        </Cell>

        <!--        <Cell align="center">{{ item.total_extrinsics }}</Cell>

        <Cell align="center">{{ item.total_events }}</Cell>-->
      </Row>
    </Table>
  </div>
</template>

<script>
import { Provider } from '@reef-defi/evm-provider'
import { WsProvider } from '@polkadot/api'
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'
import BlockTimeout from '@/utils/polling.js'
import { network } from '~/frontend.config'
import { EventBus } from '~/utils/eventBus'
import axiosInstance from '~/utils/axios'

export default {
  components: {
    Loading,
  },
  mixins: [commonMixin],
  data: () => {
    return {
      loading: true,
      blocks: [],
      callbackId: null,
      provider: null,
      lastBlockOnChain: null,
    }
  },
  async created() {
    this.updateData()
    BlockTimeout.addCallback(this.updateData)
    const provider = new Provider({
      provider: new WsProvider(network.nodeWs),
    })
    await provider.api.isReady
    this.provider = provider
    try {
      provider.api.rpc.chain.subscribeNewHeads((header) => {
        this.lastBlockOnChain = `${header.number}`
      })
    } catch (error) {}
  },
  destroyed() {
    BlockTimeout.removeCallback(this.updateData)
  },
  methods: {
    async updateData() {
      try {
        const response = await axiosInstance.post('', {
          query: `
            query blocks {
              blocks: blocksConnection(orderBy: height_DESC, where: {}, first: 10) {
                edges {
                  node {
                    height
                    finalized
                    hash
                  }
                }
              }
            }
          `,
        })
        const data = response.data.data
        const dataArr = []
        if (data.blocks.edges) {
          for (let idx = 0; idx < data.blocks.edges.length; idx++) {
            dataArr.push(data.blocks.edges[idx].node)
          }
          data.blocks = dataArr
          this.blocks = dataArr
          EventBus.$emit(
            'maintaining-indexer',
            this.lastBlockOnChain - this.blocks[0].height > 4
          )
        }
        this.blocks = data.blocks.map((item) => {
          this.loading = false
          return {
            ...item,
            id: item.height,
          }
        })
        this.loading = false
      } catch (error) {
        this.setPerPage(20)
        this.$bvToast.toast(`Exceeds the size limit`, {
          title: 'Encountered an Error',
          variant: 'danger',
          autoHideDelay: 5000,
          appendToast: false,
        })
      }
    },
    setPerPage(value) {
      this.perPage = value
    },
  },
}
</script>

<style lang="scss">
.last-blocks {
  .last-blocks__processing-icon {
    opacity: 0.75;
    animation: spin 1.5s linear infinite;

    @keyframes spin {
      from {
        transform: none;
      }
      to {
        transform: rotate(360deg);
      }
    }
  }
}
</style>
