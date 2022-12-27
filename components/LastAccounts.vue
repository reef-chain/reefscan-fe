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

    <Table>
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

export default {
  mixins: [commonMixin],
  data() {
    return {
      accounts: [],
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
        },
      },
    },
  },
}
</script>
