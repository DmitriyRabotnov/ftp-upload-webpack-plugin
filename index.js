const FtpNodeProxy = require('./FtpNodeProxy')

class FtpUploadPlugin {
  constructor(options) {
    this.options = options
  }
  apply(compiler) {
    compiler.plugin('environment', (compilation, callback) => {
      compiler.outputFileSystem = new FtpNodeProxy(this.options)
      callback !== void 0 && callback()
    })
  }
}

module.exports = FtpUploadPlugin
