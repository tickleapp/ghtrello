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

var printJSONRequest = require('./helpers').printJSONRequest, requestUrl = require('./models/trello').requestUrl;

// Load arguments ------------------------------------------------------------------------------------------------------

var argv = require('yargs')
    .usage('$0 action [...arguments of actions]')
    .demand(1)
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
                type: 'string'
            })
            .option('url', {
                describe: 'new url of this webhook',
                type: 'string'
            })
            .option('model-id', {
                describe: 'model ID of new observe target of this webhook',
                type: 'string'
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

function create() {
    var requestArgs = {idModel: argv['model-id'], callbackURL: argv.url};
    if (argv.description) {
        requestArgs.description = argv.description;
    }
    printJSONRequest('POST', requestUrl('1/webhooks', requestArgs));
}

function list() {
    printJSONRequest('GET', requestUrl('1/tokens/' + process.env.TRELLO_TOKEN + '/webhooks'));
}

function modify() {
    var requestArgs = {idModel: argv['model-id'], callbackURL: argv.url};
    if (argv.description) {
        requestArgs.description = argv.description;
    }
    if (argv.url) {
        requestArgs.callbackURL = argv.url;
    }
    if (argv['model-id']) {
        requestArgs.idModel = argv['model-id'];
    }
    if (argv.active) {
        requestArgs.active = argv.active;
    }

    printJSONRequest('PUT', requestUrl('1/webhooks/' + argv['webhook-id'], requestArgs));
}

function deleteWebhook() {
    printJSONRequest('DELETE', requestUrl('1/webhooks/' + argv['webhook-id']));
}

function get() {
    printJSONRequest('GET', requestUrl('1/webhooks/' + argv['webhook-id']));
}


// -- Dispatch ---------------------------------------------------------------------------------------------------------

process.exit({
    create: create,
    list: list,
    delete: deleteWebhook,
    modify: modify,
    get: get
}[argv._[0]]() || 0);
