const _ = require("lodash");
const EC = require("elliptic").ec;
const BN = require('bn.js');
const {crypto} = require("bitcore-lib");

const ec = new EC("secp256k1");
const protocolVersion = 1;
const blockSize = 32;

const excludedPoints = [
    ec.curve.point('4b00a7cda85af529c338774b867b45549a387c0a3ab5425df5d681e45efa40dc', '39b37bcd6e6a18c830bfb35c6e4443ec1e1612ac606d8693f9976da4edac15d6'),
    ec.curve.point('ab9ce1ffcde3127a0a2c5d4761b11fe50bcc78c2ec16394e45840d0d965a4a5e', '125eabf10341ce55960085b1562440e228cc118389ffe5f94f492c4d0c468d2c'),
    ec.curve.point('e88a7ad83a5e0f6f40324f832a7e254c3695736b88629e41822872f3ec2bc205', '0a695849fb08c31350d5d895d3e05e9260791ef946edc35c02b206af9f449f75'),
    ec.curve.point('4287a463e892d53863f40859502f615bccb34349196d33be60746991258a0a70', '7462f523c6da4b4e95703b47199b51493b0558f8ef33329befa762550af5657c')
];
const excludedPointsCount = new BN(excludedPoints.length);

function objToNumbers(data) {
    const bz = strToUtf8(JSON.stringify(data));

    return bytesToNumbers(bz);
}

function bytesToNumbers(bz) {
    let res = [];
    let acc = [protocolVersion];

    const n = bz.length;
    if (n > 60 * 1024) {
        throw new Error(`data is too long (${n} > 60kb)`);
    }

    acc.push(Math.floor(n / 256), n % 256, ...bz);

    while (acc.length >= blockSize) {
        res.push(new BN(_.take(acc, blockSize)));
        acc = _.drop(acc, blockSize);
    }
    if (acc.length !== 0) {
        acc.push(...crypto.Random.getRandomBuffer(blockSize - acc.length));
        res.push(new BN(acc));
    }
    return res;
}

function numbersToObj(bnz) {
    return JSON.parse(utf8ToStr(numbersToBytes(bnz)));
}

function numbersToBytes(bnz) {
    let buffer = [];

    if (_.isEmpty(bnz))
        throw new Error("non-empty array expected");

    const protocolVersion = bnz[0].ushrn(8 * (blockSize - 1)).uand(new BN(255)).toNumber();
    if (protocolVersion !== 1)
        throw new Error(`protocol version is not supported (${protocolVersion})`);

    const n = bnz[0].ushrn(8 * (blockSize - 3)).uand(new BN(0xFFFF)).toNumber();
    if (_.floor((bnz.length * blockSize - (n + 3)) / blockSize) !== 0) {
        throw new Error(`length mismatch (${n} ∉ [${bnz.length * blockSize - 34}; ${bnz.length * blockSize - 3}])`);
    }

    let buf = bnz[0].uand(new BN('000000ff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff ffffffff', 16)).toArray('be', 29);
    if (n < 29) {
        buf.length = n;
    }
    buffer.push(...buf);

    for (let i = 1; i < bnz.length; i++) {
        buf = bnz[i].toArray('be', 32);
        if (n + 3 < blockSize * (i + 1)) {
            buf.length = (n + 3) - 32 * i;
        }
        buffer.push(...buf);
    }

    return buffer;
}

function numbersToRawPoints(bnz) {
    if (_.isEmpty(bnz)) {
        return [];
    }

    const head = _.head(bnz);
    const tail = _.tail(bnz);

    if (head.lte(ec.curve.p)) {
        let x = head.ushrn(1);
        let y_odd = head.uand(new BN(0x01)).toNumber();

        try {
            let p = ec.curve.pointFromX(x, y_odd);
            if (!_.some(excludedPoints, x => p.eq(x))) {
                return [p, ...numbersToRawPoints(tail)];
            }
        } catch (e) {
            if (e.message !== 'invalid point') {
                throw e;
            }
        }
    }

    const {div: quo, mod} = head.divmod(excludedPointsCount);
    return [excludedPoints[mod.toNumber()], ...numbersToRawPoints([quo]), ...numbersToRawPoints(tail)];
}

