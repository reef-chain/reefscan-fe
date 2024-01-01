import { network as nw, reefState } from '@reef-chain/util-lib'
import { network } from '~/frontend.config'

export default function () {
  reefState.setSelectedNetwork(
    nw.AVAILABLE_NETWORKS[network.name.toLowerCase()]
  )
}
