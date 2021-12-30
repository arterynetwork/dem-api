const crypto = require('crypto');
// Authenticated crypto libraries
const salsa20 = require("@stablelib/salsa20");
const xchacha20 = require('@stablelib/xchacha20');
const secp256 = require('./SecpEncryption');

// CPRNG from OS
let randomBytes = null;

if (typeof TNS_ENV !== 'undefined') {
    randomBytes = require('nativescript-randombytes');
} else {
    randomBytes = require('randombytes');
}

// Block header constants
const HEADER_SIZE = 40;
const HEADER_VERSION = 0x01;

const BLOCK_TYPE_INDEX = 0x01;
const BLOCK_TYPE_DATA = 0x02;
const BLOCK_TYPE_CHAT_DATA = 0x03;
const BLOCK_TYPE_CHAT_CONTACTS = 0x04;

const BLOCK_ENCRYPTION_RAW = 0x00;
const BLOCK_ENCRYPTION_INTERNAL = 0x01;
const BLOCK_ENCRYPTION_SALSA20 = 0x02;
const BLOCK_ENCRYPTION_SECP256 = 0x03;
const BLOCK_ENCRYPTION_XCHACHA20 = 0x04;
const BLOCK_ENCRYPTION_SECP256_XCHACHA20 = 0x05;
const BLOCK_ENCRYPTION_SECP256_XCHACHA20POLY1305_AEAD = 0x06;

/**
 * Implements block structure, encryption and etc.
 */
class StorageBlock {
    constructor() {
        this.data = null;
        this.headerVersion = HEADER_VERSION;
        this.headerSize = HEADER_SIZE;
        this.headerBlockType = BLOCK_TYPE_INDEX;
        this.headerEncryption = BLOCK_ENCRYPTION_RAW;
        this.headerSign = null;
        this.dataEncrypted = false;
        this.encryptedData = null;
    }

    /**
     * Set block payload
     * @param buffer {Buffer} payload
     * @param checksum {Boolean} calculate checksum or not
     */
    setData(buffer, checksum = false) {
        this.data = Buffer.from(buffer);
        if (checksum) {
            this.calcSign();
        }
    }

    /**
     * Validate checksum
     * @returns {boolean}
     */
    isSignValid() {
        return this.headerSign.equals(crypto.createHash('sha256').update(this.data).digest());
    }

    /**
     * Get block payload
     * @returns {Buffer|null}
     */
    getData() {
        return this.data ? Buffer.from(this.data) : null;
    }

    /**
     * Create new buffer with full block data
     * @returns {Buffer}
     */
    toBuffer() {
        let size = this.headerSize
            + (this.data ? this.data.length : 0);
        let buf = new Buffer.alloc(size);

        buf.writeInt8(this.headerVersion, 0);
        buf.writeInt8(this.headerBlockType, 1);
        buf.writeInt8(this.headerEncryption, 2);
        buf.writeUInt32BE(this.data ? this.data.length : 0, 3);
        if (this.headerSign) {
            this.headerSign.copy(buf, 7);
        }

        if (this.data) {
            this.data.copy(buf, HEADER_SIZE);
        }

        return buf;
    }

    /**
     * Get block data as base64 encoded string
     * @returns {string}
     */
    toBase64() {
        return this.toBuffer().toString('base64');
    }

    /**
     * Simple test encryption
     * @param key
     * @param hashKey
     * @param nonce
     */
    encryptInternal(key, hashKey = false, nonce = []) {
        this.xorSalsa20(key, hashKey, nonce);
        this.headerEncryption = BLOCK_ENCRYPTION_INTERNAL;
    }

    decryptInternal(key, hashKey = false, nonce = []) {
        this.xorSalsa20(key, hashKey, nonce);
    }

    /**
     * Encrypt block payload with Salsa20 and key
     * @param key {any} key to use
     * @param hashKey {boolean} use sha256 sum instead of raw key
     * @param nonce {Uint8Array} nonce to use
     */
    xorSalsa20(key, hashKey = false, nonce = []) {
        this.headerEncryption = BLOCK_ENCRYPTION_SALSA20;

        if (hashKey) {
            key = crypto.createHash('sha256').update(key).digest();
        }

        if (!nonce || !nonce.length) {
            throw Error('nonce is required');
        }

        const message = new Uint8Array(this.data);
        const result = salsa20.streamXOR(key, nonce, message, message);
        this.data = Buffer.from(result);
    }

