const _ = require('lodash');
const {PrivateKey} = require("bitcore-lib");
const Mnemonic = require('bitcore-mnemonic');
const crypto = require('crypto');
const secp256 = require("./SecpEncryption");
const BN = require("bn.js");

const proto = require('protobufjs').Root.fromJSON(require('./proto/bundle.json'));

/**
 * Generates and signs bank/MsgSend transaction
 *
 * @param signer - TX sender credentials:
 * @param {string} signer.accNo - account number;
 * @param {string} signer.seqNo - sequence number;
 * @param {string} signer.chainId - no comments.
 * @param {string?} signer.privKey - hex representation of a private key;
 * @param {string?} signer.pubKey - hex representation of a public key (to be obtained from a private key if omitted);
 * @param {string?} signer.seed - mnemonic to the privKey be derived from (used only if privKey is omited).
 * @param {string} from - sender SDK account address;
 * @param {string} to - receiver SDK account address;
 * @param {string} amount - sent μARTRs amount (without denom, number only);
 * @param {string?} [gas='21000000'] - TX gas limit;
 * @param {string?} [memo=''] - TX memo;
 * @param {string?} [toh='0'] - timeout height;
 * @returns {Uint8Array} - signed TX, ready to be sent.
 */
function send(signer, from, to, amount, gas = '21000000', memo = '', toh = '0') {
    const msg = { // https://github.com/arterynetwork/artr/blob/2.0.1/proto/artery/bank/v1beta1/tx.proto#L16
        from_address: from,
        to_address: to,
        amount: [{
            denom: "uartr",
            amount: amount.toString()
        }]
    };
    return getTx(signer, '/artery.bank.v1beta1.MsgSend', msg, gas, memo, toh);
}

/**
 * Generates and signs delegating/MsgDelegate transaction
 *
 * @param signer - TX sender credentials:
 * @param {string} signer.accNo - account number;
 * @param {string} signer.seqNo - sequence number;
 * @param {string} signer.chainId - no comments.
 * @param {string?} signer.privKey - hex representation of a private key;
 * @param {string?} signer.pubKey - hex representation of a public key (to be obtained from a private key if omitted);
 * @param {string?} signer.seed - mnemonic to the privKey be derived from (used only if privKey is omited).
 * @param {string} address - subject SDK account address;
 * @param {string} amount - delegated μARTRs amount (without denom, number only);
 * @param {string?} [gas='21000000'] - TX gas limit;
 * @param {string?} [memo=''] - TX memo;
 * @param {string?} [toh='0'] - timeout height;
 * @returns {Uint8Array} - signed TX, ready to be sent.
 */
function delegate(signer, address, amount, gas = '21000000', memo = '', toh = '0') {
    const msg = {
        address,
        micro_coins: amount,
    };
    return getTx(signer, '/artery.delegating.v1beta1.MsgDelegate', msg, gas, memo, toh);
}

/**
 * Generates and signs delegating/MsgRevoke transaction
 *
 * @param signer - TX sender credentials:
 * @param {string} signer.accNo - account number;
 * @param {string} signer.seqNo - sequence number;
 * @param {string} signer.chainId - no comments.
 * @param {string?} signer.privKey - hex representation of a private key;
 * @param {string?} signer.pubKey - hex representation of a public key (to be obtained from a private key if omitted);
 * @param {string?} signer.seed - mnemonic to the privKey be derived from (used only if privKey is omited).
 * @param {string} address - subject SDK account address;
 * @param {string} amount - undelegated μARTRs amount (without denom, number only);
 * @param {string?} [gas='21000000'] - TX gas limit;
 * @param {string?} [memo=''] - TX memo;
 * @param {string?} [toh='0'] - timeout height;
 * @returns {Uint8Array} - signed TX, ready to be sent.
 */
function revoke(signer, address, amount, gas = '21000000', memo = '', toh = '0') {
    const msg = {
        address,
        micro_coins: amount,
    };
    return getTx(signer, '/artery.delegating.v1beta1.MsgRevoke', msg, gas, memo, toh);
}

