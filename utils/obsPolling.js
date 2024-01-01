const ObsPolling = {
  addCallback(obs$, callback) {
    obs$.subscribe((val) => {
      console.log(val) // todo anukul remove this later
      callback()
    })
  },
  removeCallback(obs$) {
    obs$.unsubscribe()
  },
}
export default ObsPolling
