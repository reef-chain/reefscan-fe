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
          <Table v-else-if="!loading && blocks.length">
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

          <div v-else class="py-4">
            <div class="no-data-found">No data found</div>
          </div>

          <div v-if="blocks.length" class="list-view__pagination">
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
import { reefState } from '@reef-chain/util-lib'
import commonMixin from '@/mixins/commonMixin.js'
import Search from '@/components/Search'
import Loading from '@/components/Loading.vue'
import { paginationOptions } from '@/frontend.config.js'
import axiosInstance from '~/utils/axios'

const NEXT_BATCH_QUERY = `
  query blocks($where: BlockWhereInput, $first: Int!, $after: String!) {
    blocks: blocksConnection(
      after: $after
      first: $first
      where: $where
      orderBy: height_DESC
    ) {
      edges {
        node {
          id
          hash
          finalized
          timestamp
          height
        }
      }
    }
    totalBlocks: chainInfos(where: { id_eq: "blocks" }, limit: 1) {
      count
    }
  }
`

const FIRST_BATCH_QUERY = `
  query blocks($where: BlockWhereInput, $first: Int!) {
    blocks: blocksConnection(
      first: $first
      where: $where
      orderBy: height_DESC
    ) {
      edges {
        node {
          id
          hash
          finalized
          timestamp
          height
        }
      }
    }
    totalBlocks: chainInfos(where: { id_eq: "blocks" }, limit: 1) {
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
      blocks: [],
      paginationOptions,
      perPage: paginationOptions[1],
      currentPage: 1,
      totalRows: 1,
      callbackId: null,
      previousPage: null,
      forceLoad: false,
      unsubscribe: null,
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
        reefState.selectedProvider$.subscribe(async (provider) => {
          this.unsubscribe = await provider.api.rpc.chain.subscribeNewHeads(
            () => this.updateData()
          )
        })
      } else if (this.unsubscribe) this.unsubscribe()
      this.updateData()
    },
    filter() {
      this.updateData()
    },
    perPage() {
      this.updateData()
    },
  },
  created() {
    this.updateData()
    reefState.selectedProvider$.subscribe(async (provider) => {
      this.unsubscribe = await provider.api.rpc.chain.subscribeNewHeads(() =>
        this.updateData()
      )
    })
  },
  destroyed() {
    if (this.unsubscribe) this.unsubscribe()
  },
  methods: {
    async updateData() {
      try {
        const response = await axiosInstance.post('', {
          query: this.currentPage === 1 ? FIRST_BATCH_QUERY : NEXT_BATCH_QUERY,
          variables: {
            where: this.isBlockNumber(this.filter)
              ? { height_eq: parseInt(this.filter) }
              : (await this.isBlockHash(this.filter))
              ? { hash_eq: this.filter }
              : {},
            first: this.perPage,
            after: ((this.currentPage - 1) * this.perPage).toString(),
          },
        })
        const data = response.data.data
        const blocksArr = []
        if (data.blocks.edges) {
          for (let idx = 0; idx < data.blocks.edges.length; idx++) {
            blocksArr.push(data.blocks.edges[idx].node)
          }
          data.blocks = blocksArr
          this.blocks = blocksArr
        }
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
<style>
.no-data-found {
  font-size: 28px;
  font-weight: 300;
  color: #898e9c;
  padding: 0 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
