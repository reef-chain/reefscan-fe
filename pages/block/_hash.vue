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
      blockHash: this.$route.params.hash,
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
      this.blockHash = this.$route.params.hash
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
      const BLOCKS_QUERY = `
        query blocks($block_hash: String!) {
          blocks(where: { hash_eq: $block_hash }, limit: 1) {
            author
            finalized
            id
            hash
            height
            parentHash
            stateRoot
            extrinsicRoot
            timestamp
          }
        }
      `
      const BLOCKS_VARIABLES = {
        block_hash: this.blockHash,
      }

      const EVENTS_QUERY = `
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
      `
      const EXTRINSICS_QUERY = `
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
      `
      try {
        const blocksResponse = await axiosInstance.post('', {
          query: BLOCKS_QUERY,
          variables: BLOCKS_VARIABLES,
        })
        const blocksData = blocksResponse.data.data
        if (blocksData.blocks[0]) {
          this.blockNumber = Number(blocksData.blocks[0].height)
          this.parsedBlock = blocksData.blocks[0]
        }
      } catch (error) {}
      try {
        if (this.blockNumber) {
          const EXTRINSICS_VARIABLES = {
            block_height: this.blockNumber,
          }
          const EVENTS_VARIABLES = {
            block_height: this.blockNumber,
          }
          const [eventsResponse, extrinsicsResponse] = await Promise.all([
            axiosInstance.post('', {
              query: EVENTS_QUERY,
              variables: EVENTS_VARIABLES,
            }),
            axiosInstance.post('', {
              query: EXTRINSICS_QUERY,
              variables: EXTRINSICS_VARIABLES,
            }),
          ])
          const eventsData = eventsResponse.data.data
          eventsData.events = eventsData.events.map((event) => {
            event.block_id = event.block.height
            return event
          })
          this.parsedEvents = eventsData.events

          const extrinsicsData = extrinsicsResponse.data.data
          extrinsicsData.extrinsics = extrinsicsData.extrinsics.map(
            (extrinsic) => {
              extrinsic.block_id = extrinsic.block.height
              extrinsic.success = extrinsic.status === 'success'
              return extrinsic
            }
          )
          this.parsedExtrinsics = extrinsicsData.extrinsics
          this.loading = false
        }
      } catch (error) {}
    },
  },
}
</script>
