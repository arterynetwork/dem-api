const bitcore = require('bitcore-lib');
const Address = bitcore.Address;
const {bech32} = require('bech32');

Address.prototype.toString = function () {
    if (this.isPayToWitnessPublicKeyHash() || this.isPayToWitnessScriptHash()) {
        let prefix = this.network.bech32prefix;
        let words = bech32.toWords(this.hashBuffer);
        return bech32.encode(prefix, words);
    }
    return bitcore.encoding.Base58Check.encode(this.toBuffer());
};

module.exports = Address;