<template>
  <div class="list-view accounts">
    <Search
      v-model="filter"
      :placeholder="$t('pages.accounts.search_placeholder')"
      :label="`${$t('pages.accounts.active_accounts')} ${
        formatNumber(totalRows) <= 1 ? '' : formatNumber(totalRows)
      }`"
    >
      <template slot="label">
        <JsonCSV
          :data="accounts"
          class="accounts__download-csv-btn"
          name="subsocial_accounts.csv"
        >
          <font-awesome-icon icon="file-csv" />
          <span>{{ $t('pages.accounts.download_csv') }}</span>
        </JsonCSV>
      </template>
    </Search>

    <section>
      <b-container>
        <div class="list-view__table">
          <div v-if="loading" class="text-center py-4">
            <Loading />
          </div>
          <Table v-else class="accounts__table">
            <THead>
              <Cell align="center">Rank</Cell>
              <Cell>Account</Cell>
              <Cell>EVM Address</Cell>
              <Cell align="right">Free Balance</Cell>
              <Cell align="right">Locked Balance</Cell>
              <Cell align="right">Available Balance</Cell>
              <Cell width="10" />
            </THead>

            <Row v-for="(item, index) in favoriteAccounts" :key="index">
              <Cell align="center">#{{ item.rank }}</Cell>

              <Cell :link="{ url: `/account/${item.address}`, fill: false }">
                <ReefIdenticon
                  :key="item.address"
                  :address="item.address"
                  :size="20"
                />
                <span>{{ shortAddress(item.address) }}</span>
              </Cell>

              <Cell
                v-if="item.evm_address"
                :link="{ url: `/account/${item.address}`, fill: false }"
              >
                <eth-identicon :address="item.evm_address" :size="20" />
                <span>{{
                  item.evm_address ? shortHash(item.evm_address) : ''
                }}</span>
              </Cell>
              <Cell v-else />

              <Cell align="right">{{
                formatShortAmount(item.free_balance)
              }}</Cell>

              <Cell align="right">{{
                formatShortAmount(item.locked_balance)
              }}</Cell>

              <Cell align="right">{{
                formatShortAmount(item.available_balance)
              }}</Cell>

              <Cell>
                <a class="favorite" @click="toggleFavorite(item.address)">
                  <font-awesome-icon
                    v-if="item.favorite"
                    v-b-tooltip.hover
                    icon="star"
                    style="color: #f1bd23; cursor: pointer"
                    :title="$t('pages.accounts.remove_from_favorites')"
                  />
                  <font-awesome-icon
                    v-else
                    v-b-tooltip.hover
                    icon="star"
                    style="color: #e6dfdf; cursor: pointer"
                    :title="$t('pages.accounts.add_to_favorites')"
                  />
                </a>
              </Cell>
            </Row>
            <THead v-if="favoriteAccounts.length > 0">
              <Cell />
              <Cell>All accounts</Cell>
              <Cell />
              <Cell />
              <Cell />
              <Cell />
              <Cell />
            </THead>
            <Row
              v-for="(item, index) in allAccounts"
              :key="index + favoriteAccounts.length"
            >
              <Cell align="center">#{{ item.rank }}</Cell>

              <Cell :link="{ url: `/account/${item.address}`, fill: false }">
                <ReefIdenticon
                  :key="item.address"
                  :address="item.address"
                  :size="20"
                />
                <span>{{ shortAddress(item.address) }}</span>
              </Cell>

              <Cell :link="{ url: `/account/${item.address}`, fill: false }">
                <eth-identicon
                  v-if="item.evm_address"
                  :address="item.evm_address"
                  :size="20"
                />
                <eth-identicon
                  v-if="!item.evm_address"
                  :address="item.address"
                  :size="20"
                />
                <span>{{
                  item.evm_address
                    ? shortHash(item.evm_address)
                    : 'Not connected'
                }}</span>
              </Cell>

              <Cell align="right">{{
                formatShortAmount(item.free_balance)
              }}</Cell>

              <Cell align="right">{{
                formatShortAmount(item.locked_balance)
              }}</Cell>

              <Cell align="right">{{
                formatShortAmount(item.available_balance)
              }}</Cell>

              <Cell>
                <a class="favorite" @click="toggleFavorite(item.address)">
                  <font-awesome-icon
                    v-if="item.favorite"
                    v-b-tooltip.hover
                    icon="star"
                    style="color: #f1bd23; cursor: pointer"
                    :title="$t('pages.accounts.remove_from_favorites')"
                  />
                  <font-awesome-icon
                    v-else
                    v-b-tooltip.hover
                    icon="star"
                    style="color: #e6dfdf; cursor: pointer"
                    :title="$t('pages.accounts.add_to_favorites')"
                  />
                </a>
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
import { gql } from 'graphql-tag'
import JsonCSV from 'vue-json-csv'
import ReefIdenticon from '@/components/ReefIdenticon.vue'
import Search from '@/components/Search'
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'
import BlockTimeout from '@/utils/polling.js'

const FIRST_BATCH_QUERY = gql`
  query account($first: Int!, $where: AccountWhereInput) {
    accounts: accountsConnection(
      orderBy: freeBalance_DESC
      first: $first
      where: $where
    ) {
      edges {
        node {
          id
          evmAddress
          availableBalance
          freeBalance
          lockedBalance
        }
      }
    }
    totalAccounts: chainInfos(where: { id_eq: "accounts" }, limit: 1) {
      count
    }
  }
