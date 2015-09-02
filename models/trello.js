/*
 *  Copyright 2015 Tickle Labs, Inc.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
*/

'use strict';

var _ = require('lodash'), util = require('util'), path = require('path');
var request = require('request'), syncRequest = require('sync-request');


module.exports.requestUrl = function(requestPath, args, include_token) {
    include_token = (typeof include_token === 'undefined') ? true : include_token;
    var credentialArgs = {
        key: process.env.TRELLO_KEY
    };
    if (include_token) {
        credentialArgs.token = process.env.TRELLO_TOKEN;
    }

    return 'https://' + path.join('api.trello.com', requestPath) + '?' +
        _.chain(args || {})
            .assign(credentialArgs)
            .map(function(value, key) {
                return util.format('%s=%s', encodeURIComponent(key), encodeURIComponent(value));
            })
            .value().join('&');
};

function mergeRequestOptions(options) {
    return _.merge({
        body: {
            key: process.env.TRELLO_KEY,
            token: process.env.TRELLO_TOKEN
        },
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Tickle\'s GitHub Trello Sync Tool'
        },
        json: true
    }, options);
}

module.exports.requestTrelloAPI = function(options, callback) {
    request(mergeRequestOptions(options), function(error, response, body) {
        if (typeof callback === 'undefined') {
            return;
        } else if (error) {
            callback(false, error);
        } else if (response.statusCode < 400) {
            try {
                callback(true, JSON.parse(body));
            } catch (e) {
                callback(true, body);
            }
        } else {
            callback(false, body);
        }
    });
};

module.exports.syncRequestTrelloAPI = function(options) {
    options = mergeRequestOptions(options);

    var method = options.method || 'GET';
    var url = options.url;
    delete options.method;
    delete options.url;
    delete options.json;

    if (options.body) {
        options.body = JSON.stringify(options.body);
    }

    return syncRequest(method, url, options);
};


// == Payload ==========================================================================================================

module.exports.Payload = function(data) {
    _.extend(this, data);
};


// == Card =============================================================================================================

module.exports.Card = function(data) {
    _.extend(this, data);
};
