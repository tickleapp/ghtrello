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

var _ = require('lodash');
var GitHubModels = require('./../models/github'), TrelloModels = require('./../models/trello');
var handler = module.exports.handler = require('github-webhook-handler')(options);


// == Handler basic ====================================================================================================

handler.on('error', function (err) {
    console.log(_.repeat('-', 79));
    console.log(new Date());
    console.error('Github Webhook Error:', err.message);
});

function basicListener(event) {
    console.log(_.repeat('-', 79));
    console.log(new Date());
    console.log('Received GitHub Event: %s %s#%d %s',
        event.event, event.payload.repository.full_name, event.payload.issue.number, event.payload.action);
}
handler.on('issues', basicListener);
handler.on('issue_comment', basicListener);


// == Event handlers ===================================================================================================

function handleIssueLabels(githubIssue, trelloCard) {
    if (githubIssue.state !== 'open' || trelloCard.closed) {
        return;
    }

    // labels: resolved
    var body, successMessage, errorMessage;
    if (typeof _.find(githubIssue.labels, 'name', 'resolved') !== 'undefined') {
        if (trelloCard.idList !== process.env.TRELLO_QA_LIST) {
            // Rule 6
            console.log('This issue has `resolved` label. Move corresponding Trello card to `QA`.');
            body = {
                idList: process.env.TRELLO_QA_LIST,
                idBoard: process.env.TRELLO_CURRENT_DEV_BOARD
            };
            successMessage = 'Success to move card to `QA` list.';
            errorMessage = 'Failed to move card to `QA` list.';
        }
    } else {
        if (trelloCard.idList === process.env.TRELLO_QA_LIST) {
            // Rule 7
            console.log('This issue doesn\'t have `resolved` label. ' +
                'Move corresponding Trello card back to `In Progress` if it\'s in `QA`.');
            body = {
                idList: process.env.TRELLO_CURRENT_DEV_NEXT_UP_LIST,
                idBoard: process.env.TRELLO_CURRENT_DEV_BOARD
            };
            successMessage = 'Success to move card to `Next Up` list of `Current Dev` board.';
            errorMessage = 'Failed to move card to `Next Up` list of `Current Dev` board.';
        }
    }

    if (body && successMessage && errorMessage) {
        TrelloModels.requestTrelloAPI({
            url: 'https://api.trello.com/1/cards/' + trelloCard.id,
            method: 'PUT',
            body: body
        }, function(trelloMoveCardSuccess, r) {
            if (trelloMoveCardSuccess) {
                console.log(successMessage);
            } else {
                console.error(errorMessage, r);
            }
        });
    }
}

handler.on('issues', function(event) {
    var payload = new GitHubModels.Payload(event.payload);
    var trello_card_id = payload.issue.trello_card_id;

    // opened / closed status
    if (typeof trello_card_id === 'undefined') {
        console.log('Cannot find related ID of Trello card on this issue.');
        if (payload.action === 'opened') {
            // Rule 1
            console.log('Create a corresponding Trello card for this new issue.');
            TrelloModels.requestTrelloAPI({
                url: 'https://api.trello.com/1/cards/',
                method: 'POST',
                body: {
                    name: payload.issue.title,  // Card Title
                    desc: '[Related GitHub Issue](' + payload.issue.html_url + ')',  // Card Body
                    due: 'null',
                    idList: process.env.TRELLO_GITHUB_LIST,
                    urlSource: 'null'
                }
            },
            function(trelloSuccess, trelloResult) {
                if (trelloSuccess) {
                    console.log('Trello card created. (' + trelloResult.shortUrl + ')');
                    // Write back to GitHub
                    GitHubModels.requestGitHubAPI({
                        method: 'PATCH',
                        url: payload.issue.url,
                        body: {
                            body: payload.issue.body + '\n' +
                                GitHubModels.Issue.trello_card_id_ref_link_text + '(' + trelloResult.shortUrl + ')'
                        }
                    }, function(githubSuccess, githubResult) {
                        if (githubSuccess) {
                            console.log('Success to update GitHub issue with Trello Card ID');
                            handleIssueLabels(payload.issue, trelloResult);
                        } else {
                            console.error('Failed to update GitHub issue with Trello Card ID. ', githubResult);
                        }
                    });
                } else {
                    console.error(trelloResult);
                }
            });
        }
        return;
    }

    TrelloModels.requestTrelloAPI({
        method: 'GET',
        url: 'https://api.trello.com/1/cards/' + trello_card_id
    },
    function(trelloCardInfoSuccess, trelloCard) {
        if (trelloCardInfoSuccess) {
            var body, successMessage, errorMessage;
            if (payload.action === 'closed') {
                if (trelloCard.idList === process.env.TRELLO_GITHUB_LIST) {
                    // Rule 2
                    console.log('Archive this card');
                    body = {
                        closed: 'true'
                    };
                    successMessage = 'Success to archive this card.';
                    errorMessage = 'Failed to archive this card.';
                } else if (trelloCard.idBoard !== process.env.TRELLO_LIVE_BOARD ||
                           trelloCard.idList !== process.env.TRELLO_READY_LIST) {
                    // Rule 3
                    console.log('Move this card to `Ready to Ship` list');
                    body = {
                        idList: process.env.TRELLO_READY_LIST,
                        idBoard: process.env.TRELLO_CURRENT_DEV_BOARD
                    };
                    successMessage = 'Success to move card to `Ready to Ship` list.';
                    errorMessage = 'Failed to move card to `Ready to Ship` list.';
                }
            } else if (payload.action === 'reopened') {
                if (trelloCard.closed) {
                    // Rule 4
                    console.log('Trello card is archived. Will unarchive it');
                    body = {
                        closed: 'false'
                    };
                    successMessage = 'Success to unarchive this card.';
                    errorMessage = 'Failed to unarchive this card.';
                } else if (trelloCard.idBoard === process.env.TRELLO_LIVE_BOARD ||
                           trelloCard.idList === process.env.TRELLO_READY_LIST) {
                    // Rule 5
                    console.log('Trello card is at `Live` board or at `Ready to Ship` list. ' +
                        'Will move it back to `GitHub` list of `Bugs` board.');
                    body = {
                        idList: process.env.TRELLO_GITHUB_LIST,
                        idBoard: process.env.TRELLO_BUGS_BOARD
                    };
                    successMessage = 'Success to move card to `GitHub` list.';
                    errorMessage = 'Failed to move card to `GitHub` list.';
                }
            }

            if (body && successMessage && errorMessage) {
                TrelloModels.requestTrelloAPI({
                    url: 'https://api.trello.com/1/cards/' + trello_card_id,
                    method: 'PUT',
                    body: body
                }, function(trelloMoveCardSuccess, r) {
                    if (trelloMoveCardSuccess) {
                        console.log(successMessage);
                        handleIssueLabels(payload.issue, trelloCard);
                    } else {
                        console.error(errorMessage, r);
                    }
                });
            } else {
                handleIssueLabels(payload.issue, trelloCard);
            }
        } else {
            console.error('Failed to fetch Trello card info (' + trello_card_id + ')');
        }
    });
});
