<template>
  <div class="list-view contracts">
    <Search
      v-model="filter"
      :placeholder="$t('pages.contracts.search_placeholder')"
      :label="`${$t('pages.contracts.title')} ${
        formatNumber(totalRows) <= 1 ? '' : formatNumber(totalRows)
      }`"
    >
      <!-- TODO: uncomment when verification api works -->
      <!-- <template slot="bottom">
        <b-alert
          variant="info"
          class="contracts__alert text-center"
          show
          dismissible
        >
          <p class="mb-0">
            <font-awesome-icon icon="code" style="margin-right: 5px" />
            Are you a developer? Verify and publish your contract source code
            <nuxt-link to="/verifyContract" class="alert-link">here</nuxt-link>.
          </p>
        </b-alert>
      </template> -->
    </Search>

    <section>
      <b-container>
        <div class="list-view__table">
          <div v-if="loading" class="text-center py-4">
            <Loading />
          </div>
          <Table v-else>
            <THead>
              <Cell>Contract Address</Cell>
              <Cell>Name</Cell>
              <Cell>Created at Block</Cell>
              <Cell align="center">Verified</Cell>
              <Cell align="center">Type</Cell>
            </THead>

            <Row v-for="(item, index) in contracts" :key="index">
              <Cell :link="{ url: `/contract/${item.address}`, fill: false }">
                <eth-identicon :address="item.address" :size="20" />
                <span>{{ shortHash(item.address) }}</span>
              </Cell>

              <Cell
                v-if="!!item.verified_contract"
                :link="`/contract/${item.address}`"
                >{{ item.verified_contract.name }}</Cell
              >
              <Cell v-else />

              <Cell
                :link="{
                  url: `/block?blockNumber=${item.extrinsic.block_id}`,
                  fill: false,
                }"
              >
                # {{ formatNumber(item.extrinsic.block_id) }}
              </Cell>

              <Cell align="center">
                <font-awesome-icon
                  v-if="item.verified_contract"
                  icon="check"
                  class="text-success"
                />
                <font-awesome-icon v-else icon="times" class="text-danger" />
              </Cell>
              <Cell
                v-if="
                  !!item.verified_contract &&
                  item.verified_contract.type === 'ERC20'
                "
                :link="{ url: `/token/${item.address}`, fill: false }"
                align="center"
              >
                Token
              </Cell>
              <Cell v-else></Cell>
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
import Loading from '@/components/Loading.vue'
import Search from '@/components/Search'
import { paginationOptions } from '@/frontend.config.js'
import BlockTimeout from '@/utils/polling.js'

const FIRST_BATCH_QUERY = gql`
  query contract($where: ContractWhereInput!, $first: Int!) {
    contracts: contractsConnection(
      first: $first
      where: $where
      orderBy: extrinsic_timestamp_DESC
    ) {
      edges {
        node {
          id
          extrinsic {
            block {
              height
            }
          }
          timestamp
        }
      }
    }
  }
`

const NEXT_BATCH_QUERY = gql`
  query contract($where: ContractWhereInput!, $first: Int!, $after: String!) {
    contracts: contractsConnection(
      first: $first
      after: $after
      where: $where
      orderBy: extrinsic_timestamp_DESC
    ) {
      edges {
        node {
          id
          extrinsic {
            block {
              height
            }
          }
          timestamp
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
      contracts: [],
      paginationOptions,
      perPage: paginationOptions[1],
      currentPage: 1,
      totalRows: 1,
      nContracts: 0,
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
    currentPage() {
      if (this.currentPage === 1) {
        // if moving from any other page to page 1
        if (this.previousPage !== 1) {
          this.loading = true // set loading to true before refetching
          this.forceLoad = true
          setTimeout(() => {
            this.$apollo.queries.contracts.refetch()
            this.$apollo.queries.verifiedContracts.refetch()
            this.$apollo.queries.totalContracts.refetch()
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
      this.$apollo.queries.contracts.refetch()
      this.$apollo.queries.verifiedContracts.refetch()
      this.$apollo.queries.totalContracts.refetch()
    },
    setPerPage(value) {
      this.perPage = value
    },
  },
  apollo: {
    contracts: {
      query: function () {
        return this.queryToExecute
      },
      variables() {
        let where = {}
        if (this.isBlockNumber(this.filter)) {
          where = {
            extrinsic: {
              block: {
                height_eq: parseInt(this.filter),
              },
            },
          }
        } else if (this.isContractId(this.filter)) {
          where = {
            id_containsInsensitive: this.toContractAddress(this.filter),
          }
        }
        const newVar = {
          where,
          first: this.perPage,
          after: ((this.currentPage - 1) * this.perPage).toString(),
        }
        return newVar
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
          const dataArr = []
          if (data.contracts.edges) {
            for (let idx = 0; idx < data.contracts.edges.length; idx++) {
              dataArr.push(data.contracts.edges[idx].node)
            }
            data.contracts = dataArr
            this.contracts = dataArr
          }
          data.contracts.forEach((contract) => {
            contract.address = contract.id
            contract.extrinsic.block_id = contract.extrinsic.block.height
          })
          this.totalRows = this.filter ? this.contracts.length : this.nContracts
          if (!this.forceLoad) this.loading = false
        }
      },
    },
    verifiedContracts: {
      query: gql`
        query verifiedContracts($limit: Int!, $contracts: [String!]) {
          verifiedContracts(limit: $limit, where: { id_in: $contracts }) {
            id
            name
            type
          }
        }
      `,
      variables() {
        const contracts = this.contracts.map((contract) => contract.address)
        return {
          limit: contracts.length,
          contracts,
        }
      },
      fetchPolicy: 'network-only',
      result({ data }) {
        data.verifiedContracts.forEach((verifiedContract) => {
          const contract = this.contracts.find(
            (contract) => contract.address === verifiedContract.id
          )
          contract.verified_contract = verifiedContract
        })
        // TODO: this is probably hacky
        if (data.verifiedContracts.length) {
          this.$forceUpdate()
        }
      },
    },
    totalContracts: {
      query: gql`
        query total {
          totalContracts: chainInfos(where: { id_eq: "contracts" }) {
            count
          }
        }
      `,
      fetchPolicy: 'network-only',
      result({ data }) {
        this.nContracts = data.totalContracts[0].count
        this.totalRows = this.nContracts
      },
    },
  },
}
</script>

<style lang="scss">
.contracts {
  .contracts__alert {
    margin-top: 20px;
    background: rgba(#d1ecf1, 0.85);
    border: none;

    .close {
      padding: 0;
      height: 45px;
      width: 55px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
}
</style>
