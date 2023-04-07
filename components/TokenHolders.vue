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
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'
import { paginationOptions } from '@/frontend.config.js'
import tableUtils from '@/mixins/tableUtils'
import BlockTimeout from '@/utils/polling.js'

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
    BlockTimeout.addCallback(this.updateData)
  },
  destroyed() {
    BlockTimeout.removeCallback(this.updateData)
  },
  methods: {
    updateData() {
      this.$apollo.queries.tokenHolders.refetch()
    },
    handleNumFields(num) {
      localStorage.paginationOptions = num
      this.perPage = parseInt(num)
    },
    getBalance(holder) {
      return this.formatTokenAmount(holder.balance, this.decimals, this.symbol)
    },
  },
  apollo: {
    tokenHolders: {
      // query: gql`
      //   subscription token_holder($tokenId: String!) {
      //     token_holder(
      //       order_by: { token_address: desc }
      //       where: { token_address: { _eq: $tokenId } }
      //     ) {
      //       token_address
      //       signer
      //       balance
      //       account {
      //         address
      //         evm_address
      //       }
      //     }
      //   }
      // `,
      query: gql`
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
      `,
      variables() {
        return {
          tokenId: this.tokenId,
        }
      },
      skip() {
        return !this.tokenId
      },
      fetchPolicy: 'network-only',
      result({ data }) {
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
      },
    },
  },
}
</script>
