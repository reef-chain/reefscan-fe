<template>
  <div class="list-view">
    <Search
      v-model="filter"
      :placeholder="$t('pages.events.search_placeholder')"
      :label="`${$t('pages.events.title')} ${
        formatNumber(totalRows) <= 1 ? '' : formatNumber(totalRows)
      }`"
    />

    <section>
      <b-container>
        <div class="list-view__table">
          <div v-if="loading" class="text-center py-4">
            <Loading />
          </div>
          <Table v-else>
            <THead>
              <Cell>Event</Cell>
              <Cell>Block</Cell>
              <Cell>Age</Cell>
              <Cell>Section/Method</Cell>
              <Cell>Data</Cell>
            </THead>

            <Row v-for="(item, index) in events" :key="index">
              <Cell
                :link="`/event/${item.extrinsic.block_id}/${item.extrinsic.index}/${item.index}`"
                ># {{ formatNumber(item.extrinsic.block_id) }}-{{
                  formatNumber(item.extrinsic.index)
                }}-{{ item.index }}</Cell
              >

              <Cell :link="`/block?blockNumber=${item.block_id}`"
                ># {{ formatNumber(item.block_id) }}</Cell
              >

              <Cell class="list-view__age">
                <font-awesome-icon :icon="['far', 'clock']" />
                <span>{{ getAge(item.timestamp) }}</span>
                <span>({{ formatTimestamp(item.timestamp) }})</span>
              </Cell>

              <Cell>{{ item.section }} ➡ {{ item.method }}</Cell>

              <Cell>{{ item.data }}</Cell>
            </Row>
          </Table>

          <div class="list-view__pagination">
            <PerPage v-model="perPage" />
            <b-pagination
              v-model="currentPage"
              :total-rows="totalRows"
              :per-page="perPage"
            />
          </div>
        </div>
      </b-container>
    </section>
  </div>
</template>

<script>
import commonMixin from '@/mixins/commonMixin.js'
import Search from '@/components/Search'
import Loading from '@/components/Loading.vue'
import { paginationOptions } from '@/frontend.config.js'
import BlockTimeout from '@/utils/polling.js'
import axiosInstance from '~/utils/axios'

const FIRST_BATCH_QUERY = `
  query events($blockNumber: BlockWhereInput!, $first: Int!) {
    events: eventsConnection(
      first: $first
      where: { block: $blockNumber }
      orderBy: id_DESC
    ) {
      edges {
        node {
          id
          block {
            height
          }
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
          timestamp
        }
      }
    }
    totalEvents: chainInfos(where: { id_eq: "events" }, limit: 1) {
      count
    }
  }
`
const NEXT_BATCH_QUERY = `
  query events($blockNumber: BlockWhereInput!, $first: Int!, $after: String!) {
    events: eventsConnection(
      first: $first
      after: $after
      where: { block: $blockNumber }
      orderBy: id_DESC
    ) {
      edges {
        node {
          id
          block {
            height
          }
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
          timestamp
        }
      }
    }
    totalEvents: chainInfos(where: { id_eq: "events" }, limit: 1) {
      count
    }
  }
`

export default {
  components: {
    Loading,
    Search,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      filter: '',
      events: [],
      paginationOptions,
      perPage: paginationOptions[1],
      currentPage: 1,
      totalRows: 1,
      nEvents: 0,
      callbackId: null,
      previousPage: null,
      forceLoad: false,
    }
  },
  watch: {
    currentPage() {
      if (this.currentPage === 1) {
        // if moving from any other page to page 1
        if (this.previousPage !== 1) {
          this.loading = true // set loading to true before refetching
          this.forceLoad = true
          setTimeout(() => {
            this.forceLoad = false
          }, 100)
        }
        BlockTimeout.addCallback(this.updateData)
      } else {
        BlockTimeout.removeCallback(this.updateData)
      }
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
        const response = await axiosInstance.post('', {
          query: this.currentPage === 1 ? FIRST_BATCH_QUERY : NEXT_BATCH_QUERY,
          variables: {
            blockNumber: this.filter
              ? { height_eq: parseInt(this.filter) }
              : {},
            first: this.perPage,
            after: ((this.currentPage - 1) * this.perPage).toString(),
          },
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
        this.events.forEach((event) => {
          event.block_id = event.block.height
          event.extrinsic.block_id = event.extrinsic.block.height
        })
        this.totalRows = this.filter ? this.events.length : this.nEvents
        this.nEvents = data.totalEvents[0].count
        this.totalRows = this.nEvents
        this.loading = false
      } catch (error) {
        this.setPerPage(50)
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
