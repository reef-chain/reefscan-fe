import { toChecksumAddress } from 'web3-utils'
import axiosInstance from '~/utils/axios'
export default async function ({ app, route, store, redirect }) {
  const id = route.params.id

  const checkAddress = () => {
    let check
    try {
      check = toChecksumAddress(id)
    } catch {
      return false
    }

    return check
  }

  if (id.match(/0x*/)) {
    const query = `
      query account {
        accounts(where: {evmAddress_eq: "${checkAddress()}"}) {
          id
        }
      }
    `
    const response = (await axiosInstance.post('', { query })).data
    if (response.data.accounts.length > 0) {
      const accountId = response.data.account[0].id
      if (accountId) {
        redirect(`/account/${accountId}`)
      } else {
        return false
      }
    } else {
      return false
    }
  }
  return route
}
