# ftp-upload-webpack-plugin
webpack2 plugin that uploads bundles to a ftp server with config file with remote path

Structure of config file (e.g. ftp_account.js) is:
```
module.exports = {
    host: 'localhost', // - The hostname or IP address of the FTP server.
    port: 21,  // - The port of the FTP server
    secure: false, /* - Set to true for both control and data connection encryption, 'control' for control connection encryption only, or 'implicit' for implicitly encrypted control connection (this mode is deprecated in modern times, but usually uses port 990) */
    user: 'anonymous',
    pass: 'anonymous@',
    connTimeout: 10000, // - How long (in milliseconds) to wait for the control connection to be established
    pasvTimeout: 10000, // - How long (in milliseconds) to wait for a PASV data connection to be established
    keepalive: 10000, // - How often (in milliseconds) to send a 'dummy' (NOOP) command to keep the connection alive
    remotePath: '/' // - Remote path at the host
    debugInfo: false // - display debug info
}
```
### Usage:
in webpack.config.js:
```
const FtpUploadPlugin = require('ftp-upload-webpack-plugin')
const ftp_account = require('./ftp_account.js')
...
output: {
  path: path.join(__dirname, '/dist/')
...

plugins: [
...
    new FtpUploadPlugin(ftp_account)
...
```
this uploads all the files from '/dist' to [remotePath] of your ftp server [host]
##
