const ObsPolling = {
  subscriber: undefined,
  addCallback(obs$, callback) {
    this.subscriber = obs$.subscribe((val) => {
      console.log(val) // todo anukul remove this later
      callback()
    })
  },
  removeCallback() {
    this.subscriber.unsubscribe()
  },
}

export default ObsPolling