    /**
     * Encrypt block data using Salsa20
     * @param key
     * @param hashKey
     * @param nonce
     */
    encryptSalsa20(key, hashKey = false, nonce = []) {
        return this.xorSalsa20(key, hashKey, nonce);
    }

    decryptSalsa20(key, hashKey = false, nonce = []) {
        return this.xorSalsa20(key, hashKey, nonce);
    }

    /**
     * Encrypt using XChaCha20
     * @param key {any} key to use
     * @param hashKey {boolean} use key hash (sha256)
     * @param nonce {Uint8Array|Buffer} nonce to use
     */
    xorXChaCha20(key, hashKey = false, nonce = []) {
        if (hashKey) {
            key = crypto.createHash('sha256').update(key).digest();
        }

        if (!nonce || !nonce.length) {
            throw Error('Nonce is required');
        }

        const message = new Uint8Array(this.data);
        this.data = Buffer.from(xchacha20.streamXOR(key, nonce, message, message));
    }

    /**
     * Encrypt using elliptic curve secp256k1
     * @param key
     */
    encryptSecp256(key) {
        let length = 16 + randomBytes(1).readUInt8(0) % 16;
        this.data = Buffer.from(secp256.encodeBuffer(key, [length, ...randomBytes(length), ...this.data]), 'base64');
        this.headerEncryption = BLOCK_ENCRYPTION_SECP256;
    }

    decryptSecp256(key) {
        let result = Buffer.from(secp256.decodeBuffer(key, this.data.toString('base64')));
        let length = result.readUInt8(0);
        this.data = result.slice(length + 1);
    }

    /**
     * Encrypt using combination of symmetric XChaCha20 (for payload) and asymmetric
     * elliptic curve (to store keys and etc.) algorithms
     * @param key {PublickKey} public secp256k1 key to use
     */
    encryptSecp256XChaCha20(key) {
        let saltLength = 16 + randomBytes(1).readUInt8(0) % 16;
        let saltBytes = randomBytes(saltLength);
        let xchacha20key = randomBytes(32);
        let nonce = randomBytes(24);
        // data
        let dataWithSalt = Buffer.alloc(this.data.length + saltLength);
        saltBytes.copy(dataWithSalt, 0);
        this.data.copy(dataWithSalt, saltBytes.length);
        xchacha20.streamXOR(xchacha20key, nonce, dataWithSalt, dataWithSalt);
        // params
        let encryptionParams = Buffer.alloc(1 + saltLength + xchacha20key.length + nonce.length);
        encryptionParams.writeUInt8(saltLength, 0);
        saltBytes.copy(encryptionParams, 1);
        xchacha20key.copy(encryptionParams, saltLength + 1);
        nonce.copy(encryptionParams, saltLength + 1 + xchacha20key.length);
        let encodedParams = Buffer.from(secp256.encodeBuffer(key, [...encryptionParams]), 'base64');
        // overall data block
        this.data = Buffer.alloc(2 + encodedParams.length + dataWithSalt.length);
        this.data.writeUInt16BE(encodedParams.length);
        encodedParams.copy(this.data, 2);
        dataWithSalt.copy(this.data, 2 + encodedParams.length);
        this.headerEncryption = BLOCK_ENCRYPTION_SECP256_XCHACHA20;
    }

    decryptSecp256XChaCha20(key) {
        let paramsLength = this.data.readUInt16BE(0);
        console.log(paramsLength);
        console.log(this.data.slice(2, paramsLength + 2).toString('base64'));
        let decodedParams = Buffer.from(secp256.decodeBuffer(key, this.data.slice(2, paramsLength + 2).toString('base64')));
        let saltLength = decodedParams.readUInt8(0);
        let xchacha20key = decodedParams.slice(1 + saltLength, 1 + saltLength + 32);
        let nonce = decodedParams.slice(1 + saltLength + 32, 1 + saltLength + 32 + 24);
        let chipertext = this.data.slice(paramsLength + 2);
        this.data = Buffer.from(xchacha20.streamXOR(xchacha20key, nonce, chipertext, chipertext).slice(saltLength));
    }