function rawPointsToNumbers(pz) {
    const zero = new BN(0);
    const one = new BN(1);
    const b64 = new BN(1).ishln(256).iaddn(-1);

    return _(_.reduce(
        pz,
        (acc, p) => {
            const xpIdx = _.findIndex(excludedPoints, x => p.eq(x));
            if (xpIdx === -1) {
                let n = p.x.ushln(1);
                if (p.y.isOdd()) {
                    n.iuor(one);
                }
                return {
                    result: [...acc.result, n.imul(acc.a).iadd(acc.b)],
                    a: one,
                    b: zero
                };
            } else {
                return {
                    result: acc.result,
                    a: acc.a.mul(excludedPointsCount),
                    b: acc.b.add(acc.a.mul(new BN(xpIdx)))
                };
            }
        },
        {
            result: [],
            a: one,
            b: zero,
        }
    ).result).map(
        bn => bn.iuand(b64)
    ).value();
}

function encryptPoints(pubKey, points) {
    let rnd = new BN(0);
    while (rnd.ltn(2) || rnd.gte(ec.curve.p)) {
        rnd = new BN(crypto.Random.getRandomBuffer(32));
    }

    const addition = pubKey.point.mul(rnd);
    return [ec.curve.g.mul(rnd), ..._.map(points, p => p.add(addition))];
}

function decryptPoints(privKey, points) {
    const addition = points[0].mul(privKey.toBigNumber()).neg();
    return _.map(_.tail(points), p => p.add(addition));
}

function cryptoPointsToNumbers(pz) {
    const zero = new BN(0);
    const one = new BN(1);

    if (pz.length > 256) {
        throw new Error('too many points');
    }

    let ys = zero.clone();

    return [ys, ..._.map(pz, (p, i) => {
        if (!p.validate()) {
            throw new Error('point is invalid (A)');
        }
        if (!ec.curve.validate(p)) {
            throw new Error('point is invalid (B)');
        }
        if (p.isInfinity()) {
            return zero;
        }
        if (p.getY().isOdd()) {
            ys.ior(one.shln(i));
        }
        return p.getX();
    })];
}

