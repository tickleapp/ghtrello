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

var assert = require('chai').assert, fs = require('fs'), path = require('path');
var models = require('./../models/github');

describe('GitHub Models', function() {

    describe('Payload Model', function() {
        it('should be able to parse Issue object', function() {
            var jsonPath = path.join(__dirname, 'assets', 'github-webhook-issue-opened.json');
            var jsonString = fs.readFileSync(jsonPath, {encoding: 'utf8'});
            var payload = new models.Payload(JSON.parse(jsonString));

            assert.instanceOf(payload.issue, models.Issue);
        });
    });

    describe('Issue Model', function() {

        describe('Trello Card ID', function() {
            it('should not be able to get a Trello Card Id', function() {
                var jsonPath = path.join(__dirname, 'assets', 'github-webhook-issue-opened.json');
                var jsonString = fs.readFileSync(jsonPath, {encoding: 'utf8'});
                var payload = new models.Payload(JSON.parse(jsonString));

                assert.isUndefined(payload.issue.trello_card_id);
            });

            it('should be able to generate markdown reference', function() {
                assert.strictEqual(models.Issue.trello_card_ref('fmU4Qk8G'),
                    '[Related Trello Card](https://trello.com/c/fmU4Qk8G)');
            });

            it('should be able to create RegExp pattern to find corresponding Trello Card', function() {
                let regex = models.Issue.trello_card_regex();
                assert.isTrue(regex.global);
                assert.isTrue(regex.multiline);
                assert.isFalse(regex.ignoreCase);
                assert.strictEqual(regex.source,
                    '^(\\[Related Trello Card\\]\\(https:\\/\\/trello\\.com\\/c\\/)([A-Za-z0-9]{8})(\\))$');
            });

            it('should be able to get a Trello Card Id which is "fmU4Qk8G"', function() {
                var jsonPath = path.join(__dirname, 'assets', 'github-webhook-issue-opened-trello-card-id.json');
                var jsonString = fs.readFileSync(jsonPath, {encoding: 'utf8'});
                var payload = new models.Payload(JSON.parse(jsonString));

                assert.isString(payload.issue.trello_card_id);
                assert.strictEqual(payload.issue.trello_card_id, 'fmU4Qk8G');
            });

            it('should not be able to set a Trello Card Id', function() {
                var jsonPath = path.join(__dirname, 'assets', 'github-webhook-issue-opened.json');
                var jsonString = fs.readFileSync(jsonPath, {encoding: 'utf8'});
                var payload = new models.Payload(JSON.parse(jsonString));

                assert.isString(payload.issue.body);
                assert.strictEqual(payload.issue.body.length, 0);
                assert.isUndefined(payload.issue.trello_card_id);

                payload.issue.trello_card_id = '23456789';
                assert.strictEqual(payload.issue.body, '\n[Related Trello Card](https://trello.com/c/23456789)');

                payload.issue.body = 'yo~~~';
                payload.issue.trello_card_id = '23456789';
                assert.strictEqual(payload.issue.body, 'yo~~~\n[Related Trello Card](https://trello.com/c/23456789)');

                payload.issue.trello_card_id = '56789123';
                assert.strictEqual(payload.issue.body, 'yo~~~\n[Related Trello Card](https://trello.com/c/56789123)');
            });
        });

    });
});
