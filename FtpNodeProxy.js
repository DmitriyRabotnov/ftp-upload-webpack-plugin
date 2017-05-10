const FtpClient = require('ftp')
const path = require('path')
const chalk = require('chalk')
const Events = require('events')

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

    this.events = new Events()
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
      const fileName = path.basename(file)
      const newFileName = path.join(this.options.remotePath, fileName)

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
        resolve('ok')
      }

      this.ftpClient.put(data, newFileName, callBack.bind(this))
    })
  }

  async writeFile(file, data, options_, callback) {
    this.debugInfo &&
      console.log(chalk.yellow('\nftp-upload-plugin: trying to send a file: ' + file))

    if (typeof options_ === 'function') {
      callback = options_
      options_ = {}
    }
    if (!Buffer.isBuffer(data)) {
      data = Buffer.from(data, 'utf8')
    }

    this.events.on('complete', callback)

    const connect = await this.Connect()

    if (connect === 'ok') {
      const put = await this.Put(data, file)

      if (await this.Put(data, file) === 'ok') {
        this.ftpClient.end()
        this.debugInfo &&
          console.log(chalk.cyan('\nftp-upload-plugin: connection is closed'))
        this.events.emit('complete')
      } else {
        this.debugInfo &&
          console.log(chalk.red('\nftp-upload-plugin: something wrong: ' + put.message))
      }
    } else {
      this.debugInfo &&
        console.log(chalk.red('\nftp-upload-plugin: something wrong: ' + connect.message))
    }
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