function numbersToCryptoPoints(bnz) {
    const one = new BN(1);
    const ys = _.head(bnz);
    return _.map(_.tail(bnz), (x, i) => ec.curve.pointFromX(x, !ys.uand(one.ushln(i)).isZero()));
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function numbersToMessage(bns) {
    let offset = 0;
    let tail = 0;
    let output = '';
    for (let i = 0; i < bns.length; i++) {
        if (offset < 0) {
            offset += 6;
            output += BASE64_CHARS[tail << offset | bns[i].ushrn(8 * blockSize - offset).uand(new BN((1 << offset) - 1)).toNumber()];
        }
        while (offset <= 8 * blockSize - 6) {
            output += BASE64_CHARS[bns[i].ushrn(8 * blockSize - 6 - offset).uand(new BN(63)).toNumber()];
            offset += 6;
        }
        tail = bns[i].uand(new BN((1 << (8 * blockSize - offset)) - 1)).toNumber();
        offset -= 8 * blockSize;
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

function messageToNumbers(msg) {
    let result = [];
    let offset = 0;
    let buffer = new BN(0);

    msg = msg.replace(/=*$/, '');

    for (let i = 0; i < msg.length; i++) {
        const n = BASE64_CHARS.indexOf(msg[i]);

        let bits = 6;
        if ((offset += 6) > 8 * blockSize) {
            bits = 6 - (offset - 8 * blockSize);
        }
        buffer.iushln(bits).ior(new BN(n >> (6 - bits)));

        if (offset >= 8 * blockSize) {
            result.push(buffer);
            offset -= 8 * blockSize;
            buffer = new BN(n & ((1 << offset) - 1));
        }
    }
    return result;
}

function compose(...fns) {
    return (val) => _.reduceRight(fns, (x, f) => f(x), val);
}

function strToUtf8(str) {
    let utf8 = [];
    for (let i = 0; i < str.length; i++) {
        let charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
            utf8.push(0xc0 | (charcode >> 6),
                0x80 | (charcode & 0x3f));
        } else if (charcode < 0xd800 || charcode >= 0xe000) {
            utf8.push(0xe0 | (charcode >> 12),
                0x80 | ((charcode >> 6) & 0x3f),
                0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
            i++;
            // UTF-16 encodes 0x10000-0x10FFFF by
            // subtracting 0x10000 and splitting the
            // 20 bits of 0x0-0xFFFFF into two halves
            charcode = 0x10000 + (((charcode & 0x3ff) << 10)
                | (str.charCodeAt(i) & 0x3ff));
            utf8.push(0xf0 | (charcode >> 18),
                0x80 | ((charcode >> 12) & 0x3f),
                0x80 | ((charcode >> 6) & 0x3f),
                0x80 | (charcode & 0x3f));
        }
    }
    return utf8;
}

function utf8ToStr(bz) {
    let str = "";
    for (let i = 0; i < bz.length; i++) {
        let charcode = 0;
        if ((bz[i] & 0x80) === 0x00) {
            // 1 byte
            charcode = bz[i];
        } else if ((bz[i] & 0xE0) === 0xC0) {
            // 2 bytes
            if (i + 1 >= bz.length) throw new Error("invalid Unicode: the string ending before the end of the character");
            if ((bz[i + 1] & 0xC0) !== 0x80) throw new Error("invalid Unicode: a non-continuation byte before the end of the character");
            charcode = ((bz[i] & 0x1F) << 6) | (bz[i + 1] & 0x3F);
            if (charcode < 0x0040) throw new Error("invalid Unicode: an overlong encoding");
            i += 1;
        } else if ((bz[i] & 0xF0) === 0xE0) {
            // 3 bytes
            if (i + 2 >= bz.length) throw new Error("invalid Unicode: the string ending before the end of the character");
            if (_.some(_.range(1, 2), j => (bz[i + j] & 0xC0) !== 0x80)) throw new Error("invalid Unicode: a non-continuation byte before the end of the character");
            if ((bz[i + 2] & 0xC0) !== 0x80) throw new Error("invalid Unicode: a non-continuation byte before the end of the character");
            charcode = ((bz[i] & 0x0F) << 12) | ((bz[i + 1] & 0x3F) << 6) | (bz[i + 2] & 0x3F);
            if (charcode < 0x1000) throw new Error("invalid Unicode: an overlong encoding");
            i += 2;
        } else if ((bz[i] & 0xF8) === 0xF0) {
            // 4 bytes
            if (i + 3 >= bz.length) throw new Error("invalid Unicode: the string ending before the end of the character");
            if (_.some(_.range(1, 3), j => (bz[i + j] & 0xC0) !== 0x80)) throw new Error("invalid Unicode: a non-continuation byte before the end of the character");
            charcode = ((bz[i] & 0x0F) << 18) | ((bz[i + 1] & 0x3F) << 12) | ((bz[i + 2] & 0x3F) << 6) | (bz[i + 3] & 0x3F);
            if (charcode < 0x040000) throw new Error("invalid Unicode: an overlong encoding");
            i += 3;
        } else if ((bz[i] & 0xC0) === 0x80) {
            throw new Error("invalid Unicode: an unexpected continuation byte");
        } else {
            throw new Error("invalid Unicode: an invalid byte");
        }

        if (charcode >= 0xD800 && charcode <= 0xDFFF || charcode > 0x10FFFF) throw new Error("invalid Unicode: an invalid code point");
        if (charcode < 0x100000) {
            str += String.fromCharCode(charcode);
        } else {
            charcode -= 0x100000;
            str += String.fromCharCode(0xD800 | (charcode >> 10)) + String.fromCharCode(0xDC00 | (charcode & 0x3FF));
        }
    }
    return str;
}

module.exports = {
    encodeObject,
    decodeObject,
    encodeBuffer,
    decodeBuffer,
    ec,

    steps: {
        objToNumbers,
        bytesToNumbers,
        numbersToObj,
        numbersToBytes,
        numbersToRawPoints,
        rawPointsToNumbers,
        encryptPoints,
        decryptPoints,
        cryptoPointsToNumbers,
        numbersToCryptoPoints,
        numbersToMessage,
        messageToNumbers,
    }
};

function encodeObject(pubKey, obj) {
    return compose(
        numbersToMessage,
        cryptoPointsToNumbers,
        _.partial(encryptPoints, pubKey),
        numbersToRawPoints,
        objToNumbers
    )(obj);
}

function encodeBuffer(pubKey, buffer) {
    return compose(
        numbersToMessage,
        cryptoPointsToNumbers,
        _.partial(encryptPoints, pubKey),
        numbersToRawPoints,
        bytesToNumbers
    )(buffer);
}

function decodeObject(privKey, msg) {
    return compose(
        numbersToObj,
        rawPointsToNumbers,
        _.partial(decryptPoints, privKey),
        numbersToCryptoPoints,
        messageToNumbers
    )(msg);
}

function decodeBuffer(privKey, msg) {
    return compose(
        numbersToBytes,
        rawPointsToNumbers,
        _.partial(decryptPoints, privKey),
        numbersToCryptoPoints,
        messageToNumbers
    )(msg);
}
