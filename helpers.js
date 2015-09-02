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

var syncRequest = require('sync-request');

module.exports.printJSONRequest = function(method, url) {
    try {
        console.log(JSON.parse(syncRequest(method, url).getBody().toString()));
    } catch (error) {
        console.error(error.message);
    }
};

module.exports.escapeRegExp = function(str) {
    // Ref: http://stackoverflow.com/questions/3446170/escape-string-for-use-in-javascript-regex
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
};
