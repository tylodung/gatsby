const path = require(`path`)
const {
  appendFileSync,
  readFileSync,
  renameSync,
  existsSync,
  unlinkSync,
} = require(`fs`)

module.exports = class Store {
  constructor(parentFolder) {
    this.parentFolder = parentFolder
    this.bufferFilePath = path.join(this.parentFolder, `events.json`)
  }

  appendToBuffer(event) {
    try {
      appendFileSync(this.bufferFilePath, event, `utf8`)
    } catch (e) {
      //ignore
    }
  }

  async startFlushEvents(flushOperation) {
    // TODO: Think about concurrent processes
    const now = Date.now()
    let success = false

    try {
      if (!existsSync(this.bufferFilePath)) {
        return
      }
      const newPath = `${this.bufferFilePath}-${now}`
      renameSync(this.bufferFilePath, newPath)
      const contents = readFileSync(newPath, `utf8`)
      unlinkSync(newPath)

      // There is still a chance process dies while sending data and some events are lost
      // This will be ok for now, however
      success = await flushOperation(contents)
    } catch (e) {
      // ignore
      // TODO: Log this event
    } finally {
      // if sending fails, we write the data back to the log
      if (!success) {
        this.appendToBuffer(contents)
      }
    }
  }
}