    /**
     * Decode chipertext using appropriate algo
     * @param key
     * @param hashKey
     * @param nonce
     * @returns {null|void}
     */
    decrypt(key, hashKey = false, nonce = []) {

        if (this.headerEncryption === BLOCK_ENCRYPTION_SALSA20) {
            return this.xorSalsa20(key, hashKey, nonce);
        }

        if (this.headerEncryption === BLOCK_ENCRYPTION_INTERNAL) {
            return this.decryptInternal(key, hashKey, nonce);
        }

        if (this.headerEncryption === BLOCK_ENCRYPTION_XCHACHA20) {
            return this.xorXChaCha20(key, hashKey, nonce);
        }

        if (this.headerEncryption === BLOCK_ENCRYPTION_SECP256) {
            return this.decryptSecp256(key);
        }

        if (this.headerEncryption === BLOCK_ENCRYPTION_SECP256_XCHACHA20) {
            return this.decryptSecp256XChaCha20(key);
        }

        if (this.headerEncryption === BLOCK_ENCRYPTION_RAW) {
            return null;
        }

        throw Error('Encryption method not implemented');
    }

    /**
     * Encode payload with method
     * @param method {int} encryption method
     * @param key {any} key to use
     * @param hashKey {boolean} hash key before encryption
     * @param nonce {Uint8Array|Buffer} nonce to use
     */
    encrypt(method, key, hashKey = false, nonce = []) {
        if (method === BLOCK_ENCRYPTION_INTERNAL) {
            this.encryptInternal(key, hashKey, nonce);
        }

        if (method === BLOCK_ENCRYPTION_SALSA20) {
            this.xorSalsa20(key, hashKey, nonce);
        }

        if (method === BLOCK_ENCRYPTION_XCHACHA20) {
            this.xorXChaCha20(key, hashKey, nonce);
        }

        if (method === BLOCK_ENCRYPTION_SECP256) {
            this.encryptSecp256(key);
        }

        if (method === BLOCK_ENCRYPTION_SECP256_XCHACHA20) {
            this.encryptSecp256XChaCha20(key);
        }
    }

    /**
     * Load block data from buffer
     * @param buffer
     */
    loadFromBuffer(buffer) {
        this.headerVersion = buffer.readInt8(0);
        this.headerBlockType = buffer.readInt8(1);
        this.headerEncryption = buffer.readInt8(2);
        let length = buffer.readUInt32BE(3);
        if (length > 0) {
            this.headerSign = Buffer.alloc(32);
            buffer.copy(this.headerSign, 0, 7, 39);
            this.data = Buffer.alloc(length);
            buffer.copy(this.data, 0, HEADER_SIZE);
        }
    }

    /**
     * Get checksum
     * @returns {Buffer}
     */
    getSign() {
        return this.headerSign;
    }

    /**
     * Load block header and payload from base64 encoded string
     * @param base64String
     */
    loadFromBase64(base64String) {
        let buf = Buffer.from(base64String, 'base64');
        this.loadFromBuffer(buf);
    }

    /**
     * Calculate checksum
     */
    calcSign() {
        this.headerSign = crypto.createHash('sha256').update(this.data).digest();
    }
}

/**
 * Create block from base64 encoded data
 * @param base64String {string}
 * @returns {StorageBlock}
 */
StorageBlock.fromBase64 = (base64String) => {
    let block = new StorageBlock();
    block.loadFromBase64(base64String);
    return block;
};

/**
 * Create new block with payload
 * @param data {Buffer}
 * @returns {StorageBlock}
 */
StorageBlock.fromData = (data) => {
    let block = new StorageBlock();
    block.setData(data, true);
    return block;
};

module.exports = StorageBlock;

module.exports.BLOCK_TYPE_INDEX = BLOCK_TYPE_INDEX;
module.exports.BLOCK_TYPE_DATA = BLOCK_TYPE_DATA;
module.exports.BLOCK_TYPE_CHAT_DATA = BLOCK_TYPE_CHAT_DATA;
module.exports.BLOCK_TYPE_CHAT_CONTACTS = BLOCK_TYPE_CHAT_CONTACTS;
module.exports.BLOCK_ENCRYPTION_RAW = BLOCK_ENCRYPTION_RAW;
module.exports.BLOCK_ENCRYPTION_INTERNAL = BLOCK_ENCRYPTION_INTERNAL;
module.exports.BLOCK_ENCRYPTION_SALSA20 = BLOCK_ENCRYPTION_SALSA20;
module.exports.BLOCK_ENCRYPTION_SECP256 = BLOCK_ENCRYPTION_SECP256;
module.exports.BLOCK_ENCRYPTION_XCHACHA20 = BLOCK_ENCRYPTION_XCHACHA20;
module.exports.BLOCK_ENCRYPTION_SECP256_XCHACHA20 = BLOCK_ENCRYPTION_SECP256_XCHACHA20;
module.exports.BLOCK_ENCRYPTION_SECP256_XCHACHA20POLY1305_AEAD = BLOCK_ENCRYPTION_SECP256_XCHACHA20POLY1305_AEAD;
