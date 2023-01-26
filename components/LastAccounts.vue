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
import { gql } from 'graphql-tag'
import commonMixin from '@/mixins/commonMixin.js'
import Loading from '@/components/Loading.vue'

export default {
  components: {
    Loading,
  },
  mixins: [commonMixin],
  data() {
    return {
      accounts: [],
      loading: true,
    }
  },
  apollo: {
    $subscribe: {
      account: {
        query: gql`
          subscription accounts {
            accounts(orderBy: block_height_DESC, where: {}, limit: 10) {
              id
              block {
                height
              }
              freeBalance
            }
          }
        `,
        result({ data }) {
          this.accounts = data.accounts.map((item) => {
            return {
              address: item.id,
              block_id: item.block.height,
              free_balance: item.freeBalance,
            }
          })
          this.loading = false
        },
      },
    },
  },
}
</script>
