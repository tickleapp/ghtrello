#!/usr/bin/env node
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

require('dotenv').load({silent: true});
var syncRequest = require('sync-request'), requestUrl = require('./models/trello').requestUrl, _ = require('lodash');

// Load arguments ------------------------------------------------------------------------------------------------------
var argv = require('yargs')
    .usage('$0 action [...arguments of actions]')
    .demand(1)
    .command('token', 'Get a URL to request user\'s token.', function(yargs) {
        argv = yargs
            .option('expiration', {
                choices: ['1hour', '1day', '30days', 'never'],
                describe: 'Token life time',
                type: 'string',
                default: 'never'
            })
            .option('app-name', {
                describe: 'App name to be shown on the authorization request webpage and user\'s settings.',
                type: 'string',
                default: 'Tickle ghtrello'
            })
            .option('scope', {
                describe: 'App name to be shown on the authorization request webpage and user\'s settings.',
                type: 'array',
                choices: ['read', 'write', 'account'],
                default: ['read', 'write']
            })
            .help('h')
            .alias('h', 'help')
            .argv;
    })
    .command('request', 'Request Trello API', function(yargs) {
        argv = yargs
            .demand(2)
            .argv;
    })
    .help('h')
    .alias('h', 'help')
    .argv;


// Function bodies -----------------------------------------------------------------------------------------------------

function token() {
    console.log('Token request URL: \n' + requestUrl('1/authorize', {
        name: argv['app-name'],
        expiration: argv.expiration,
        scope: argv.scope.join(','),
        response_type: 'token'
    }));
}

function request() {
    var url = requestUrl(argv._[1], _.pick(argv, function(value, key) {
        return key !== '$0' && key !== '_';
    }));
    try {
        console.log(JSON.parse(syncRequest('GET', url).getBody().toString()));
    } catch (error) {
        console.error(error.message);
    }
}


// -- Dispatch ---------------------------------------------------------------------------------------------------------

process.exit({
    token: token,
    request: request
}[argv._[0]]() || 0);