/**
 * Generates and signs profile/MsgBuyImExtraStorage transaction
 *
 * @param signer - TX sender credentials:
 * @param {string} signer.accNo - account number;
 * @param {string} signer.seqNo - sequence number;
 * @param {string} signer.chainId - no comments.
 * @param {string?} signer.privKey - hex representation of a private key;
 * @param {string?} signer.pubKey - hex representation of a public key (to be obtained from a private key if omitted);
 * @param {string?} signer.seed - mnemonic to the privKey be derived from (used only if privKey is omited).
 * @param {string} address - subject SDK account address;
 * @param {number} amount - extra space amount, GBs;
 * @param {string?} [gas='21000000'] - TX gas limit;
 * @param {string?} [memo=''] - TX memo;
 * @param {string?} [toh='0'] - timeout height;
 * @returns {Uint8Array} - signed TX, ready to be sent.
 */
function buyImStorage(signer, address, amount, gas='21000000', memo='', toh='0') {
    const msg = {
        address,
        extra_storage: amount
    };
    return getTx(signer, '/artery.profile.v1beta1.MsgBuyImExtraStorage', msg, gas, memo, toh);
}

/**
 * Generates and signs profile/MsgGiveUpImExtra transaction
 *
 * @param signer - TX sender credentials:
 * @param {string} signer.accNo - account number;
 * @param {string} signer.seqNo - sequence number;
 * @param {string} signer.chainId - no comments.
 * @param {string?} signer.privKey - hex representation of a private key;
 * @param {string?} signer.pubKey - hex representation of a public key (to be obtained from a private key if omitted);
 * @param {string?} signer.seed - mnemonic to the privKey be derived from (used only if privKey is omited).
 * @param {string} address - subject SDK account address;
 * @param {number} amount - a new (i.e. reduced) extra (i.e. over free 5GB) amount, GBs;
 * @param {string?} [gas='21000000'] - TX gas limit;
 * @param {string?} [memo=''] - TX memo;
 * @param {string?} [toh='0'] - timeout height;
 * @returns {Uint8Array} - signed TX, ready to be sent.
 */
function giveUpImExtra(signer, address, amount, gas='21000000', memo='', toh='0') {
    const msg = {
        address,
        amount
    };
    return getTx(signer, '/artery.profile.v1beta1.MsgGiveUpImExtra', msg, gas, memo, toh);
}

/**
 * Generates and signs profile/MsgGiveUpImExtra transaction
 *
 * @param signer - TX sender credentials:
 * @param {string} signer.accNo - account number;
 * @param {string} signer.seqNo - sequence number;
 * @param {string} signer.chainId - no comments.
 * @param {string?} signer.privKey - hex representation of a private key;
 * @param {string?} signer.pubKey - hex representation of a public key (to be obtained from a private key if omitted);
 * @param {string?} signer.seed - mnemonic to the privKey be derived from (used only if privKey is omited).
 * @param {string} address - subject SDK account address;
 * @param {string?} [gas='21000000'] - TX gas limit;
 * @param {string?} [memo=''] - TX memo;
 * @param {string?} [toh='0'] - timeout height;
 * @returns {Uint8Array} - signed TX, ready to be sent.
 */
function prolongImExtra(signer, address, gas='21000000', memo='', toh='0') {
    const msg = {
        address
    };
    return getTx(signer, '/artery.profile.v1beta1.MsgProlongImExtra', msg, gas, memo, toh);
}

/**
 * Composes and signs a TX.
 *
 * @param signer -- TX sender credentials:
 * @param {string} signer.accNo -- account number;
 * @param {string} signer.seqNo -- sequence number;
 * @param {string} signer.chainId -- no comments.
 * @param {PrivateKey|string?} signer.privKey -- hex representation of a private key;
 * @param {PublicKey|string?} signer.pubKey -- hex representation of a public key (to be obtained from a private key if omitted);
 * @param {string?} signer.seed -- mnemonic to the privKey be derived from (used only if privKey is omitted).
 * @param {string} msgType -- message type as it registered in Protobuf.
 * @param {Object} msg -- message to wrap.
 * @param {string} gas -- TX gas limit.
 * @param {string} memo -- TX memo.
 * @param {string} toh -- timeout height.
 * @returns {Uint8Array} signed TX bytes (ready for wrapping in base64 and posting to /cosmos/tx/v1beta1/txs then).
 */
