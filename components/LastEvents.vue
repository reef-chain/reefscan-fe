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
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'
import BlockTimeout from '@/utils/polling.js'
import axiosInstance from '~/utils/axios'

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
    async updateData() {
      try {
        const response = await axiosInstance.post('', {
          query: `
            query events {
              events: eventsConnection(orderBy: id_DESC, where: {}, first: 10) {
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
        })
        const data = response.data.data
        const dataArr = []
        if (data.events.edges) {
          for (let idx = 0; idx < data.events.edges.length; idx++) {
            dataArr.push(data.events.edges[idx].node)
          }
          data.events = dataArr
          this.events = dataArr
        }
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
