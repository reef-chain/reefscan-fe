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
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'

export default {
  components: {
    Loading,
  },
  mixins: [commonMixin],
  data: () => {
    return {
      loading: true,
      blocks: [],
    }
  },
  apollo: {
    $subscribe: {
      blocks: {
        query: gql`
          {
            blocksConnection(orderBy: timestamp_DESC, first: 10) {
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
        result({ data }) {
          this.blocks = data.blocksConnection.edges.map((item) => {
            this.loading = false
            return {
              ...item.node,
              id: item.node.height,
            }
          })
          this.loading = false
        },
      },
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
