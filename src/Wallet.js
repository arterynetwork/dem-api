"use strict";

const mnemonicLib = require('bitcore-mnemonic');
const bitcore = require('bitcore-lib');
const _ = require('lodash');
const ArteryNetwork = require('./artery/network');
const signer = require('./signer');
require('./artery/address');

bitcore.Networks.add(ArteryNetwork);


/**
 * Sort keys of json object alphabetically (recursive)
 * @param value {object} object to canonize
 * @returns {null|object}
 */
const toCanonicalJSON = (value) => {
    if (Array.isArray(value)) {
        return value.map(toCanonicalJSON);
    }

    if (_.isObject(value)) {
        const sorted = {};
        const keys = Object.keys(value).sort();

        for (const key of keys) {
            sorted[key] = toCanonicalJSON(value[key]);
        }

        return sorted;
    }

    return (value === undefined) ? null : value;
};


/**
 * Contains methods to sign and validate signatures of JSON objects and raw bytes
 * @property {string} publicKeyHex wallet's public key as a hex string
 * @property {PrivateKey} privateKey secp256k1 private key
 * @property {PublicKey} publicKey secp256k1 public key
 * @property {string} address bech32 signer's address
 * @property {string} chainId current chain id
 * @property {number} accNo account number in blockchain
 * @property {number} sequence current account sequence number
 */
class Wallet {
    /**
     * Initialize wallet from private key or mnemonic (seed-phrase)
     * @param {string|null} mnemonic seed-phrase (omit if keyString specified)
     * @param {string|null} keyString private key in hex format (omit if mnemonic specified)
     */
    constructor(mnemonic = null, keyString = null) {

        if (mnemonic) {
            this.hdPrivKey = (new mnemonicLib(mnemonic))
                .toHDPrivateKey()
                .deriveChild(ArteryNetwork.hdPath);

            this.privateKey = this.hdPrivKey.privateKey;
        }

        if (keyString) {
            this.privateKey = bitcore.PrivateKey.fromString(keyString);
        }

        if (!this.privateKey) {
            throw Error('Couldn\'t create wallet: no mnemonic or keyString provided');
        }

        this.publicKey = this.privateKey.toPublicKey();
        this.publicKeyHex = Buffer.from(this.publicKey.toBuffer()).toString('hex');

        this.address = (new bitcore.Address(
                this.publicKey,
                'artery',
                bitcore.Address.PayToWitnessPublicKeyHash)
        ).toString();

        this.accNo = 0;
        this.sequence = 0;
        this.chainId = '';
    }

    /**
     * Sign json synchronously
     * @param object {object} object to sign
     * @returns {Buffer|string}
     */
    signJsonSync(object) {
        let canonicalObject = toCanonicalJSON(object);
        let bytes = Buffer.from(JSON.stringify(canonicalObject));
        return signer.$parts.signRawBytes(this.privateKey, bytes);
    }

