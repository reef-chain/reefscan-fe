<template>
  <div>
    <section>
      <b-container class="block-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <NotFound v-else-if="!parsedBlock" text="Block not found" />
        <template v-else>
          <Block
            :parsed-block="parsedBlock"
            :parsed-extrinsics="parsedExtrinsics"
            :parsed-events="parsedEvents"
          />
        </template>
      </b-container>
    </section>
  </div>
</template>
<script>
import Loading from '@/components/Loading.vue'
import Block from '@/components/Block.vue'
import BlockTimeout from '@/utils/polling.js'
import axiosInstance from '~/utils/axios'

export default {
  components: {
    Loading,
    Block,
  },
  data() {
    return {
      loading: true,
      blockNumber: this.$route.query.blockNumber,
      parsedBlock: undefined,
      parsedExtrinsics: [],
      parsedEvents: [],
      callbackId: null,
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
  watch: {
    $route() {
      this.blockNumber = this.$route.query.blockNumber
      this.updateData()
    },
  },
  created() {
    this.updateData()
    BlockTimeout.addCallback(this.updateData)
  },
  destroyed() {
    BlockTimeout.removeCallback(this.updateData)
  },
  methods: {
    async updateData() {
      try {
        const [blocksResponse, eventsResponse, extrinsicsResponse] =
          await Promise.all([
            axiosInstance.post('', {
              query: `
                query blocks($id: Int!) {
                  blocks(where: { height_eq: $id }, limit: 1) {
                    finalized
                    hash
                    height
                    id
                    extrinsicRoot
                    parentHash
                    stateRoot
                    timestamp
                    author
                  }
                }
              `,
              variables: {
                id: Number(this.$route.query.blockNumber),
              },
            }),
            axiosInstance.post('', {
              query: `
                query event($block_height: Int!) {
                  events(where: { block: { height_eq: $block_height } }, limit: 50) {
                    data
                    block {
                      height
                    }
                    index
                    method
                    section
                    phase
                  }
                }
              `,
              variables: {
                block_height: Number(this.$route.query.blockNumber),
              },
            }),
            axiosInstance.post('', {
              query: `
                query extrinsic($block_height: Int!) {
                  extrinsics(
                    where: { block: { height_eq: $block_height } }
                    limit: 50
                  ) {
                    id
                    block {
                      height
                    }
                    index
                    signer
                    section
                    method
                    args
                    hash
                    docs
                    type
                    status
                  }
                }
              `,
              variables: {
                block_height: Number(this.$route.query.blockNumber),
              },
            }),
          ])

        this.parsedBlock = blocksResponse.data.data.blocks[0]

        const events = eventsResponse.data.data.events || []
        this.parsedEvents = events.map((event) => {
          event.block_id = event.block.height
          return event
        })

        const extrinsics = extrinsicsResponse.data.data.extrinsics || []
        this.parsedExtrinsics = extrinsics.map((extrinsic) => {
          extrinsic.block_id = extrinsic.block.height
          extrinsic.success = extrinsic.status === 'success'
          return extrinsic
        })

        this.loading = false
      } catch (error) {}
    },
  },
}
</script>
