const fs = require('fs');
const BLOCK_SIZE = 50 * 1024 - 40;
const MAX_BLOCK_SIZE = 500 * 1024 - 40;
const mime = require('mime-types');
const crypto = require('crypto');

class EncodedFile {
    constructor(path, blockSize = BLOCK_SIZE) {
        this.path = path;
        this.opened = false;
        this.blockSize = blockSize;
        this.checksum = null;

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
    }

    getSize() {
        let stat = fs.statSync(this.path);
        return stat.size;
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
        return Math.ceil(this.getSize() / this.getBlockSize());
    }

    async processFileAsync(blockCallback) {
        this.checksum = crypto.createHash('sha256');
        return new Promise(resolve => {
            let buffer = Buffer.alloc(this.blockSize);
            fs.open(this.path, 'r', (err, fd) => {
                if (err) throw err;
                const readNextChunk = async () => {
                    fs.read(fd, buffer, 0, this.blockSize, null, async (err, nread) => {
                        if (err) throw err;

                        if (nread === 0) {
                            fs.close(fd, (err) => {
                                if (err) throw err;

                                resolve();
                            });
                            return;
                        }

                        var data;
                        if (nread < this.blockSize)
                            data = buffer.slice(0, nread);
                        else
                            data = buffer;

                        this.checksum.update(buffer);

                        await blockCallback(data);

                        console.log('Chunk read');
                        setTimeout(readNextChunk, 0);
                    });
                };
                readNextChunk();
            });
        });
    }
}

module.exports = EncodedFile;
