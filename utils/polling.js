const BlockTimeout = {
  callbacks: [],
  timeoutId: null,
  addCallback(callback) {
    this.callbacks.push(callback)
    if (!this.timeoutId) {
      this.timeoutId = setTimeout(() => this.onTimeout(), 10000)
    }
  },
  removeCallback(callback) {
    const index = this.callbacks.indexOf(callback)
    if (index >= 0) {
      this.callbacks.splice(index, 1)
    }
    if (this.callbacks.length === 0 && this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  },
  onTimeout() {
    this.callbacks.forEach((callback) => callback())
    this.timeoutId = setTimeout(() => this.onTimeout(), 10000)
  },
}
export default BlockTimeout
