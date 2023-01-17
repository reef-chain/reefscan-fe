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
    }
  },
  apollo: {
    $subscribe: {
      events: {
        query: gql`
          subscription events($extrinsic_index: Int!, $block_height: Int!) {
            events(
              orderBy: index_ASC
              where: {
                extrinsic: {
                  index_eq: $extrinsic_index
                  block: { height_eq: $block_height }
                }
              }
              limit: 50
            ) {
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
        `,
        variables() {
          return {
            // extrinsic_id: this.extrinsicId.toString (),
            block_height: this.extrinsicBlockHeight,
            extrinsic_index: this.extrinsicIndex,
          }
        },
        result({ data }) {
          data.events = data.events.map((item) => {
            item.extrinsic.block_id = item.extrinsic.block.height
            return item
          })
          this.events = data.events
          this.loading = false
        },
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
