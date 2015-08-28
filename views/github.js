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

module.exports.path = '/github/webhook/';
var options = {path: module.exports.path, secret: process.env.GITHUB_WEBHOOK_SECRET || 'secret'};
var handler = module.exports.handler = require('github-webhook-handler')(options);

handler.on('error', function (err) {
  console.error('Github Webhook Error:', err.message);
});

handler.on('issue', function(event) {
});

handler.on('issue_comment', function(event) {
    if (event.payload.action === 'created') {
    }
});
