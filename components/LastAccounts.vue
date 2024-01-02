<template>
  <div class="last-accounts">
    <div class="headline">
      <nuxt-link
        v-b-tooltip.hover
        :to="`/accounts`"
        title="Click to see last accounts"
      >
        Account Updates
      </nuxt-link>
    </div>
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <Table v-else>
      <THead>
        <Cell>Address</Cell>
        <Cell>Block Id</Cell>
        <Cell>Balance</Cell>
      </THead>
      <Row v-for="(item, index) in accounts" :key="'item-' + index">
        <Cell :link="`/account/${item.address}`">{{
          shortHash(item.address)
        }}</Cell>
        <Cell :link="`/block?blockNumber=${item.block_id}`"
          ># {{ formatNumber(item.block_id) }}</Cell
        >
        <Cell>{{ formatShortAmount(item.free_balance) }}</Cell>
      </Row>
    </Table>
  </div>
</template>

<script>
import { network as nw } from '@reef-chain/util-lib'
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'
import axiosInstance from '~/utils/axios'
import ObsPolling from '~/utils/obsPolling'

export default {
  components: {
    Loading,
  },
  mixins: [commonMixin],
  data() {
    return {
      accounts: [],
      loading: true,
      callbackId: null,
    }
  },
  created() {
    this.updateData()
    ObsPolling.addCallback(
      nw.getLatestBlockAccountUpdates$([]),
      this.updateData
    )
  },
  destroyed() {
    ObsPolling.removeCallback(nw.getLatestBlockAccountUpdates$([]))
  },
  methods: {
    async updateData() {
      try {
        const response = await axiosInstance.post('', {
          query: `
            query accounts {
              accounts: accountsConnection(
                orderBy: timestamp_DESC
                where: {}
                first: 10
              ) {
                edges {
                  node {
                    id
                    block {
                      height
                    }
                    freeBalance
                  }
                }
              }
            }
          `,
        })
        const data = response.data.data
        const dataArr = []
        if (data.accounts.edges) {
          for (let idx = 0; idx < data.accounts.edges.length; idx++) {
            dataArr.push(data.accounts.edges[idx].node)
          }
          data.accounts = dataArr
          this.accounts = dataArr
        }
        this.accounts = data.accounts.map((item) => {
          return {
            address: item.id,
            block_id: item.block.height,
            free_balance: item.freeBalance,
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
