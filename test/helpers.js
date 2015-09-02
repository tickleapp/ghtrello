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

var assert = require('chai').assert, helpers = require('./../helpers.js');

describe('Tests for Helpers', function() {

    describe('RegExp escape', function() {

        it('should be able to escape "http://www.google.com/"', function() {
            assert.strictEqual(helpers.escapeRegExp('http://www.google.com/'), 'http:\\/\\/www\\.google\\.com\\/');
        });

        it('should be able to escape "[Test] This a (labeled) subject."', function() {
            assert.strictEqual(helpers.escapeRegExp('[Test] This a (labeled) subject.'),
                '\\[Test\\] This a \\(labeled\\) subject\\.');
        });

        it('should be able to escape "Is this an *important message?"', function() {
            assert.strictEqual(helpers.escapeRegExp('Is this an *important message?'),
                'Is this an \\*important message\\?');
        });

        it('should be able to escape "2n for ∀n ∋R = {2,4, ...}"', function() {
            assert.strictEqual(helpers.escapeRegExp('2n for ∀n ∋R = {2,4, ...}'),
                '2n for ∀n ∋R = \\{2,4, \\.\\.\\.\\}');
        });

    });

});
