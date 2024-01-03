<template>
  <div class="token-holders list-view">
    <div v-if="loading" class="text-center py-4">
      <Loading />
    </div>
    <div v-else-if="holders.length === 0" class="text-center py-4">
      <h5>No holders found</h5>
    </div>
    <div v-else>
      <Table>
        <THead>
          <Cell>Account ID</Cell>
          <Cell>EVM Address</Cell>
          <Cell align="right" :sortable="['balance', activeSort]">Balance</Cell>
        </THead>

        <Row v-for="(item, index) in list" :key="index">
          <Cell
            v-if="
              item.account &&
              item.account.address &&
              item.account.address[0] != 0
            "
            :link="`/account/${item.account.address}`"
            :title="$t('pages.accounts.account_details')"
          >
            <ReefIdenticon
              :key="item.account.address"
              :address="item.account.address"
              :size="20"
            />
            <span>{{ shortAddress(item.account.address) }}</span>
          </Cell>
          <Cell v-else :title="$t('pages.accounts.account_details')">
            <ReefIdenticon
              :key="item.account.address"
              :address="item.account.address"
              :size="20"
            />
            <span>{{ shortAddress(item.account.address) }}</span>
          </Cell>
          <Cell
            v-if="
              item.account &&
              item.account.evm_address &&
              item.account.address[0] != 0
            "
            :link="{ fill: false, url: `/account/${item.account.address}` }"
          >
            <eth-identicon :address="item.account.evm_address" :size="20" />
            <span>{{ shortHash(item.account.evm_address) }}</span>
          </Cell>
          <Cell v-else>
            <span></span>
          </Cell>
          <Cell align="right">{{ getBalance(item) }}</Cell>
        </Row>
      </Table>

      <div class="list-view__pagination">
        <PerPage v-model="perPage" />
        <b-pagination
          v-model="currentPage"
          :total-rows="holders.length"
          :per-page="perPage"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { network as nw } from '@reef-chain/util-lib'
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'
import { paginationOptions } from '@/frontend.config.js'
import tableUtils from '@/mixins/tableUtils'
import axiosInstance from '~/utils/axios'
import ObsPolling from '~/utils/obsPolling'

export default {
  components: {
    Loading,
  },
  mixins: [commonMixin, tableUtils],
  props: {
    tokenId: { type: String, required: true },
    decimals: { type: Number, default: 0 },
    symbol: { type: String, default: '' },
  },
  data() {
    return {
      loading: true,
      holders: [],
      tableOptions: paginationOptions,
      perPage: null,
      currentPage: 1,
      totalRows: 1,
      activeSort: {
        property: 'balance',
        descending: true,
      },
      callbackId: null,
    }
  },
  computed: {
    list() {
      return this.paginate(
        this.sort(this.holders),
        this.perPage,
        this.currentPage
      )
    },
  },
  created() {
    this.updateData()
    ObsPolling.addCallback(
      nw.getLatestBlockContractEvents$([this.tokenId]),
      this.updateData
    )
  },
  destroyed() {
    ObsPolling.removeCallback(this.updateData)
  },
  methods: {
    async updateData() {
      const TOKEN_HOLDERS_QUERY = `
        query token_holder($tokenId: String!) {
          tokenHolders(
            limit: 120
            orderBy: token_id_DESC
            where: { token: { id_eq: $tokenId } }
          ) {
            id
            signer {
              id
              evmAddress
            }
            balance
            evmAddress
            token {
              id
            }
          }
        }
      `
      try {
        const response = await axiosInstance.post('', {
          query: TOKEN_HOLDERS_QUERY,
          variables: {
            tokenId: this.tokenId,
          },
        })
        const data = await response.data.data
        this.holders = data.tokenHolders.map((holder) => {
          return {
            ...holder,
            token_address: holder.token.id,
            balance: holder.balance,
            account: {
              address: holder.signer ? holder.signer.id : holder.evmAddress,
              evm_address: holder.signer
                ? holder.signer.evmAddress
                : holder.evmAddress,
            },
          }
        })
        this.totalRows = this.holders.length
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
    getBalance(holder) {
      return this.formatTokenAmount(holder.balance, this.decimals, this.symbol)
    },
  },
}
</script>
