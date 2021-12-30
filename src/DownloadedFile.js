const crypto = require('crypto');
let core = {};

if (typeof TNS_ENV !== 'undefined') {
    core = require("@nativescript/core");
}

class DownloadedFile {
    constructor(filename) {
        this.filename = filename;
        this.checksum = crypto.createHash('sha256');
        if (core.isAndroid) {
            this.javaFile = new java.io.File(filename);
            this.javaStream = new java.io.FileOutputStream(this.javaFile);
        }

        if (core.isIOS) {
            try {
                this.iosStream = NSOutputStream.outputStreamToFileAtPathAppend(filename, false);
                this.iosStream.open();
            } catch (e) {
                console.error('!!!! error ', e);
            }
        }
    }

    _write(data) {
        if (this.loadedSize + data.length > this.data.length) {
            let newBuf = Buffer.allocUnsafe(this.loadedSize + data.length);
            this.data.copy(newBuf);
            this.data = newBuf;
        }

        data.copy(this.data, this.loadedSize);
        this.loadedSize += data.length;
    }

    _atob(encodedString) {
        let atob = null;

        if (core.isAndroid) {
            atob = android.util.Base64.decode(encodedString, android.util.Base64.NO_WRAP);
        } else if (core.isIOS) {
            try {
                let clean = encodedString.replace(/[\r\n]+/g, '');
                atob = NSData.alloc().initWithBase64EncodedStringOptions(clean, 0);
            } catch (e) {
                console.log(e);
            }
        } else {
            atob = Buffer.from(encodedString, 'base64');
        }
        return atob;
    }

    _writeAndroid(data) {
        this.javaStream.write(this._atob(data));
    }

    addBlock(data) {
        if (core.isAndroid) {
            this._writeAndroid(data);
        }

        if (core.isIOS) {
            try {
                let dataToWrite = this._atob(data);
                this.iosStream.writeMaxLength(dataToWrite.bytes, dataToWrite.length);
            } catch (e) {
                console.error('Write file error', e);
                throw e;
            }
        }

        this.checksum.update(data);
    }

    toArrayBuffer(buf) {
        var ab = new ArrayBuffer(buf.length);
        var view = new Uint8Array(ab);
        for (var i = 0; i < buf.length; ++i) {
            view[i] = buf[i];
        }
        return ab;
    }

    save() {
        if (core.isAndroid) {
            this.javaStream.close();
        }

        if (core.isIOS) {
            this.iosStream.close();
        }
    }
}

module.exports = DownloadedFile;