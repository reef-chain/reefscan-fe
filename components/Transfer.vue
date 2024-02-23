<template>
  <Card v-if="transfer" class="list-view transfer-details">
    <Headline> Transfer {{ shortHash($route.params.hash) }} </Headline>
    <div v-if="transfer.isNft" class="nft-icon">
      <img
        v-if="nftUrl && !isVideo"
        :src="`${nftUrl}`"
        style="width: 30%; height: 30%"
      />
      <video
        v-else-if="nftUrl && isVideo"
        controls
        style="width: 30%; height: auto; border-radius: 20px"
      >
        <source :src="`${nftUrl}`" type="video/mp4" />
      </video>
      <div v-else>
        <div class="loading text-center">
          <div></div>
          <div></div>
        </div>
      </div>
    </div>

    <Data>
      <Row>
        <Cell>Block number</Cell>
        <Cell
          ><nuxt-link :to="`/block?blockNumber=${transfer.block_id}`">
            # {{ formatNumber(transfer.block_id) }}
          </nuxt-link>
        </Cell>
      </Row>

      <Row>
        <Cell>Age</Cell>
        <Cell>
          {{ fromNow(transfer.timestamp) }}
          ({{ formatTimestamp(transfer.timestamp) }})
        </Cell>
      </Row>

      <Row>
        <Cell>Extrinsic</Cell>
        <Cell>
          <nuxt-link
            :to="`/extrinsic/${transfer.block_id}/${transfer.extrinsic.index}`"
            title="Check extrinsic information"
          >
            # {{ formatNumber(transfer.block_id) }}-{{
              transfer.extrinsic.index
            }}
          </nuxt-link>
        </Cell>
      </Row>

      <Row>
        <Cell>Hash</Cell>
        <Cell>{{ transfer.extrinsic.hash }}</Cell>
      </Row>

      <Row class="transfer-details__from">
        <Cell>From</Cell>
        <Cell>
          <div v-if="transfer.from_address">
            <ReefIdenticon
              :key="transfer.from_address"
              :address="transfer.from_address"
              :size="20"
            />
            <nuxt-link :to="`/account/${transfer.from_address}`">
              {{ transfer.from_address }}
            </nuxt-link>
          </div>
        </Cell>
      </Row>

      <Row class="transfer-details__to">
        <Cell>To</Cell>
        <Cell>
          <div v-if="transfer.to_address">
            <ReefIdenticon
              :key="transfer.to_address"
              :address="transfer.to_address"
              :size="20"
            />
            <nuxt-link :to="`/account/${transfer.to_address}`">
              {{ transfer.to_address }}
            </nuxt-link>
          </div>
        </Cell>
      </Row>

      <Row class="transfer-details__deamon">
        <Cell>Token name</Cell>
        <Cell v-if="!transfer.isNft">
          <div v-if="transfer.denom && transfer.token_address">
            <nuxt-link :to="`/token/${transfer.token_address}`">
              {{ transfer.tokenName || transfer.denom }}
            </nuxt-link>
          </div>
        </Cell>
        <Cell>
          {{ nftName }}
        </Cell>
      </Row>

      <Row class="transfer-details__token_address">
        <Cell>Token address</Cell>
        <Cell>
          <div v-if="transfer.token_address">
            <eth-identicon :address="transfer.token_address" :size="20" />
            <nuxt-link :to="`/token/${transfer.token_address}`">
              {{ transfer.token_address }}
            </nuxt-link>
          </div>
        </Cell>
      </Row>

      <Row class="transfer-details__amount">
        <Cell>Amount</Cell>
        <Cell>{{
          transfer.isNft
            ? formatNftTransfer(transfer.amount)
            : formatAmount(transfer.amount, transfer.symbol, transfer.decimals)
        }}</Cell>
      </Row>

      <Row class="transfer-details__fee">
        <Cell>Fee</Cell>
        <Cell>
          {{ formatAmount(transfer.fee_amount) }}
        </Cell>
      </Row>

      <Row>
        <Cell>Status</Cell>
        <Cell>
          <font-awesome-icon
            v-if="transfer.success"
            icon="check"
            class="text-success"
          />
          <font-awesome-icon v-else icon="times" class="text-danger" />
        </Cell>
      </Row>

      <template v-if="transfer.extrinsic && !!transfer.extrinsic.error_message">
        <Row>
          <Cell>Error Description</Cell>
          <Cell>
            {{ transfer.extrinsic.error_message }}
          </Cell>
        </Row>
      </template>
    </Data>
  </Card>
</template>

<script>
import { ethers } from 'ethers'
import { Provider } from '@reef-defi/evm-provider'
import { WsProvider } from '@polkadot/api'
import { toChecksumAddress } from 'web3-utils'
import axios from 'axios'
import commonMixin from '@/mixins/commonMixin.js'
import { network } from '~/frontend.config'
import axiosInstance from '~/utils/axios'

