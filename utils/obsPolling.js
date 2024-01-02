const ObsPolling = {
  subscribers: [],
  callbacks: [],
  addCallback(obs$, callback) {
    const subscriber = obs$.subscribe((val) => {
      console.log(val) // todo anukul remove this later
      callback()
    })
    this.subscribers.push(subscriber)
    this.callbacks.push(callback)
  },
  removeCallback(callback) {
    const index = this.callbacks.indexOf(callback)
    if (index >= 0) {
      const subscriber = this.subscribers[index]
      subscriber.unsubscribe()
      this.subscribers.splice(index, 1)
      this.callbacks.splice(index, 1)
    }
  },
}

export default ObsPolling
