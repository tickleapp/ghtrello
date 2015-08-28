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

var syncRequest = require('sync-request');

// Load ENV and arguments ----------------------------------------------------------------------------------------------
require('dotenv').load({silent: true});
var argv = require('yargs')
    .usage('$0 action [...arguments of actions]')
    .demand(1)
    .command('token', 'get a URL to request user\'s token.', function(yargs) {
        argv = yargs
            .option('expiration', {
                choices: ['1hour', '1day', '30days', 'never'],
                describe: 'Token life time',
                type: 'string',
                default: 'never',
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
    .command('create', 'create a webhook.', function(yargs) {
        argv = yargs
            .option('url', {
                describe: 'Webhook destination URL',
                type: 'string',
                demand: true
            })
            .option('model-id', {
                describe: 'ID of model to observe',
                type: 'string',
                demand: true
            })
            .option('description', {
                describe: 'Description of this webhook',
                type: 'string'
            })
            .help('h')
            .alias('h', 'help')
            .argv;
    })
    .command('list', 'list all webhooks')
    .command('delete', 'delete a webhook', function(yargs) {
        argv = yargs
            .option('webhook-id', {
                alias: 'id',
                describe: 'the webhook to be deleted',
                type: 'string',
                demand: true
            })
            .help('h')
            .alias('h', 'help')
            .argv;
    })
    .command('get', 'get information of a webhook', function(yargs) {
        argv = yargs
            .option('webhook-id', {
                alias: 'id',
                describe: 'the webhook to be inspected',
                type: 'string',
                demand: true
            })
            .help('h')
            .alias('h', 'help')
            .argv;
    })
    .command('modify', 'modify a webhook', function(yargs) {
        argv = yargs
            .option('webhook-id', {
                alias: 'id',
                describe: 'the webhook to be modified',
                type: 'string',
                demand: true
            })
            .option('description', {
                alias: 'd',
                describe: 'new description of this webhook',
                type: 'string',
            })
            .option('url', {
                describe: 'new url of this webhook',
                type: 'string',
            })
            .option('model-id', {
                describe: 'model ID of new observe target of this webhook',
                type: 'string',
            })
            .option('active', {
                describe: 'switch of this webhook',
                type: 'string',
                choices: ['true', 'false']
            })
            .help('h')
            .alias('h', 'help')
            .argv;
    })
    .help('h')
    .alias('h', 'help')
    .argv;

// Function bodies -----------------------------------------------------------------------------------------------------
function token() {
    console.log('Token request URL: \n' +
        'https://trello.com/1/authorize?key=' +
        process.env.TRELLO_KEY +
        '&name=' +
        encodeURIComponent(argv['app-name']) +
        '&expiration=' +
        argv.expiration +
        '&response_type=token&scope=' + argv.scope.join(','));
}

function create() {
    var url = 'https://api.trello.com/1/webhooks?key=' +
        process.env.TRELLO_KEY +
        '&token=' +
        process.env.TRELLO_TOKEN +
        '&idModel=' +
        argv['model-id'] +
        '&callbackURL=' +
        encodeURIComponent(argv.url);

    if (argv.description) {
        url += '&description=' + encodeURIComponent(argv.description);
    }

    try {
        console.log(JSON.parse(syncRequest('POST', url).getBody().toString()));
    } catch (error) {
        console.error(error.message);
    }
}

function list() {
    var url = 'https://api.trello.com/1/tokens/' + process.env.TRELLO_TOKEN + '/webhooks?key=' + process.env.TRELLO_KEY;
    console.log(JSON.parse(syncRequest('GET', url).getBody().toString()));
}

function modify() {
    var url = 'https://api.trello.com/1/webhooks/' +
        argv['webhook-id'] +
        '?key=' +
        process.env.TRELLO_KEY +
        '&token=' +
        process.env.TRELLO_TOKEN;

    if (argv.description) {
        url += '&description=' + encodeURIComponent(argv.description);
    }
    if (argv.url) {
        url += '&callbackURL=' + encodeURIComponent(argv.url);
    }
    if (argv['model-id']) {
        url += '&idModel=' + argv['model-id'];
    }
    if (argv.active) {
        url += '&active=' + argv.active;
    }

    try {
        console.log(JSON.parse(syncRequest('PUT', url).getBody().toString()));
    } catch (error) {
        console.error(error.message);
    }
}

function deleteWebhook() {
    var url = 'https://api.trello.com/1/webhooks/' +
        argv['webhook-id'] +
        '?key=' +
        process.env.TRELLO_KEY +
        '&token=' +
        process.env.TRELLO_TOKEN;
    try {
        console.log(JSON.parse(syncRequest('DELETE', url).getBody().toString()));
    } catch (error) {
        console.error(error.message);
    }
}

function get() {
    var url = 'https://api.trello.com/1/webhooks/' +
        argv['webhook-id'] +
        '?key=' +
        process.env.TRELLO_KEY +
        '&token=' +
        process.env.TRELLO_TOKEN;
    try {
        console.log(JSON.parse(syncRequest('GET', url).getBody().toString()));
    } catch (error) {
        console.error(error.message);
    }
}

// -- Dispatch ---------------------------------------------------------------------------------------------------------
process.exit({
    token: token,
    create: create,
    list: list,
    delete: deleteWebhook,
    modify: modify,
    get: get
}[argv._[0]]() || 0);
