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

var express = require('express');
var bodyParser = require('body-parser');
var crypto = require('crypto');


var router = module.exports = express.Router();

// Verify content signature and parse json
router.use(bodyParser.raw({type: 'application/json'}));
router.use(function(request, response, next) {
    function base64Digest(s) {
        return crypto.createHmac('sha1', process.env.TRELLO_SECRET).update(s).digest('base64');
    }
    var content = request.body + process.env.TRELLO_WEBHOOK_URL;
    var doubleHash = base64Digest(base64Digest(content));
    var headerHash = base64Digest(request.headers['x-trello-webhook']);

    if (doubleHash === headerHash) {
        request.body = JSON.parse(request.body.toString());
        next();
    } else {
        response.status(400).send('Bad signature');
    }
});

// Go
router.post('/webhook/', function(req, res) {
    res.send('ok');
});
