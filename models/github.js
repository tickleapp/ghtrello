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

var _ = require('lodash'), helpers = require('./../helpers'), request = require('request');

module.exports.requestGitHubAPI = function(options, callback) {
    request(_.merge(options, {
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Tickle\'s GitHub Trello Sync Tool',
            Authorization: 'token ' + process.env.GITHUB_ACCESS_TOKEN
        },
        json: true,
    }), function(error, response, body) {
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


// == Issue ============================================================================================================

var Issue = module.exports.Issue = function(data) {
    _.extend(this, data);

    // Define calculated property

    Object.defineProperty(this, 'trello_card_id', {
        get: function() {
            var matchResult = Issue.trello_card_regex().exec(this.body);
            if (matchResult !== null) {
                return matchResult[2];
            }
        },
        set: function(trello_card_id) {
            if (typeof this.trello_card_id === 'undefined') {
                this.body += '\n' + Issue.trello_card_ref(trello_card_id);
            } else {
                this.body = this.body.replace(Issue.trello_card_regex(), Issue.trello_card_ref(trello_card_id));
            }
        }
    });
};

Issue.trello_card_id_ref_link_text = '[Related Trello Card]';
Issue._trello_card_id_prefix = Issue.trello_card_id_ref_link_text + '(https://trello.com/c/';
Issue._trello_card_id_suffix = ')';
Issue.trello_card_regex = function() {
    return new RegExp('^(' +
            helpers.escapeRegExp(this._trello_card_id_prefix) +
            ')([A-Za-z0-9]{8})(' +
            helpers.escapeRegExp(this._trello_card_id_suffix) +
            ')$',
        'gm');
};
Issue.trello_card_ref = function(card_id) {
    return this._trello_card_id_prefix + card_id + this._trello_card_id_suffix;
};


// == Payload ==========================================================================================================

module.exports.Payload = function(data) {
    _.extend(this, data);

    this.issue = new Issue(this.issue);
};
