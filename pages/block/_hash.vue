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
import { gql } from 'graphql-tag'
import Loading from '@/components/Loading.vue'
import Block from '@/components/Block.vue'

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
  apollo: {
    $subscribe: {
      block: {
        query: gql`
          subscription blocks($block_hash: String!) {
            blocks(where: { hash_eq: $block_hash }) {
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
        `,
        variables() {
          return {
            block_hash: this.blockHash,
          }
        },
        result({ data }) {
          if (data.blocks[0]) {
            this.blockNumber = Number(data.blocks[0].height)
            this.parsedBlock = data.blocks[0]
          }
          this.loading = false
        },
      },
      event: {
        query: gql`
          subscription event($block_height: Int!) {
            events(where: { block: { height_eq: $block_height } }) {
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
        skip() {
          return !this.blockNumber
        },
        variables() {
          return {
            block_height: this.blockNumber,
          }
        },
        result({ data }) {
          data.events = data.events.map((event) => {
            event.block_id = event.block.height
            return event
          })
          this.parsedEvents = data.events
        },
      },
      extrinsic: {
        query: gql`
          subscription extrinsic($block_height: Int!) {
            extrinsics(where: { block: { height_eq: $block_height } }) {
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
        skip() {
          return !this.blockNumber
        },
        variables() {
          return {
            block_height: this.blockNumber,
          }
        },
        result({ data }) {
          data.extrinsics = data.extrinsics.map((extrinsic) => {
            extrinsic.block_id = extrinsic.block.height
            extrinsic.success = extrinsic.status === 'success'
            return extrinsic
          })
          this.parsedExtrinsics = data.extrinsics
        },
      },
    },
  },
}
</script>