function getTx(signer, msgType, msg, gas, memo, toh) {
    const TxRaw = proto.lookupType('cosmos.fake.TxRaw');

    const bodyBytes = getTxBodyBytes(msgType, msg, memo, toh);
    const authBytes = getTxAuthBytes(signer, gas);
    const signature = getSignature(signer, bodyBytes, authBytes);

    return TxRaw.encode(TxRaw.fromObject({
        body: bodyBytes,
        auth_info: authBytes,
        signatures: [signature]
    })).finish();
}

/**
 * Signs a TX.
 *
 * @param signer - TX sender credentials:
 * @param {string} signer.accNo - account number;
 * @param {string} signer.seqNo - sequence number;
 * @param {string} signer.chainId - no comments.
 * @param {PrivateKey|string?} signer.privKey - hex representation of a private key;
 * @param {PublicKey|string?} signer.pubKey - hex representation of a public key (to be obtained from a private key if omitted);
 * @param {string?} signer.seed - mnemonic to the privKey be derived from (used only if privKey is omitted).
 * @param {Uint8Array} bodyBytes - bytes from {@link getTxBodyBytes}
 * @param {Uint8Array} authBytes - bytes from {@link getTxAuthBytes}
 * @returns {Uint8Array} a signature
 */
function getSignature(signer, bodyBytes, authBytes) {
    if (!signer.privKey && signer.seed) {
        const hdprivkey = (new Mnemonic(signer.seed)).toHDPrivateKey().deriveChild("m/44'/546'/0'/0/0");
        const privateKey = hdprivkey.privateKey;
        privateKey.toString();

        signer.privKey = privateKey;
        if (!signer.pubKey) {
            signer.pubKey = privateKey.toPublicKey();
        }
    } else if (!signer.pubKey && signer.privKey) {
        let privateKey = signer.privKey;
        if (_.isString(privateKey))
            privateKey = PrivateKey.fromString(privateKey);
        signer.pubKey = privateKey.toPublicKey();
    }

    const signBytes = getTxBytes(signer, bodyBytes, authBytes);

    return signRawBytes(signer.privKey, signBytes);
}

/**
 * Builds a part of Direct-mode signing bytes. Equivalent to
 * the Go [getBodyBytes]{@link https://github.com/cosmos/cosmos-sdk/blob/v0.42.6/x/auth/tx/builder.go#L67} method.
 *
 * @param {string} msgType - message type with a leading slash
 * @param {Object} msg
 * @param {string} memo
 * @param {string} toh - TX timeout height
 * @returns {Uint8Array}
 */
function getTxBodyBytes(msgType, msg, memo, toh) {
    let type = 'TxBody';
    if (memo === '') {
        if (toh === '0') {
            type = 'TxBodyMsgsOnly';
        } else {
            type = 'TxBodyWithoutMemo';
        }
    } else if (toh === '0') {
        type = 'TxBodyWithoutToh';
    }
    const TxBody = proto.lookupType('cosmos.fake.' + type);

    return TxBody.encode(TxBody.fromObject({
        messages: [marshalProto(msgType, msg)],
        memo,
        timeout_height: toh,
    })).finish();
}

