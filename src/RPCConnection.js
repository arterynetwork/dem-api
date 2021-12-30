const _ = require('lodash');
const RPC = require("./JSONRPC");

/**
 * Manages nodes list and call it's REST APIs
 */
class RPCConnection {
    /**
     * Creates class instance
     * @constructor
     * @param wallet {Wallet} user's wallet to sign requests
     * @param seeds {string[]} list of seeds (control nodes) addresses
     * @param peers {string[]} list of peers (storage nodes) addresses
     * @param appWallet {Wallet} app's wallet to sign requests
     */
    constructor(wallet, seeds = [], peers = [], appWallet = null) {
        this.wallet = wallet;
        this.seeds = seeds;
        this.failSeeds = [];
        this.lastSeed = null;
        this.peers = peers;
        this.lastPeer = null;
        this.failPeers = [];
        this.appWallet = appWallet;
    }

    /**
     * Sets app's wallet for this connection
     * @param appWallet {Wallet}
     */
    setAppWallet(appWallet) {
        this.appWallet = appWallet;
    }

    /**
     * Sets user's wallet for this connection
     * @param wallet {Wallet}
     */
    setWallet(wallet) {
        this.wallet = wallet;
    }

    /**
     * Check's if any seeds (control nodes) specified for this connection
     * @returns {boolean}
     */
    haveSeeds() {
        return !!this.seeds && this.seeds.length;
    }

    /**
     * Set the seeds (control nodes) list
     * @param seeds {string[]|string} array or comma-separated urls list
     * @returns {string[]}
     */
    setSeeds(seeds) {
        this.seeds = seeds;
        if (typeof this.seeds === 'string') {
            this.seeds = this.seeds.split(',').map(seed => seed.trim().toLowerCase());
        }

        return this.seeds;
    }

    /**
     * Set peers (storage nodes) list
     * @param peers {string[]|string} array or comma-separated urls list
     * @returns {string[]}
     */
    setPeers(peers) {
        this.peers = peers;
        if (typeof this.peers === 'string') {
            this.peers = this.peers.split(',').map(seed => seed.trim().toLowerCase());
        }

        return this.peers;
    }

    /**
     * Get random url from list
     * @param source {string[]} group of urls to search (seeds/peers)
     * @param exclude {string[]} urls to exclude
     * @param ip {string} default value
     * @returns {null|boolean|string}
     * @private
     */
    _randomIp(source, exclude, ip = null) {
        if (ip) {
            return ip;
        }

        if (!source || !source.length) {
            return false;
        }

        let remain = _.xor(source, exclude);
        if (!remain.length) {
            return false;
        }

        return _.sample(remain);
    }

    /**
     * Get next seed (control node) to connect to
     * @returns {boolean|string|null}
     * @private
     */
    _nextSeed() {
        return this.lastSeed = this._randomIp(this.seeds, this.failSeeds, this.lastSeed);
    }

    /**
     * Get next peer (storage node) to connect to
     * @returns {boolean|string|null}
     * @private
     */
    _nextPeer() {
        return this.lastPeer = this._randomIp(this.peers, this.failPeers, this.lastPeer);
    }

    /**
     * Call remote API
     * @param method {string} method name
     * @param params {object} method params
     * @param sign {boolean} sign request by user's private key
     * @param notification {boolean} is notification request (no need to wait response)
     * @param source {string} list to get node from
     * @param failSource {string} list to save invalid node to
     * @param iterator {string} iterator name
     * @returns {Promise<{result}|*>}
     * @private
     */
    // eslint-disable-next-line no-unused-vars -- We expect `notification` will be used in future versions.
    async _callApi(method, params, {sign = false, notification = false}, source, failSource, iterator) {
        let ip = null;

        // If no seeds available - try again full list
        if (!_.xor(this[source], this[failSource]).length) {
            this[failSource] = [];
        }

        if (sign && (!this.wallet || typeof this.wallet !== 'object' || !this.wallet.address)) {
            throw Error('Unable to sign: wallet not initialized');
        }

        // eslint-disable-next-line no-cond-assign
        while (ip = this[iterator]()) {
            let result = null;
            if (!sign) {
                result = await RPC.callApi(
                    method,
                    params,
                    ip,
                    false,
                    this.appWallet,
                );
            } else {
                result = await RPC.callApiSigned(
                    this.wallet,
                    method,
                    params,
                    ip,
                    false,
                    this.appWallet
                );
            }

            if (result.result) {
                return result;
            } else {
                this[failSource].push(ip);
            }
        }

        throw Error(`No more ${source} to process request ${method}`);
    }

    async callSeed(method, params, {sign = false, notification = false} = {}) {
        return this._callApi(
            method,
            params,
            {sign, notification},
            'seed',
            'failSeeds',
            '_nextSeed'
        );
    }

    async callPeer(method, params, {sign = false, notification = false} = {}) {
        return this._callApi(
            method,
            params,
            {sign, notification},
            'peers',
            'failPeers',
            '_nextPeer'
        );
    }
}


module.exports = RPCConnection;
