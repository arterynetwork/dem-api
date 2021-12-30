const BLOCK_SIZE = 250 * 1024 - 40;
const MAX_BLOCK_SIZE = 500 * 1024 - 40;
const mime = require('mime-types');
const crypto = require('crypto');

const {
    isAndroid,
    isIOS,
    File,
} = require("@nativescript/core");

class EncodedFileNativescript {
    constructor(path, blockSize = BLOCK_SIZE) {
        this.path = path;
        this.opened = false;
        this.blockSize = blockSize;
        this.checksum = null;
        this.file = File.fromPath(path);

        if (blockSize === BLOCK_SIZE) {
            let fileSize = this.getSize();
            let blockSize = Math.ceil(fileSize / 50);

            if (blockSize < BLOCK_SIZE) {
                blockSize = BLOCK_SIZE;
            }

            if (blockSize > MAX_BLOCK_SIZE) {
                blockSize = MAX_BLOCK_SIZE;
            }

            this.blockSize = blockSize;
        }

        console.log('Selected block size', this.path, this.blockSize);
    }

    getSize() {
        return this.file.size;
    }

    getBlockSize() {
        return this.blockSize;
    }

    getHash() {
        return this.checksum.digest();
    }

    getHashHex() {
        return this.checksum.digest('hex');
    }

    getMimeType() {
        let mt = mime.lookup(this.path);
        if (!mt) {
            return 'application/octet-stream';
        }

        return mt;
    }

    countBlocks() {
        return Math.ceil(this.getSize() / this.blockSize);
    }

    async _processFileAsyncAndroid(blockCallback, copyPath = null) {
        const javaFile = new java.io.File(this.path);
        const stream = new java.io.FileInputStream(javaFile);
        const bytes = Array.create('byte', this.blockSize);

        let copyFile = null;
        let copyStream = null;

        if (copyPath) {
            copyFile = new java.io.File(copyPath);
            copyStream = new java.io.FileOutputStream(copyFile);
        }

        this.checksum = crypto.createHash('sha256');

        return new Promise((resolve, reject) => {
            const readNextChunk = async () => {
                try {
                    let bytesRead = stream.read(bytes);

                    if (bytesRead <= 0) {
                        stream.close();
                        if (copyStream) {
                            copyStream.close();
                        }
                        resolve();
                        return;
                    }

                    if (copyStream) {
                        copyStream.write(bytes, 0, bytesRead);
                    }

                    let buffer = null;

                    if (bytesRead === bytes.length) {
                        buffer = Buffer.from(bytes);
                    } else {
                        let newBytes = java.util.Arrays.copyOfRange(bytes, 0, bytesRead);
                        buffer = Buffer.from(newBytes);
                    }

                    this.checksum.update(buffer);

                    await blockCallback(buffer);

                    setTimeout(readNextChunk, 0);
                } catch (e) {
                    stream.close();
                    if (copyStream) {
                        copyStream.close();
                    }
                    reject(e);
                }
            };

            readNextChunk();
        });
    }

    async _processFileAsyncIOS(blockCallback, copyPath = null) {
        const stream = NSInputStream.inputStreamWithFileAtPath(this.path);
        let outputStream = null;
        if (copyPath) {
            outputStream = NSOutputStream.outputStreamToFileAtPathAppend(copyPath, false);
            outputStream.open();
        }
        stream.open();

        this.checksum = crypto.createHash('sha256');

        let arr = new ArrayBuffer(this.blockSize);

        return new Promise((resolve, reject) => {
            const readNextChunk = async () => {
                try {
                    let bytesRead = stream.readMaxLength(arr, this.blockSize);

                    if (bytesRead <= 0) {
                        stream.close();
                        if (outputStream) {
                            outputStream.close();
                        }
                        resolve();
                        return;
                    }

                    if (outputStream) {
                        outputStream.writeMaxLength(arr, bytesRead);
                    }

                    let buffer = null;

                    if (bytesRead === arr.length) {
                        buffer = Buffer.from(arr);
                    } else {
                        buffer = Buffer.from(arr.slice(0, bytesRead));
                    }

                    this.checksum.update(buffer);

                    await blockCallback(buffer);

                    setTimeout(readNextChunk, 0);
                } catch (e) {
                    stream.close();
                    if (outputStream) {
                        outputStream.close();
                    }
                    reject(e);
                }
            };

            readNextChunk();
        });
    }

    async processFileAsync(blockCallback, copyPath = null) {
        if (isIOS) {
            return this._processFileAsyncIOS(blockCallback, copyPath);
        }

        if (isAndroid) {
            return this._processFileAsyncAndroid(blockCallback, copyPath);
        }

        throw Error('Unsupported platform');
    }
}

module.exports = EncodedFileNativescript;
