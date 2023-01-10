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
      this.blockNumber = this.$route.query.blockNumber
    },
  },
  apollo: {
    $subscribe: {
      block: {
        query: gql`
          subscription blocks($id: Int!) {
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
        variables() {
          return {
            id: Number(this.$route.query.blockNumber),
          }
        },
        result({ data }) {
          if (data.blocks[0]) {
            this.parsedBlock = data.blocks[0]
          }
          this.loading = false
        },
      },
      event: {
        query: gql`
          subscription event($block_height: Int!) {
            events(where: { block: { height_eq: $block_height } }, limit: 1) {
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
        variables() {
          return {
            block_height: Number(this.$route.query.blockNumber),
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
            extrinsics(
              where: { block: { height_eq: $block_height } }
              limit: 10
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
        variables() {
          return {
            block_height: Number(this.$route.query.blockNumber),
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
