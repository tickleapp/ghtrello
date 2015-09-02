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

var express = require('express'), bodyParser = require('body-parser'), crypto = require('crypto');
var EventEmitter = require('events').EventEmitter, _ = require('lodash');
var models = require('./../models/trello');

var router = module.exports = express.Router();


// == Signaure verifier ================================================================================================

router.use(bodyParser.raw({type: 'application/json'}));
router.use(function(request, response, next) {
    function base64Digest(s) {
        return crypto.createHmac('sha1', process.env.TRELLO_SECRET).update(s).digest('base64');
    }
    var content = request.body + process.env.TRELLO_WEBHOOK_URL;
    var doubleHash = base64Digest(base64Digest(content));
    var headerHash = base64Digest(request.headers['x-trello-webhook']);

    console.log(_.repeat('-', 79));
    console.log(new Date());

    if (doubleHash === headerHash) {
        try {
            request.body = JSON.parse(request.body.toString());
            next();
        } catch (e) {
            console.error('Bad JSON body');
            response.status(400).json({error: 'Bad JSON body'});
        }
    } else {
        console.error('Bad signature');
        response.status(400).json({error: 'Bad signature'});
    }
});


// == Dispatcher =======================================================================================================

var handler = new EventEmitter();

router.post('/webhook/', function(req, res) {
    var payload = new models.Payload(req.body);
    var emitData = {
        actionType: payload.action.type,
        payload: payload,
        protocol: req.protocol,
        host: req.headers.host,
        url: req.url
    };

    console.log('Received Trello Event: %s %s', payload.action.type, payload.model.url);

    handler.emit(payload.action.type, emitData);
    handler.emit('*', emitData);
    // done
    res.json({'ok': true});
});


// == Handler ==========================================================================================================

handler.on('createCard', function(event) {
    console.log(event.payload.action.type);
});
