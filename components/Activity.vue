<template>
  <div class="activity list-view">
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else-if="activities.length === 0" class="text-center py-4">
      <h5>{{ $t('components.activity.no_activity_found') }}</h5>
    </div>
    <div v-else>
      <div class="list-view__table-head">
        <JsonCSV
          :data="activities"
          class="list-view__download-btn"
          :name="`reef_${accountId}_activity.csv`"
        >
          <font-awesome-icon icon="file-csv" />
          <span>{{ $t('pages.accounts.download_csv') }}</span>
        </JsonCSV>
      </div>

      <Table>
        <THead>
          <Cell :sortable="['hash', activeSort]">Hash</Cell>
          <Cell :sortable="['block_id', activeSort]">Block</Cell>
          <Cell :sortable="['timestamp', activeSort, true]">Date</Cell>
          <Cell :sortable="['signer', activeSort]">Signer</Cell>
          <Cell>Extrinsic</Cell>
          <Cell :sortable="['status', activeSort]" align="center">Success</Cell>
        </THead>

        <Row v-for="(item, index) in list" :key="index">
          <Cell :link="`/extrinsic/${item.block_id}/${item.index}`"
            >{{ shortHash(item.hash) }}
          </Cell>

          <Cell
            :link="{
              url: `/block?blockNumber=${item.block_id}`,
              fill: false,
            }"
          >
            # {{ formatNumber(item.block_id) }}
          </Cell>

          <Cell class="list-view__age">
            <font-awesome-icon :icon="['far', 'clock']" />
            <span>{{ fromNow(item.timestamp) }}</span>
          </Cell>

          <Cell
            :link="{ url: `/account/${item.signer}`, fill: false }"
            :title="$t('pages.accounts.account_details')"
          >
            <ReefIdenticon
              :key="item.signer"
              :address="item.signer"
              :size="20"
            />
            <span>{{ shortAddress(item.signer) }}</span>
          </Cell>

          <Cell>
            {{ item.section }} ➡
            {{ item.method }}
          </Cell>

          <Cell align="center">
            <font-awesome-icon
              v-if="item.status === 'success'"
              icon="check"
              class="text-success"
            />
            <font-awesome-icon v-else icon="times" class="text-danger" />
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
  </div>
</template>

<script>
import { network as nw } from '@reef-chain/util-lib'
import JsonCSV from 'vue-json-csv'
import commonMixin from '@/mixins/commonMixin.js'
import ReefIdenticon from '@/components/ReefIdenticon.vue'
import Loading from '@/components/Loading.vue'
import { paginationOptions } from '@/frontend.config.js'
import tableUtils from '@/mixins/tableUtils'
import ObsPolling from '~/utils/obsPolling'
import axiosInstance from '~/utils/axios'

const FIRST_BATCH_QUERY = `
  query extrinsic($signer: String!, $first: Int!) {
    extrinsics: extrinsicsConnection(
      orderBy: block_height_DESC
      where: { signer_eq: $signer }
      first: $first
    ) {
      edges {
        node {
          id
          index
          block {
            height
          }
          signer
          hash
          section
          method
          status
          timestamp
        }
      }
      totalCount
    }
  }
`

const NEXT_BATCH_QUERY = `
  query extrinsic($signer: String!, $first: Int!, $after: String!) {
    extrinsics: extrinsicsConnection(
      orderBy: block_height_DESC
      where: { signer_eq: $signer }
      first: $first
      after: $after
    ) {
      edges {
        node {
          id
          index
          block {
            height
          }
          signer
          hash
          section
          method
          status
          timestamp
        }
      }
      totalCount
    }
  }
`

export default {
  components: {
    ReefIdenticon,
    JsonCSV,
    Loading,
  },
  mixins: [commonMixin, tableUtils],
  props: {
    accountId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      loading: true,
      activities: [],
      filter: null,
      filterOn: [],
      tableOptions: paginationOptions,
      perPage: paginationOptions[0],
      currentPage: 1,
      totalRows: 1,
      callbackId: null,
    }
  },
  computed: {
    list() {
      return this.activities.slice(0, this.perPage)
    },
  },
  watch: {
    perPage() {
      this.updateData()
    },
    currentPage() {
      this.updateData()
    },
  },
  created() {
    this.updateData()
    ObsPolling.addCallback(
      nw.getLatestBlockAccountUpdates$([this.accountId]),
      this.updateData
    )
  },
  destroyed() {
    ObsPolling.removeCallback(this.updateData)
  },
  methods: {
    async updateData() {
      try {
        const response = await axiosInstance.post('', {
          query: this.currentPage === 1 ? FIRST_BATCH_QUERY : NEXT_BATCH_QUERY,
          variables: {
            signer: this.accountId,
            first: this.perPage,
            after: ((this.currentPage - 1) * this.perPage).toString(),
          },
        })
        const data = response.data.data
        const totalCount = response.data.data.extrinsics.totalCount
        const dataArr = []
        if (data.extrinsics.edges) {
          for (let idx = 0; idx < data.extrinsics.edges.length; idx++) {
            dataArr.push(data.extrinsics.edges[idx].node)
          }
          data.extrinsics = dataArr
          this.extrinsics = dataArr
        }
        data.extrinsics = data.extrinsics.map((item) => {
          return {
            ...item,
            block_id: item.block.height,
          }
        })
        this.activities = data.extrinsics
        this.totalRows = totalCount
        if (this.filter) this.totalRows = this.activities.length
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
    handleNumFields(num) {
      localStorage.paginationOptions = num
      this.perPage = parseInt(num)
    },
    isFavorite(accountId) {
      return this.favorites.includes(accountId)
    },
    onFiltered(filteredItems) {
      // Trigger pagination to update the number of buttons/pages due to filtering
      this.totalRows = filteredItems.length
      this.currentPage = 1
    },
    setPerPage(value) {
      this.perPage = value
    },
  },
}
</script>

<style>
.activity {
  background-color: white;
}
.spinner {
  color: #d3d2d2;
}
</style>
