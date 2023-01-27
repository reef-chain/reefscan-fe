<template>
  <div class="last-events">
    <div class="headline">
      <nuxt-link
        v-b-tooltip.hover
        :to="`/events`"
        title="Click to see last events"
      >
        Last Events
      </nuxt-link>
    </div>
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <Table v-else>
      <THead>
        <Cell>Id</Cell>
        <Cell>Event</Cell>
      </THead>
      <Row v-for="(item, index) in events" :key="'item-' + index">
        <Cell
          :link="`/event/${item.extrinsic.block_id}/${item.extrinsic.index}/${item.index}`"
          ># {{ formatNumber(item.extrinsic.block_id) }}-{{
            formatNumber(item.extrinsic.index)
          }}-{{ item.index }}</Cell
        >

        <Cell>{{ item.section }} ➡ {{ item.method }}</Cell>
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
      events: [],
    }
  },
  apollo: {
    $subscribe: {
      event: {
        query: gql`
          {
            eventsConnection(orderBy: block_height_DESC, first: 10) {
              edges {
                node {
                  extrinsic {
                    id
                    block {
                      height
                    }
                    index
                  }
                  index
                  data
                  method
                  phase
                  section
                }
              }
            }
          }
        `,
        result({ data }) {
          this.events = data.eventsConnection.edges.map((event) => {
            return {
              ...event.node,
              extrinsic: {
                ...event.extrinsic,
                block_id: event.node.extrinsic.block.height,
              },
            }
          })
          this.loading = false
        },
      },
    },
  },
}
</script>
