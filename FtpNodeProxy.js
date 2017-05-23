const FtpClient = require('ftp')
const path = require('path')
const chalk = require('chalk')
const EventEmitter = require('events')

class FtpNodeProxy {
  constructor(options) {
    this.inConnecting = false

    const {
      host = 'localhost',
      port = 21,
      secure = false,
      secureOptions = null,
      user = 'anonymous',
      pass = 'anonymous@',
      connTimeout = 10000,
      pasvTimeout = 10000,
      keepalive = 10000,
      remotePath = '/',
      debugInfo = false
    } = options

    this.debugInfo = debugInfo

    this.debugInfo &&
      console.log(chalk.green('\nftp-upload-plugin: debug info ON'))

    this.options = {
      remotePath
    }

    this.optionsClient = {
      host,
      port,
      secure,
      secureOptions,
      user,
      password: pass,
      connTimeout,
      pasvTimeout,
      keepalive,
      remotePath
    }

    this.ftpClient = new FtpClient()

    this.events = new EventEmitter()

    this.chain = Promise.resolve()

    this.totalCountFiles = 0
    this.processedFiles = 0
  }

  Connect() {
    return new Promise((resolve, reject) => {
      this.ftpClient.connected && resolve('ok')

      if (!this.inConnecting) {
        this.debugInfo &&
          console.log(chalk.yellow('\nftp-upload-plugin: trying to connect with options: ' + JSON.stringify(this.optionsClient, null, 4)))

        this.inConnecting = true

        this.ftpClient.connect(this.optionsClient)

        this.ftpClient.on('ready', () => {
          this.debugInfo &&
            console.log(chalk.green('\nftp-upload-plugin: have got "ready" event! - the connection is established'))

          resolve('ok')
        })
        this.ftpClient.on('error', (err) => reject(new Error(err)))
      } else {
        this.debugInfo &&
          console.log(chalk.gray('\nftp-upload-plugin: ...getting tried to connect still...'))
      }
    })
  }

  Put(data, file) {
    return new Promise((resolve, reject) => {
      const fileName = file.substring(path.dirname(file).length + 1)
      const newFileName = this.options.remotePath + '/' + fileName

      this.debugInfo &&
        console.log(chalk.gray('\nftp-upload-plugin: found that file name is: ' + fileName))

      this.debugInfo &&
        console.log(chalk.yellow('\nftp-upload-plugin: trying to put on ftp a file with the name: ' +
          newFileName + '...'))

      const callBack = function (err) {
        if (err) {
          this.debugInfo &&
            console.log(chalk.red('\nftp-upload-plugin: have got error: ' + JSON.stringify(err)))
          reject(new Error(err))
        }
        this.debugInfo &&
          console.log(chalk.green('\nftp-upload-plugin: it is OK!'))
        resolve()
      }
      this.ftpClient.put(data, newFileName, callBack.bind(this))
    })
  }

  _promiseChainWriteFile(file, data) {
    return this.chain
      .then(() => this.Connect())
      .then(() => this.Put(data, file))
      .then(() => {
        this.processedFiles++
        if (this.processedFiles >= this.totalCountFiles) {
          this.ftpClient.end()
          this.debugInfo &&
            console.log(chalk.cyan('\nftp-upload-plugin: connection is closed'))
          this.events.emit('complete')
        }
      })
      .catch((error) => {
        this.debugInfo &&
          console.log(chalk.red('\nftp-upload-plugin: something wrong: ' + error.message))
      })
  }

  async _asyncWriteFile(file, data) {
    try {
      await this.chain
      await this.Connect()
      await this.Put(data, file)

      this.processedFiles++
      if (this.processedFiles >= this.totalCountFiles) {
        this.ftpClient.end()
        this.debugInfo &&
          console.log(chalk.cyan('\nftp-upload-plugin: connection is closed'))
        this.events.emit('complete')
      }
    } catch (error) {
      this.debugInfo &&
        console.log(chalk.red('\nftp-upload-plugin: something wrong: ' + error.message))
    }
  }


  writeFile(file, data, _options, callback) {
    this.totalCountFiles++
    this.debugInfo &&
      console.log(chalk.yellow('\nftp-upload-plugin: trying to send a file: ' + file))

    if (typeof _options === 'function') {
      callback = _options
      _options = {}
    }
    if (!Buffer.isBuffer(data)) {
      data = Buffer.from(data, 'utf8')
    }

    this.events.on('complete', callback)

    this.chain = this._asyncWriteFile(file, data) // this._promiseChainWriteFile(file, data)  // 
  }

  mkdirp(path, callback) {
    this.debugInfo &&
      console.log(chalk.yellow('\nftp-upload-plugin: omitting mkdirp path=' + path))
    // this.Connect().then(() => this.ftpClient.mkdir(path, true, callback))
    callback()
  }

  mkdir(path, callback) {
    this.debugInfo &&
      console.log(chalk.yellow('\nftp-upload-plugin: omitting mkdir path=' + path))
    // this.Connect().then(() => this.ftpClient.mkdir(path, true, callback))
    callback()
  }

  rmdir(path, callback) {
    this.debugInfo &&
      console.log(chalk.yellow('\nftp-upload-plugin: omittingrmdir path=' + path))
    // this.Connect().then(() => this.ftpClient.rmdir(path, true, callback))
    callback()
  }

  unlink(path, callback) {
    this.debugInfo &&
      console.log(chalk.yellow('\nftp-upload-plugin: unlink path=' + path))
    // this.Connect().then(() => this.ftpClient.unlink(path, true, callback))
    callback()
  }
}

FtpNodeProxy.prototype.join = require('path.join')

module.exports = FtpNodeProxy
