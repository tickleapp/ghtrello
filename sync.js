#!/usr/bin/env node --harmony --use_strict --harmony_generators
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

// Load .env and ENV
require('dotenv').load({silent: true});

var _ = require('lodash');
var GitHubModel = require('./models/github'), TrelloModels = require('./models/trello');

var argv = require('yargs')
    .demand(1)
    .argv;

// Get all issues
var issues = [];
var nextIssueURL = 'https://api.github.com/repos/' + argv._[0] + '/issues';
function rawLinkHeaderParser(rawStr) {
    let links = {};
    if (rawStr) {
        _.each(rawStr.split(','), function(str) {
            var strComponents = _.trim(str).split(';');
            var url = strComponents[0].substr(1, strComponents[0].length-2);
            var key = _.trim(strComponents[1]).split('=')[1];
            key = key.substr(1, key.length-2);
            links[key] = url;
        });
    }
    return links;
}
while (nextIssueURL) {
    var issuesListResponse = GitHubModel.syncRequestGitHubAPI({url: nextIssueURL});
    var rawLinkHeader = issuesListResponse.headers.link;
    nextIssueURL = rawLinkHeaderParser(rawLinkHeader).next;

    issues = issues.concat(JSON.parse(issuesListResponse.getBody('utf8')));
}
issues = _.map(issues, function(data) { return new GitHubModel.Issue(data); });

// Check all issues
_.each(_.filter(issues, function(issue) { return typeof issue.trello_card_id === 'undefined'; }), function(issue) {
    var trelloCard;
    try {
        trelloCard = JSON.parse(TrelloModels.syncRequestTrelloAPI({
            url: 'https://api.trello.com/1/cards/',
            method: 'POST',
            body: {
                name: issue.title,  // Card Title
                desc: '[Related GitHub Issue](' + issue.html_url + ')',  // Card Body
                due: 'null',
                idList: process.env.TRELLO_GITHUB_LIST,
                urlSource: 'null'
            }
        }).getBody('utf8'));
    } catch (e) {
        console.error('Failed to create Trello Card. (gh=%s)', issue.number);
        return;
    }

    // Write back to GitHub
    try {
        GitHubModel.syncRequestGitHubAPI({
            method: 'PATCH',
            url: issue.url,
            body: {
                body: issue.body + '\n' +
                    GitHubModel.Issue.trello_card_id_ref_link_text + '(' + trelloCard.shortUrl + ')'
            }
        }).getBody('utf8');
    } catch (e) {
        console.error('Failed to update GitHub issue with Trello Card ID. (gh=%s, trello=)',
            issue.number, trelloCard.shortUrl);
        return;
    }
});
