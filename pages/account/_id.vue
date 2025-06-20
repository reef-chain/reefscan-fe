<template>
  <div>
    <section>
      <b-container class="account-page main py-5">
        <div v-if="loading" class="text-center py-4">
          <Loading />
        </div>
        <NotFound
          v-else-if="
            !parsedAccount || (parsedAccount && !parsedAccount.identity)
          "
          text="Accounts not valid"
        />
        <Card
          v-else-if="parsedAccount && parsedAccount.identity"
          class="account-details"
        >
          <div class="account-details__identicon">
            <ReefIdenticon
              :key="parsedAccount.address"
              :address="parsedAccount.address"
              :size="80"
            />
          </div>

          <Headline
            v-if="
              parsedAccount.identity.display &&
              parsedAccount.identity.display_parent
            "
          >
            {{ parsedAccount.identity.display_parent }} /
            {{ parsedAccount.identity.display }}
          </Headline>
          <Headline v-else-if="parsedAccount.identity.display">
            {{ parsedAccount.identity.display }}
          </Headline>
          <Headline v-else>
            {{ shortAddress(parsedAccount.address) }}
          </Headline>

          <Data>
            <Row>
              <Cell>Address</Cell>
              <Cell>
                <ReefIdenticon
                  :key="parsedAccount.address"
                  class="account-details__account-identicon"
                  :address="parsedAccount.address"
                  :size="20"
                />
                <span>{{ parsedAccount.address }}</span>
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.account.evm_address') }}</Cell>
              <Cell>
                <eth-identicon
                  v-if="parsedAccount.evm_address"
                  :address="parsedAccount.evm_address"
                  :size="20"
                />
                <span>{{
                  parsedAccount.evm_address
                    ? parsedAccount.evm_address
                    : 'Not connected'
                }}</span>
              </Cell>
            </Row>

            <Row v-if="parsedAccount.evm_nonce">
              <Cell>{{ $t('details.account.evm_nonce') }}</Cell>
              <Cell>
                <span>{{ parsedAccount.evm_nonce }}</span>
              </Cell>
            </Row>

            <Row v-if="parsedAccount.identity.display">
              <Cell>Identity::display</Cell>
              <Cell>
                <span
                  v-if="
                    parsedAccount.identity.display &&
                    parsedAccount.identity.display_parent
                  "
                >
                  {{ parsedAccount.identity.display_parent }} /
                  {{ parsedAccount.identity.display }}
                </span>
                <span v-else>
                  {{ parsedAccount.identity.display }}
                </span>
              </Cell>
            </Row>

            <Row v-if="parsedAccount.identity.email">
              <Cell>Identity::email</Cell>
              <Cell>
                {{ parsedAccount.identity.email }}
              </Cell>
            </Row>

            <Row v-if="parsedAccount.identity.legal">
              <Cell>Identity::legal</Cell>
              <Cell>
                {{ parsedAccount.identity.legal }}
              </Cell>
            </Row>

            <Row v-if="parsedAccount.identity.riot">
              <Cell>Identity::riot</Cell>
              <Cell>
                {{ parsedAccount.identity.riot }}
              </Cell>
            </Row>

            <Row v-if="parsedAccount.identity.web">
              <Cell>Identity::web</Cell>
              <Cell>
                {{ parsedAccount.identity.web }}
              </Cell>
            </Row>

            <Row v-if="parsedAccount.identity.twitter">
              <Cell>Identity::twitter</Cell>
              <Cell>
                {{
                  `https://twitter.com/${parsedAccount.identity.twitter.substr(
                    1,
                    parsedAccount.identity.twitter.length
                  )}`
                }}
              </Cell>
            </Row>

            <Row v-if="parsedAccount.identity.judgements">
              <Cell>Identity::judgements</Cell>
              <Cell>
                <span v-if="parsedAccount.identity.judgements.length > 0">
                  {{ parsedAccount.identity.judgements }}
                </span>
                <span> No </span>
              </Cell>
            </Row>

            <Row v-if="parsedAccount.nonce">
              <Cell>{{ $t('details.account.account_nonce') }}</Cell>
              <Cell>
                {{ parsedAccount.nonce }}
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.account.total_balance') }}</Cell>
              <Cell class="amount">
                {{ formatAmount(parsedAccount.free_balance) }}
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.account.available_balance') }}</Cell>
              <Cell class="amount">
                {{ formatAmount(parsedAccount.available_balance) }}
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.account.locked_balance') }}</Cell>
              <Cell class="amount">
                {{ formatAmount(parsedAccount.locked_balance) }}
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.account.reserved_balance') }}</Cell>
              <Cell class="amount">
                {{ formatAmount(parsedAccount.reserved_balance) }}
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.account.vested_balance') }}</Cell>
              <Cell class="amount">
                {{ formatAmount(parsedAccount.vested_balance) }}
              </Cell>
            </Row>

            <Row>
              <Cell>{{ $t('details.account.voting_balance') }}</Cell>
              <Cell class="amount">
                {{ formatAmount(parsedAccount.voting_balance) }}
              </Cell>
            </Row>
          </Data>

          <Tabs v-model="tab" :options="$options.tabs" />
          <AccountTransfers
            v-if="tab === 'transfers'"
            :account-id="accountId"
          />

          <AccountTokenBalances
            v-if="tab === 'tokens'"
            :account-id="accountId"
          />

          <AccountNFTs v-if="tab === 'nfts'" :account-id="accountId" />

          <Activity v-if="tab === 'activity'" :account-id="accountId" />
          <StakingRewards v-if="tab === 'rewards'" :account-id="accountId" />
        </Card>
      </b-container>
    </section>
  </div>
