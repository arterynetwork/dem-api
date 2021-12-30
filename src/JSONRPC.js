'use strict';

const axios = require("axios");

const METHOD_GET_LOCATION = 'get_location';
const METHOD_GET_CHAT_PEERS = 'get_chat_peers';
const METHOD_ALLOCATE_CHAT_PEERS = 'allocate_chat_peers';
const METHOD_PERSIST_CHAT_PEERS = 'persist_chat_peers';
const METHOD_CHAT_SET_CONTACTS = 'chat_set_contacts';
const METHOD_CHAT_GET_CONTACTS = 'chat_get_contacts';
const METHOD_BC_GET_ADDRESS_DATA = 'bc_get_address_data';
const METHOD_BC_FIND_ACCOUNT = 'bc_find_account';
const METHOD_CHAT_GET_METADATA = 'chat_get_metadata';
const METHOD_CHAT_SET_METADATA = 'chat_set_metadata';
const METHOD_CHAT_PUT_MESSAGE = 'put_chat_message';
const METHOD_CHAT_GET_MESSAGES = 'get_chat_messages';
const METHOD_CHAT_REMOVE_MESSAGES = 'remove_chat_messages';
const METHOD_CHAT_REMOVE_CHAT = 'remove_chat';
const METHOD_ALLOCATE_NODES = 'allocate_nodes';
const METHOD_PUT_BLOCK_FOR_CHAT = 'put_block_for_chat';
const METHOD_GET_BLOCKS_HOLDERS = 'blocks_holders';
const METHOD_GET_BLOCK = 'get_block';
const METHOD_CHAT_SET_LAST_SEEN = 'chat_set_last_seen';
const METHOD_CHAT_GET_LAST_SEEN = 'chat_get_last_seen';

const METHOD_PUSH_SET_KEY = 'set_push_key';
const METHOD_PUSH_GET_KEY = 'get_push_key';

const createRequest = (method, params, messageId = null) => {
    if (!messageId) {
        messageId = Date.now();
    }

    return {
        'jsonrpc': '2.0',
        'proto': '1.0',
        'id': messageId,
        'method': method,
        'params': params,
    };
};

const createErrorResponse = (code, error) => {
    return {
        'jsonrpc': '2.0',
        'proto': '1.0',
        'id': -1,
        code,
        error
    };
};

/**
 * Asynchronously call remote API over JSON RPC
 * @param method {string} method to call
 * @param params {object} method params
 * @param url {string} url to send data to
 * @param notification {boolean} is notification request
 * @param appWallet {Wallet} application wallet to sign request
 * @returns {Promise<object>}
 */
// eslint-disable-next-line no-unused-vars -- We expect `notification` will be used in future versions.
module.exports.callApi = async (method, params, url, notification = false, appWallet = null) => {
    if (!appWallet) {
        console.log('callApiSigned no appWallet', method);
        throw Error('No app wallet specified');
    }

    let request = createRequest(method, params);

    try {
        request.appSign = (await appWallet.signJson(request)).toString('hex');
        request.appPubKey = appWallet.publicKeyHex;
        let response = await axios.post(url, request, {timeout: 10000});
        return response.data;
    } catch (e) {
        console.error(e);
        return createErrorResponse(403, e);
    }
};

/**
 * Asynchronously call remote API over JSON RPC, request signed with users private key
 * @param wallet {Wallet} user's wallet to sign request
 * @param method {string} method to call
 * @param params {object} method params
 * @param url {string} url to send data to
 * @param notification {boolean} is notification request
 * @param appWallet {Wallet} application wallet to sign request
 * @returns {Promise<unknown>}
 */
// eslint-disable-next-line no-unused-vars -- We expect `notification` will be used in future versions.
module.exports.callApiSigned = async (wallet, method, params, url, notification = false, appWallet = null) => {
    if (!appWallet) {
        throw Error('No app wallet specified');
    }

    let request = createRequest(method, params);
    let sign = await wallet.signJson(request);
    try {
        request.sign = sign.toString('hex');
        request.pubKey = wallet.publicKeyHex;
        request.appSign = (await appWallet.signJson(request)).toString('hex');
        request.appPubKey = appWallet.publicKeyHex;
        let response = await axios.post(url, request, {timeout: 10000});
        return response.data;
    } catch (e) {
        console.error(e);
        return createErrorResponse(403, e);
    }
};

module.exports.METHOD_GET_LOCATION = METHOD_GET_LOCATION;
module.exports.METHOD_GET_CHAT_PEERS = METHOD_GET_CHAT_PEERS;
module.exports.METHOD_ALLOCATE_CHAT_PEERS = METHOD_ALLOCATE_CHAT_PEERS;
module.exports.METHOD_PERSIST_CHAT_PEERS = METHOD_PERSIST_CHAT_PEERS;
module.exports.METHOD_CHAT_SET_CONTACTS = METHOD_CHAT_SET_CONTACTS;
module.exports.METHOD_CHAT_GET_CONTACTS = METHOD_CHAT_GET_CONTACTS;
module.exports.METHOD_BC_GET_ADDRESS_DATA = METHOD_BC_GET_ADDRESS_DATA;
module.exports.METHOD_BC_FIND_ACCOUNT = METHOD_BC_FIND_ACCOUNT;
module.exports.METHOD_CHAT_GET_METADATA = METHOD_CHAT_GET_METADATA;
module.exports.METHOD_CHAT_SET_METADATA = METHOD_CHAT_SET_METADATA;
module.exports.METHOD_CHAT_PUT_MESSAGE = METHOD_CHAT_PUT_MESSAGE;
module.exports.METHOD_CHAT_GET_MESSAGES = METHOD_CHAT_GET_MESSAGES;
module.exports.METHOD_CHAT_REMOVE_MESSAGES = METHOD_CHAT_REMOVE_MESSAGES;
module.exports.METHOD_CHAT_REMOVE_CHAT = METHOD_CHAT_REMOVE_CHAT;
module.exports.METHOD_ALLOCATE_NODES = METHOD_ALLOCATE_NODES;
module.exports.METHOD_PUT_BLOCK_FOR_CHAT = METHOD_PUT_BLOCK_FOR_CHAT;
module.exports.METHOD_GET_BLOCKS_HOLDERS = METHOD_GET_BLOCKS_HOLDERS;
module.exports.METHOD_GET_BLOCK = METHOD_GET_BLOCK;
module.exports.METHOD_CHAT_SET_LAST_SEEN = METHOD_CHAT_SET_LAST_SEEN;
module.exports.METHOD_CHAT_GET_LAST_SEEN = METHOD_CHAT_GET_LAST_SEEN;
module.exports.METHOD_PUSH_SET_KEY = METHOD_PUSH_SET_KEY;
module.exports.METHOD_PUSH_GET_KEY = METHOD_PUSH_GET_KEY;
