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
import BlockTimeout from '@/utils/polling.js'

export default {
  components: {
    Loading,
  },
  mixins: [commonMixin],
  data: () => {
    return {
      loading: true,
      events: [],
      callbackId: null,
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
        query events {
          events(orderBy: id_DESC, where: {}, limit: 10) {
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
      `,
      result({ data }) {
        this.events = data.events.map((event) => {
          return {
            ...event,
            extrinsic: {
              ...event.extrinsic,
              block_id: event.extrinsic.block.height,
            },
          }
        })
        this.loading = false
      },
    },
  },
}
</script>