const extractIpfsHash = (ipfsUri) => {
  const ipfsProtocol = 'ipfs://'
  if (ipfsUri?.startsWith(ipfsProtocol)) {
    return ipfsUri.substring(ipfsProtocol.length)
  }
  return null
}

const toIpfsProviderUrl = (ipfsUriStr) => {
  const ipfsHash = extractIpfsHash(ipfsUriStr)
  if (ipfsHash) {
    return `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`
  }
  return null
}

const resolveUriToUrl = (uri, nftId) => {
  const ipfsUrl = toIpfsProviderUrl(uri)
  if (ipfsUrl) {
    return ipfsUrl
  }

  const idPlaceholder = '{id}'
  if (nftId != null && uri.includes(idPlaceholder) > -1) {
    let replaceValue = nftId
    try {
      replaceValue = parseInt(nftId, 10).toString(16).padStart(64, '0')
    } catch (e) {}
    return uri.replace(idPlaceholder, replaceValue)
  }
  return uri
}

const resolveImageData = (metadata, nft, ipfsUrlResolver) => {
  const imageUriVal = metadata?.image ? metadata.image : metadata.toString()
  return {
    iconUrl: resolveUriToUrl(imageUriVal, nft, ipfsUrlResolver),
    name: metadata.name,
    mimetype: metadata.mimetype,
  }
}

export default {
  components: {},
  mixins: [commonMixin],
  props: {
    transfer: {
      type: Object,
      default: () => undefined,
    },
  },
  data() {
    return {
      nftUrl: null,
      isVideo: false,
      nftName: '',
    }
  },
  created() {
    this.updateData()
  },
  methods: {
    toChecksumAddress(address) {
      return toChecksumAddress(address)
    },
    async updateData() {
      const VERIFIED_CONTRACTS_QUERY = `
        query verified_contract($address: String!) {
          verifiedContracts(
            where: { id_containsInsensitive: $address }
            limit: 1
          ) {
            name
            contractData
            compiledData
          }
        }
      `
      try {
        const response = await axiosInstance.post('', {
          query: VERIFIED_CONTRACTS_QUERY,
          variables: {
            address: this.transfer.token_address,
          },
        })
        const data = response.data.data
        if (data.verifiedContracts[0]) {
          this.verified = data.verifiedContracts[0]
          this.verified.compiled_data = this.verified.compiledData
          this.verified.abi =
            this.verified.compiled_data &&
            this.verified.compiled_data[this.verified.name]
              ? this.verified.compiled_data[this.verified.name]
              : []
          const provider = new Provider({
            provider: new WsProvider(network.nodeWs),
          })
          await provider.api.isReady
          this.provider = provider
          const contractInstance = new ethers.Contract(
            this.transfer.token_address,
            this.verified.abi,
            provider
          )
          if (this.transfer.isNft) {
            const urlPromise = this.verified.abi.some((fn) => fn.name === 'uri')
              ? contractInstance.uri(this.transfer.nftId)
              : contractInstance.tokenURI(this.transfer.nftId)
            const nftDetails = await urlPromise
              .then((metadataUri) => {
                if (metadataUri.startsWith('http')) {
                  this.nftUrl = metadataUri
                } else {
                  const ipfsHash = extractIpfsHash(metadataUri)
                  this.nftUrl = `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`
                }
                return resolveUriToUrl(metadataUri, this.transfer.nftId)
              })
              .then(axios.get)
              .then((jsonStr) =>
                resolveImageData(jsonStr.data, this.transfer.nftId)
              )
              .then((nftUri) => nftUri)
            try {
              this.nftUrl = nftDetails.iconUrl.startsWith('http')
                ? nftDetails.iconUrl
                : this.nftUrl
              this.isVideo = nftDetails.mimetype.includes('video')
              this.nftName = nftDetails.name
            } catch (error) {}
          }
        }
      } catch (error) {}
    },
  },
}
</script>

<style lang="scss">
.nft-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
  img {
    border-radius: 10px;
  }
}

.transfer-details {
  .transfer-details__from,
  .transfer-details__to {
    .table-cell__content {
      > div {
        display: flex;
        justify-content: flex-start;
        align-items: center;

        a {
          background: linear-gradient(90deg, #a93185, #5531a9);
          //noinspection CssInvalidPropertyValue
          background-clip: text;
          -webkit-text-fill-color: transparent;
          position: relative;

          &::after {
            content: '';
            position: absolute;
            bottom: 0;
            width: 100%;
            height: 1px;
            left: 0;
            right: 0;
            margin: 0 auto;
            opacity: 0;
            transform: translateY(3px);
            background: linear-gradient(90deg, #a93185, #5531a9);
            transition: all 0.15s;
          }

          &:hover {
            &::after {
              opacity: 1;
              transform: none;
            }
          }
        }
      }
    }
  }

  .transfer-details__amount,
  .transfer-details__fee {
    .table-cell__content {
      font-weight: 600;
    }
  }
}
</style>
