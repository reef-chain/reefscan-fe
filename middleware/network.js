import { network as nw, reefState } from '@reef-chain/util-lib'
import { network } from '~/frontend.config'

export default function () {
  let selectedNetwork
  reefState.selectedNetwork$.subscribe((val) => (selectedNetwork = val.name))
  if (!selectedNetwork) {
    reefState.setSelectedNetwork(
      nw.AVAILABLE_NETWORKS[network.name.toLowerCase()]
    )
  }
}
