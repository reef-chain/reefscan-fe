<template>
  <div class="list-view">
    <Search
      v-model="filter"
      placeholder="Search by block number"
      :label="`${$t('pages.blocks.title')} ${
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
              <Cell>Block</Cell>
              <Cell>Age</Cell>
              <Cell>Status</Cell>
              <Cell>Hash</Cell>
              <!--              <Cell align="center">Extrinsics</Cell>
              <Cell align="center">Events</Cell>-->
            </THead>

            <Row v-for="(item, index) in blocks" :key="index">
              <Cell :link="`/block/${item.hash}`"
                ># {{ formatNumber(item.id) }}</Cell
              >

              <Cell class="list-view__age">
                <font-awesome-icon :icon="['far', 'clock']" />
                <span>{{ getAge(item.timestamp) }}</span>
                <span>({{ formatTimestamp(item.timestamp) }})</span>
              </Cell>

              <Cell>
                <font-awesome-icon
                  :icon="item.finalized ? 'check' : 'spinner'"
                  :class="
                    item.finalized
                      ? 'text-success'
                      : 'list-view__processing-icon'
                  "
                  style="margin-right: 5px"
                />
                <span>{{ item.finalized ? 'Finalized' : 'Processing' }}</span>
              </Cell>

              <Cell>{{ shortHash(item.hash) }}</Cell>
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
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import Search from '@/components/Search'
import Loading from '@/components/Loading.vue'
import { paginationOptions } from '@/frontend.config.js'
import BlockTimeout from '@/utils/polling.js'

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
      blocks: [],
      paginationOptions,
      perPage: paginationOptions[1],
      currentPage: 1,
      totalRows: 1,
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
            this.$apollo.queries.blocks.refetch()
            this.forceLoad = false
          }, 100)
        }
        BlockTimeout.addCallback(this.updateData)
      } else {
        BlockTimeout.removeCallback(this.updateData)
      }
    },
  },
  created() {
    BlockTimeout.addCallback(this.updateData)
  },
  destroyed() {
    BlockTimeout.removeCallback(this.updateData)
  },
  methods: {
    updateData() {
      this.$apollo.queries.blocks.refetch()
    },
  },
  apollo: {
    blocks: {
      query: gql`
        query blocks($where: BlockWhereInput, $perPage: Int!, $offset: Int!) {
          blocks(
            offset: $offset
            limit: $perPage
            where: $where
            orderBy: height_DESC
          ) {
            id
            hash
            finalized
            timestamp
            height
          }
          totalBlocks: chainInfos(where: { id_eq: "blocks" }, limit: 1) {
            count
          }
        }
      `,
      variables() {
        return {
          where: this.isBlockNumber(this.filter)
            ? { height_eq: parseInt(this.filter) }
            : {},
          perPage: this.perPage,
          offset: (this.currentPage - 1) * this.perPage,
        }
      },
      fetchPolicy: 'network-only', // force fetch data from the server
      result({ data }) {
        this.blocks = data.blocks
        this.blocks = this.blocks.map((block) => {
          block.id = block.height
          return block
        })
        if (this.filter) {
          this.totalRows = this.blocks.length
        } else {
          this.totalRows = data.totalBlocks[0].count
        }
        if (!this.forceLoad) this.loading = false
      },
    },
  },
}
</script>