/**
 * Builds a part of Direct-mode signing bytes. Equivalent to
 * the Go [getAuthInfoBytes]{@link https://github.com/cosmos/cosmos-sdk/blob/v0.42.6/x/auth/tx/builder.go#L83} method.
 *
 * @param {Object} signer - TX sender credentials:
 * @param {PrivateKey|string?} signer.privKey - hex representation of a private key;
 * @param {PublicKey|string?} signer.pubKey - hex representation of a public key (to be obtained from a private key if omitted);
 * @param {string?} signer.seed - mnemonic to the privKey be derived from (used only if privKey is omitted);
 * @param {string} signer.seqNo - sequence number;
 * @param {string} [gas='21000000'] - TX gas limit.
 * @returns {Uint8Array}
 */
function getTxAuthBytes(signer, gas = '21000000') {
    let type = 'AuthInfo' + (gas === '0' ? 'WithoutGas' : '');
    const AuthInfo = proto.lookupType('cosmos.fake.' + type);
    const SignMode = proto.lookupEnum('cosmos.fake.SignMode');
    const PubKey = proto.lookupType('cosmos.fake.PubKey');

    if (!signer.pubKey) {
        if (signer.privKey) {
            let privateKey = signer.privKey;
            if (_.isString(privateKey))
                privateKey = PrivateKey.fromString(privateKey);
            signer.pubKey = privateKey.toPublicKey();
        } else if (signer.seed) {
            const hdprivkey = (new Mnemonic(signer.seed)).toHDPrivateKey().deriveChild("m/44'/546'/0'/0/0");
            const privateKey = hdprivkey.privateKey;

            signer.privKey = privateKey;
            signer.pubKey = privateKey.toPublicKey();
        } else {
            throw new Error('credential required');
        }
    }
    let pubKey = signer.pubKey;
    if (!_.isString(pubKey)) {
        pubKey = pubKey.toString();
    }
    pubKey = hexToBytes(pubKey);

    return AuthInfo.encode(AuthInfo.fromObject({
        signer_infos: [{
            public_key: {
                type_url: '/cosmos.crypto.secp256k1.PubKey',
                value: PubKey.encode(PubKey.create({
                    key: pubKey
                })).finish()
            },
            mode_info: {
                single: {
                    mode: SignMode.values['SIGN_MODE_DIRECT'],
                }
            },
            sequence: signer.seqNo,
        }],
        fee: {
            gas_limit: gas,
        }
    })).finish();
}

function getTxBytes(signer, bodyBytes, authBytes) {
    const SignDoc = proto.lookupType('cosmos.fake.SignDoc');

    return SignDoc.encode(SignDoc.fromObject({
        body_bytes: bodyBytes,
        auth_info_bytes: authBytes,
        chain_id: signer.chainId,
        account_number: signer.accNo,
    })).finish();
}

/**
 * Get message bytes to be signed. Equivalent to the Go
 * [GetSignBytes]{@link https://github.com/cosmos/cosmos-sdk/blob/v0.42.6/types/tx_msg.go#L27} method.
 *
 * @param {string} msgType -- message type (with leading slash)
 * @param {Object} msg -- message without a &#64;type field
 * @returns {Uint8Array}
 */
function getMsgBytes(msgType, msg) {
    return marshalProto(msgType, msg).value;
}

/**
 * Builds an object appropriate for Any-type proto field initialization.
 *
 * @param {string} msgType - type with a leading slash
 * @param {Object} msg - a plain object
 * @returns {{value: Uint8Array, type_url: string}}
 */
function marshalProto(msgType, msg) {
    let type = msgType.substr(1);
    if (msgType === '/artery.profile.v1beta1.MsgGiveUpImExtra' && !msg.amount) {
        type += '_All';
    }
    const Msg = proto.lookupType(type);
    return {
        type_url: msgType,
        value: Msg.encode(Msg.fromObject(msg)).finish()
    };
}

/**
 * Gets SHA256 hash.
 *
 * @param {Buffer} bytes
 * @returns {Uint8Array}
 */
const sha256 = (bytes) => {
    const buffer = crypto.createHash('sha256').update(bytes).digest();
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength / Uint8Array.BYTES_PER_ELEMENT);
};

/**
 * Sign an arbitrary byte sequence.
 *
 * @param {PrivateKey|string} privKey -- a private key (an object or a hex string);
 * @param {Buffer} bytes -- bytes to sign.
 * @returns {Buffer} signature.
 */