    /**
     * Sign json asynchronously
     * @param object {object} object to sign
     * @returns {Promise<Buffer>|Promise<string>}
     */
    async signJson(object) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.signJsonSync(object));
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Verify JSON object signature
     * @param object {object} JSON object
     * @param signature {Buffer} signature
     * @returns {boolean}
     */
    verifyJsonSync(object, signature) {
        let canonicalObject = toCanonicalJSON(object);
        let bytes = Buffer.from(JSON.stringify(canonicalObject));
        return signer.$parts.verifyRawBytesSignature(this.publicKey, bytes, signature);
    }

    /**
     * Verify JSON object signature asynchronously
     * @param object {object} JSON object
     * @param signature {Buffer} signature
     * @return {Promise<boolean>}
     */
    async verifyJson(object, signature) {
        return new Promise((resolve, reject) => {
            try {
                resolve(this.verifyJsonSync(object, signature));
            } catch (e) {
                reject(e);
            }
        });
    }

    /**
     * Set current account number
     * @param accNo {number}
     */
    setAccNo(accNo) {
        this.accNo = accNo;
    }

    /**
     * Set current account sequence
     * @param sequence {number}
     */
    setSequence(sequence) {
        this.sequence = sequence;
    }

    /**
     * Set current chain ID
     * @param chainId {string}
     */
    setChainId(chainId) {
        this.chainId = chainId;
    }

    _getSigner() {
        return {
            accNo: _.toString(this.accNo),
            seqNo: _.toString(this.sequence),
            chainId: this.chainId,
            privKey: this.privateKey
        };
    }

    /**
     * Generates and signs bank/MsgSend transaction
     *
     * @param {string} to - receiver SDK account address;
     * @param {string} amount - sent μARTRs amount (without denom, number only);
     * @param {string?} [memo=''] - TX memo;
     * @param {string?} [gas='5000000'] - TX gas limit;
     * @param {string?} [toh='0'] - timeout height;
     * @returns {Uint8Array} - signed TX, ready to be sent.
     */
    send(to, amount, memo = '', gas = '5000000', toh = '0') {
        return signer.send(this._getSigner(), this.address, to, _.toString('amount'), gas, memo, toh);
    }

    /**
     * Generates and signs delegating/MsgDelegate transaction
     *
     * @param {string} amount - delegated μARTRs amount (without denom, number only);
     * @param {string?} [memo=''] - TX memo;
     * @param {string?} [gas='31000000'] - TX gas limit;
     * @param {string?} [toh='0'] - timeout height;
     * @returns {Uint8Array} - signed TX, ready to be sent.
     */
    delegate(amount, memo = '', gas = '31000000', toh = '0') {
        return signer.delegate(this._getSigner(), this.address, _.toString(amount), gas, memo, toh);
    }

    /**
     * Generates and signs delegating/MsgRevoke transaction
     *
     * @param {string} amount - undelegated μARTRs amount (without denom, number only);
     * @param {string?} [memo=''] - TX memo;
     * @param {string?} [gas='5000000'] - TX gas limit;
     * @param {string?} [toh='0'] - timeout height;
     * @returns {Uint8Array} - signed TX, ready to be sent.
     */
    revoke(amount, memo = '', gas = '5000000', toh = '0') {
        return signer.revoke(this._getSigner(), this.address, _.toString(amount), gas, memo, toh);
    }

    /**
     * Generates and signs profile/MsgBuyImExtraStorage transaction
     *
     * @param {number} amount - extra space amount, GBs;
     * @param {string?} [memo=''] - TX memo;
     * @param {string?} [gas='5000000'] - TX gas limit;
     * @param {string?} [toh='0'] - timeout height;
     * @returns {Uint8Array} - signed TX, ready to be sent.
     */
    buyImStorage(amount, memo = '', gas = '5000000', toh = '0') {
        return signer.buyImStorage(this._getSigner(), this.address, amount, gas, memo, toh);
    }

    /**
     * Generates and signs profile/MsgGiveUpImExtra transaction
     *
     * @param {number} amount - a new (i.e. reduced) extra (i.e. over free 5GB) amount, GBs;
     * @param {string?} [memo=''] - TX memo;
     * @param {string?} [gas='5000000'] - TX gas limit;
     * @param {string?} [toh='0'] - timeout height;
     * @returns {Uint8Array} - signed TX, ready to be sent.
     */
    giveUpImExtra(amount, memo = '', gas = '5000000', toh = '0') {
        return signer.giveUpImExtra(this._getSigner(), this.address, amount, gas, memo, toh);
    }

    /**
     * Generates and signs profile/MsgGiveUpImExtra transaction
     *
     * @param {string?} [gas='5000000'] - TX gas limit;
     * @param {string?} [memo=''] - TX memo;
     * @param {string?} [toh='0'] - timeout height;
     * @returns {Uint8Array} - signed TX, ready to be sent.
     */
    prolongImExtra(memo = '', gas = '5000000', toh = '0') {
        return signer.prolongImExtra(this._getSigner(), this.address, gas, memo, toh);
    }

    /**
     * Sign an arbitrary byte sequence.
     *
     * @param {Buffer} bytes -- bytes to sign.
     * @returns {Buffer} signature.
     */
    signRawBytes(bytes) {
        return signer.$parts.signRawBytes(this.privateKey, bytes);
    }

    /**
     * Verify a signature previously gotten by {@link signRawBytes}.
     *
     * @param {Buffer} bytes - signed bytes;
     * @param {Buffer} signature - signature.
     * @returns {boolean} - `true` if the signature's OK, `false` otherwise.
     */
    verifyRawBytesSignature(bytes, signature) {
        return signer.$parts.verifyRawBytesSignature(this.publicKey, bytes, signature);
    }
}

module.exports = Wallet;
module.exports.toCanonicalJSON = toCanonicalJSON;
module.exports.sha256 = signer.$parts.sha256;
module.exports.signRawBytes = signer.$parts.signRawBytes;
module.exports.verifyRawBytesSignature = signer.$parts.verifyRawBytesSignature;
module.exports.PubKey = bitcore.PublicKey;
module.exports.wrap = signer.wrap;