<template>
  <div class="list-view contracts">
    <Search
      v-model="filter"
      :placeholder="$t('pages.contracts.search_placeholder')"
      :label="`${$t('pages.contracts.title')} ${formatNumber(totalRows)}`"
    >
      <template slot="bottom">
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
      </template>
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
      perPage: null,
      currentPage: 1,
      totalRows: 1,
      nContracts: 0,
    }
  },
  apollo: {
    $subscribe: {
      contracts: {
        query: gql`
          subscription contract(
            $where: ContractWhereInput!
            $perPage: Int!
            $offset: Int!
          ) {
            contracts(
              limit: $perPage
              offset: $offset
              where: $where
              orderBy: extrinsic_timestamp_DESC
            ) {
              id
              extrinsic {
                block {
                  height
                }
              }
              timestamp
            }
          }
        `,
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
            perPage: this.perPage,
            offset: (this.currentPage - 1) * this.perPage,
          }
          return newVar
        },
        result({ data }) {
          data.contracts.forEach((contract) => {
            contract.address = contract.id
            contract.extrinsic.block_id = contract.extrinsic.block.height
          })
          this.contracts = data.contracts
          this.totalRows = this.filter ? this.contracts.length : this.nContracts
          this.loading = false
        },
      },
      totalContracts: {
        query: gql`
          subscription total {
            chainInfos(where: { id_eq: "contracts" }) {
              count
            }
          }
        `,
        result({ data }) {
          this.nContracts = data.chainInfos[0].count
          this.totalRows = this.nContracts
        },
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
