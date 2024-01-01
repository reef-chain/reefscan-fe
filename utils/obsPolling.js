const ObsPolling = {
  addCallback(obs$, callback) {
    obs$.subscribe((val) => callback())
  },
  removeCallback(obs$) {
    obs$.unsubscribe()
  },
}
export default ObsPolling
