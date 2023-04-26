<template>
  <div class="extrinsic-events">
    <Headline small>Triggered Events</Headline>
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <Table v-else>
      <THead>
        <Cell>Event</Cell>
        <Cell>Section &amp; Method</Cell>
        <Cell>Data</Cell>
      </THead>

      <Row v-for="(item, index) in events" :key="index">
        <Cell
          :link="`/event/${item.extrinsic.block_id}/${item.extrinsic.index}/${item.index}`"
        >
          # {{ formatNumber(item.extrinsic.block_id) }}-{{
            formatNumber(item.extrinsic.index)
          }}-{{ item.index }}
        </Cell>
        <Cell>{{ item.section }} ➡ {{ item.method }}</Cell>
        <Cell>{{ item.data }}</Cell>
      </Row>
    </Table>
  </div>
</template>

<script>
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import BlockTimeout from '@/utils/polling.js'

export default {
  mixins: [commonMixin],
  props: {
    extrinsicId: {
      type: Number,
      default: () => 0,
    },
    extrinsicIndex: {
      type: Number,
      default: () => 0,
    },
    extrinsicBlockHeight: {
      type: Number,
      default: () => 0,
    },
  },
  data: () => {
    return {
      events: [],
      loading: true,
      callbackId: null,
      previousPage: null,
    }
  },
  created() {
    this.updateData()
    BlockTimeout.addCallback(this.updateData)
  },
  destroyed() {
    BlockTimeout.removeCallback(this.updateData)
  },
  methods: {
    updateData() {
      this.$apollo.queries.events.refetch()
    },
  },
  apollo: {
    events: {
      query: gql`
        query events($extrinsic_index: Int!, $block_height: Int!) {
          events: eventsConnection(
            orderBy: index_ASC
            where: {
              extrinsic: {
                index_eq: $extrinsic_index
                block: { height_eq: $block_height }
              }
            }
            first: 50
          ) {
            edges {
              node {
                extrinsic {
                  id
                  index
                  block {
                    height
                  }
                }
                index
                data
                method
                section
              }
            }
          }
        }
      `,
      variables() {
        return {
          // extrinsic_id: this.extrinsicId.toString (),
          block_height: this.extrinsicBlockHeight,
          extrinsic_index: this.extrinsicIndex,
        }
      },
      fetchPolicy: 'network-only',
      result({ data }) {
        const dataArr = []
        if (data.events.edges) {
          for (let idx = 0; idx < data.events.edges.length; idx++) {
            dataArr.push(data.events.edges[idx].node)
          }
          data.events = dataArr
          this.events = dataArr
        }
        data.events = data.events.map((item) => {
          item.extrinsic.block_id = item.extrinsic.block.height
          return item
        })
        this.events = data.events
        this.loading = false
      },
    },
  },
}
</script>

<style lang="scss">
.extrinsic-events {
  margin-top: 30px;
}
</style>
