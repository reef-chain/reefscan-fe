<template>
  <div class="list-view">
    <Search
      v-model="filter"
      :placeholder="$t('pages.blocks.search_placeholder')"
      :label="`${$t('pages.extrinsics.title')} ${
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
              <Cell>Hash</Cell>
              <Cell>Extrinsic</Cell>
              <Cell>Age</Cell>
              <Cell>Section/Method</Cell>
              <Cell align="center">Signed</Cell>
            </THead>

            <Row v-for="(item, index) in extrinsics" :key="index">
              <Cell :link="`/extrinsic/${item.hash}`">
                {{ shortHash(item.hash) }}
              </Cell>

              <Cell
                :link="{
                  url: `/extrinsic/${item.block_id}/${item.index}`,
                  fill: false,
                }"
                >{{ item.block_id }}-{{ item.index }}</Cell
              >

              <Cell class="list-view__age">
                <font-awesome-icon :icon="['far', 'clock']" />
                <span>{{ getAge(getUnixTimestamp(item.timestamp)) }}</span>
                <span>({{ formatTimestamp(item.timestamp) }})</span>
              </Cell>

              <Cell>{{ item.section }} ➡ {{ item.method }}</Cell>

              <Cell align="center">
                <font-awesome-icon
                  v-if="item.type === 'signed'"
                  icon="lock"
                  class="text-success"
                />
                <font-awesome-icon v-else icon="lock-open" class="text-gray" />
              </Cell>
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

const GQL_QUERY = `
  query extrinsics(
    $blockNumber: BlockWhereInput!
    $first: Int!
    $after: String!
  ) {
    extrinsics: extrinsicsConnection(
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
          index
          signer
          section
          method
          hash
          type
          timestamp
          errorMessage
        }
      }
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
      extrinsics: [],
      paginationOptions,
      perPage: paginationOptions[1],
      currentPage: 1,
      totalRows: 1,
      nExtrinsics: 0,
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
      const getVariables = () => {
        const offs = (this.currentPage - 1) * this.perPage + 1
        return {
          blockNumber: this.filter ? { height_eq: parseInt(this.filter) } : {},
          first: this.perPage,
          after: offs.toString(),
        }
      }
      const TOTAL_EXTRINSICS_QUERY = `
        query total {
          totalExtrinsics: chainInfos(
            where: { id_eq: "extrinsics" }
            limit: 1
          ) {
            count
          }
        }
      `
      try {
        const [extrinsicsResponse, totalExtrinsicsResponse] = await Promise.all(
          [
            axiosInstance.post('', {
              query: GQL_QUERY,
              variables: getVariables(),
            }),
            axiosInstance.post('', {
              query: TOTAL_EXTRINSICS_QUERY,
            }),
          ]
        )
        const data = extrinsicsResponse.data.data
        const dataArr = []
        if (data.extrinsics.edges) {
          for (let idx = 0; idx < data.extrinsics.edges.length; idx++) {
            dataArr.push(data.extrinsics.edges[idx].node)
          }
          data.extrinsics = dataArr
          this.extrinsics = dataArr
        }
        data.extrinsics.forEach((item) => {
          item.block_id = item.block.height
          item.error_message = item.errorMessage
        })
        this.extrinsics = data.extrinsics
        this.totalRows = this.filter ? this.extrinsics.length : this.nExtrinsics
        this.nExtrinsics =
          totalExtrinsicsResponse.data.data.totalExtrinsics[0].count
        this.totalRows = this.nExtrinsics
        if (!this.forceLoad) this.loading = false
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