const signRawBytes = (privKey, bytes) => {
    const result = new Uint8Array(64);

    if (typeof privKey === 'string') {
        privKey = PrivateKey.fromString(privKey);
    }

    const signature = secp256.ec.sign(sha256(bytes), privKey.toBigNumber());

    let {s, r} = signature;
    if (s.gt(secp256.ec.curve.n.shrn(1))) {
        s = secp256.ec.curve.n.add(s.ineg());
    }
    result.set(r.toArray('be', 32), 0);
    result.set(s.toArray('be', 32), 32);

    return Buffer.from(result);
};

/**
 * Verify a signature previously gotten by {@link signRawBytes}.
 *
 * @param {PublicKey|string} pubKey - a public key (an object or a hex string);
 * @param {Buffer} bytes - signed bytes;
 * @param {Buffer} signature - signature.
 * @returns {boolean} - `true` if the signature's OK, `false` otherwise.
 */
const verifyRawBytesSignature = (pubKey, bytes, signature) => {
    if (!_.isString(pubKey)) {
        pubKey = pubKey.toString();
    }

    let r = new BN(new Uint8Array(signature.slice(0, 32)), 'be');
    let s = new BN(new Uint8Array(signature.slice(32, 64)), 'be');

    if (s.gt(secp256.ec.curve.n.shrn(1))) {
        return false;
    }

    return secp256.ec.verify(sha256(bytes), {r, s}, pubKey, 'hex');
};

/**
 * Parses a hex string to a byte array.
 *
 * @param {string} hex - hexadecimal string without '0x' prefix and whitespaces
 * @returns {Uint8Array}
 */
function hexToBytes(hex) {
    if (hex.length % 2) {
        hex = '0' + hex;
    }
    const result = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        result[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return result;
}

/**
 * Serializes a byte array to a hex string.
 *
 * @param {Uint8Array} data
 * @returns {string} hexadecimal string without '0x' prefix and whitespaces
 */
function bytesToHex(data) {
    return _.join(_.map(data, x => ((x >> 4).toString(16) + (x & 0x0F).toString(16))), '');
}

/**
 * Encodes bytes to Base64.
 *
 * @param {Uint8Array} data - bytes to encode
 * @returns {string}
 */
function b64encode(data) {
    const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

    let offset = 0;
    let tail = 0;
    let output = '';
    for (let i = 0; i < data.length; i++) {
        if (offset < 0) {
            offset += 6;
            output += BASE64_CHARS[(tail << offset) | (data[i] >> (8 - offset)) & ((1 << offset) - 1)];
        }
        if (offset <= 2) {
            output += BASE64_CHARS[(data[i] >> (2 - offset)) & 63];
            offset += 6;
        }
        tail = data[i] & ((1 << (8 - offset)) - 1);
        offset -= 8;
    }
    if (offset !== 0) {
        output += BASE64_CHARS[tail << (6 + offset)];
        switch (offset) {
            case -2:
                output += '==';
                break;
            case -4:
                output += '=';
        }
    }
    return output;
}

/**
 * Wraps a TX into JSON in order to send it via post-request.
 *
 * @param {Uint8Array} tx - a signed TX
 * @returns {{tx_bytes: string, mode: string}} - request body for sending POST to /cosmos/tx/v1beta1/txs
 */
function wrap(tx) {
    return {
        tx_bytes: b64encode(tx),
        mode: 'BROADCAST_MODE_ASYNC'
    };
}

module.exports = {
    send,
    delegate,
    revoke,
    buyImStorage,
    giveUpImExtra,
    prolongImExtra,

    wrap,

    $parts: {
        getTx,
        verifyRawBytesSignature,
        getSignature,
        getTxBytes,
        getTxBodyBytes,
        getTxAuthBytes,
        getMsgBytes,
        signRawBytes,
        sha256,
        hexToBytes,
        bytesToHex,
    }
};