`
const NEXT_BATCH_QUERY = gql`
  query account($first: Int!, $after: String!, $where: AccountWhereInput) {
    accounts: accountsConnection(
      orderBy: freeBalance_DESC
      first: $first
      after: $after
      where: $where
    ) {
      edges {
        node {
          id
          evmAddress
          availableBalance
          freeBalance
          lockedBalance
        }
      }
    }
    totalAccounts: chainInfos(where: { id_eq: "accounts" }, limit: 1) {
      count
    }
  }
`
export default {
  components: {
    Loading,
    ReefIdenticon,
    JsonCSV,
    Search,
  },
  mixins: [commonMixin],
  data() {
    return {
      loading: true,
      perPage: 10,
      currentPage: 1,
      sortBy: `favorite`,
      sortDesc: true,
      filter: null,
      filterOn: [],
      totalRows: 1,
      accounts: [],
      favorites: [],
      nAccounts: 0,
      allAccounts: [],
      favoriteAccounts: [],
      callbackId: null,
      previousPage: null,
      forceLoad: false,
    }
  },
  computed: {
    queryToExecute() {
      if (this.currentPage === 1) {
        return FIRST_BATCH_QUERY
      } else {
        return NEXT_BATCH_QUERY
      }
    },
  },
  watch: {
    favorites(val) {
      this.$cookies.set('favorites', val, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      })
    },
    currentPage() {
      if (this.currentPage === 1) {
        // if moving from any other page to page 1
        if (this.previousPage !== 1) {
          this.loading = true // set loading to true before refetching
          this.forceLoad = true
          setTimeout(() => {
            this.$apollo.queries.accounts.refetch()
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
    this.updateData()
    // get favorites from cookie
    if (this.$cookies.get('favorites')) {
      this.favorites = this.$cookies.get('favorites')
    }
    BlockTimeout.addCallback(this.updateData)
  },
  beforeDestroy() {
    BlockTimeout.removeCallback(this.updateData)
  },
  methods: {
    updateData() {
      this.$apollo.queries.favoriteAccounts.refetch()
      this.$apollo.queries.accounts.refetch()
    },
    toggleFavorite(accountId) {
      const includes = this.favorites.includes(accountId)
      if (includes) {
        this.favorites.splice(this.favorites.indexOf(accountId), 1)
        this.favoritesLength -= 1
        this.$bvToast.toast(
          `Account ${accountId} has been removed from your favorites.`,
          {
            title: 'Removed from Favorites',
            variant: 'danger',
            autoHideDelay: 5000,
            appendToast: false,
          }
        )
      } else {
        this.favorites.push(accountId)
        this.favoritesLength -= 1
        this.$bvToast.toast(
          `Account ${accountId} has been added to your favorites.`,
          {
            title: 'Added to Favorites',
            variant: 'success',
            autoHideDelay: 5000,
            appendToast: false,
          }
        )
      }
      for (const account of this.allAccounts) {
        if (account.address === accountId) {
          account.favorite = !account.favorite
        }
      }
      return true
    },
    isFavorite(accountId) {
      return this.favorites.includes(accountId)
    },
    updateFavoritesRank() {
      for (const account of this.allAccounts) {
        if (this.favorites.includes(account.address)) {
          this.favoriteAccounts = this.favoriteAccounts.map((acc) => ({
            ...acc,
            rank: account.address === acc.address ? account.rank : acc.rank,
          }))
        }
      }
    },
  },
  apollo: {
    accounts: {
      query: function () {
        return this.queryToExecute
      },
      variables() {
        let where = {}
        if (this.isAddress(this.filter)) {
          where = { id_eq: this.filter }
        } else if (this.isContractId(this.filter)) {
          where = {
            evmAddress_eq: this.toContractAddress(this.filter),
          }
        }
        const variables =
          this.currentPage === 1
            ? {
                first: this.perPage,
                where,
              }
            : {
                first: this.perPage,
                after: ((this.currentPage - 1) * this.perPage).toString(),
                where,
              }
        return variables
      },
      fetchPolicy: 'network-only',
      result({ data }) {
        const dataArr = []
        if (data.accounts.edges) {
          for (let idx = 0; idx < data.accounts.edges.length; idx++) {
            dataArr.push(data.accounts.edges[idx].node)
          }
          data.accounts = dataArr
          this.accounts = dataArr
        }
        if (data && data.accounts) {
          data.accounts = data.accounts.map((account) => ({
            ...account,
            address: account.id,
            free_balance: account.freeBalance,
            evm_address: account.evmAddress,
            locked_balance: account.lockedBalance,
            available_balance: account.availableBalance,
          }))
          this.allAccounts = data.accounts.map((account, index) => ({
            ...account,
            favorite: this.favorites.includes(account.address),
            rank: index + (this.currentPage - 1) * this.perPage + 1,
          }))
          if (!this.filter) {
            this.updateFavoritesRank()
            this.totalRows = this.nAccounts
          } else {
            this.totalRows = this.allAccounts.length
          }
        }
        this.nAccounts = data.totalAccounts[0].count
        this.totalRows = this.nAccounts
        if (!this.forceLoad) this.loading = false
      },
    },
    favoriteAccounts: {
      query: gql`
        query favoriteAccount($addresses: [String!]) {
          favoriteAccounts: accounts(
            orderBy: freeBalance_DESC
            where: { id_in: $addresses }
          ) {
            id
            freeBalance
            evmAddress
            lockedBalance
            availableBalance
          }
        }
      `,
      variables() {
        return {
          addresses: this.favorites,
        }
      },
      fetchPolicy: 'network-only',
      result({ data, error }) {
        if (error) {
          this.setPerPage(50)
          this.$bvToast.toast(`Exceeds the size limit`, {
            title: 'Encountered an Error',
            variant: 'danger',
            autoHideDelay: 5000,
            appendToast: false,
          })
        } else {
          if (data && data.favoriteAccounts) {
            this.favoriteAccounts = data.favoriteAccounts.map((account) => ({
              ...account,
              address: account.id,
              free_balance: account.freeBalance,
              evm_address: account.evmAddress,
              locked_balance: account.lockedBalance,
              available_balance: account.availableBalance,
              favorite: true,
            }))
          }
          this.updateFavoritesRank()
        }
      },
    },
  },
}
</script>

<style lang="scss">
.accounts {
  .accounts__download-csv-btn {
    margin: 0;
    color: white;
    display: flex;
    flex-flow: row nowrap;
    justify-content: flex-start;
    align-items: center;
    user-select: none;

    svg {
      margin-right: 8px;
    }

    &:hover {
      cursor: pointer;
      text-decoration: underline;
    }

    &:active {
      opacity: 0.75;
    }
  }

  .favorite {
    &::after {
      display: none;
    }
  }

  .accounts__list {
    display: none;

    .accounts__list-item {
      padding: 22px 10px 25px 10px;
      text-decoration: none;
      display: flex;
      flex-flow: column nowrap;
      justify-content: flex-start;
      align-items: center;

      .accounts__list-item-rank {
        text-align: center;
        font-size: 13px;
        font-weight: 500;
        color: rgba(#4c4f58, 0.8);
      }

      .accounts__list-item-identicon {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        overflow: hidden;
        box-shadow: 0 0 10px -10px rgba(#0f233f, 0.5),
          0 5px 15px -5px rgba(#0f233f, 0.25);
        display: flex;
        justify-content: center;
        align-items: center;
        margin: 8px 0 13px 0;
      }

      .accounts__list-item-account {
        text-align: center;
        font-size: 17px;
        font-weight: 600;
        background: linear-gradient(90deg, #a93185, #5531a9);
        background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .accounts__list-item-info {
        width: 100%;
        margin-top: 20px;

        .accounts__list-item-info-item {
          width: 100%;
          display: flex;
          flex-flow: row nowrap;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          line-height: 15px;
          font-weight: 500;
          color: #3e3f42;
          text-align: right;

          label {
            margin: 0;
            text-align: left;
            font-weight: 600;
          }

          & + .accounts__list-item-info-item {
            margin-top: 8px;
          }
        }
      }

      &:first-child {
        padding-top: 17px;
      }

      & + .accounts__list-item {
        border-top: solid 1px #eaedf3;
      }
    }
  }

  @media only screen and (max-width: 768px) {
    .accounts__list {
      display: block;
    }
  }

  @media only screen and (max-width: 576px) {
    .accounts__download-csv-btn {
      margin-top: 10px;
    }
  }
}
</style>