</template>
<script>
import { network as nw } from '@reef-chain/util-lib'
import ReefIdenticon from '@/components/ReefIdenticon.vue'
import Loading from '@/components/Loading.vue'
import commonMixin from '@/mixins/commonMixin.js'
import { network } from '@/frontend.config.js'
// import Activity from '@/components/Activity.vue'
import AccountTransfers from '@/components/AccountTransfers.vue'
// import StakingRewards from '@/components/StakingRewards.vue'
// import StakingSlashes from '@/components/StakingSlashes.vue'
// import AccountTokenBalances from '@/components/AccountTokenBalances.vue'
import axiosInstance from '~/utils/axios'
import ObsPolling from '~/utils/obsPolling'

export default {
  components: {
    ReefIdenticon,
    Loading,
    // Activity,
    AccountTransfers,
    // StakingRewards,
    // StakingSlashes,
    // AccountTokenBalances,
  },
  mixins: [commonMixin],
  middleware: ['account'],
  tabs: {
    transfers: 'Transfers',
    tokens: 'Tokens',
    nfts: 'NFTs',
    activity: 'Activity',
    rewards: 'Rewards',
    // slashes: 'Slashes',
  },
  data() {
    return {
      network,
      loading: true,
      accountId: this.$route.params.id,
      parsedAccount: undefined,
      transfers: [],
      tab: 'transfers',
      callbackId: null,
    }
  },
  watch: {
    $route() {
      this.accountId = this.$route.params.id
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
      const query = `
        query account($address: String!) {
          accounts(
            where: {
              OR: {
                id_containsInsensitive: $address
                OR: { evmAddress_containsInsensitive: $address }
              }
            }
            limit: 1
          ) {
            id
            freeBalance
            evmAddress
            lockedBalance
            availableBalance
            timestamp
            nonce
            identity
            evmNonce
            vestedBalance
            votingBalance
            reservedBalance
            block {
              height
            }
          }
        }
      `
      const variables = {
        address: this.accountId,
      }
      try {
        const response = await axiosInstance.post('', {
          query,
          variables,
        })
        const data = response.data.data
        if (data && data.accounts && data.accounts.length > 0) {
          this.parsedAccount = data.accounts[0]
          this.parsedAccount = {
            ...this.parsedAccount,
            address: this.parsedAccount.id,
            evm_address: this.parsedAccount.evmAddress,
            available_balance: this.parsedAccount.availableBalance,
            locked_balance: this.parsedAccount.lockedBalance,
            free_balance: this.parsedAccount.freeBalance,
            reserved_balance: this.parsedAccount.reservedBalance,
            vested_balance: this.parsedAccount.vestedBalance,
            voting_balance: this.parsedAccount.votingBalance,
            block_id: this.parsedAccount.block.height,
            identity: '{}',
          }
        } else if (this.accountId.length === 42) {
          this.$router.push({
            path: `/contract/${this.accountId}`,
          })
        }
        this.loading = false
      } catch (error) {}
    },
  },
}
</script>

<style lang="scss">
.account-details {
  .account-details__identicon {
    display: flex;
    justify-content: center;
    align-items: center;
    background: white;
    box-shadow: 0 0 10px -10px rgba(#0f233f, 0.5),
      0 5px 15px -5px rgba(#0f233f, 0.25);
    border-radius: 50%;
    height: 110px;
    width: 110px;
    margin: 0 auto 15px auto;
    overflow: hidden;
  }

  .account-details__account-identicon {
    display: flex !important;
  }

  .amount {
    .table-cell__content {
      font-weight: 600;
      background: linear-gradient(90deg, #a93185, #5531a9);
      //noinspection CssInvalidPropertyValue
      background-clip: text;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;

      @media not all and (min-resolution: 0.001dpcm) {
        @supports (-webkit-appearance: none) {
          display: inline-block !important;
        }
      }
    }
  }

  .tabs {
    margin: 25px 0;
  }
}
</style>
