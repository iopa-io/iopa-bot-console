/*
 * Iopa Bot Framework
 * Copyright (c) 2016 Internet of Protocols Alliance 
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const iopaBotFramework = require('iopa-bot'),
      iopa = require('iopa'),
      BOT = iopaBotFramework.constants.BOT;

require('../index');  // iopa-bot-console

var app = new iopa.App();

app.use(iopaBotFramework.connectors.console);
app.use(iopaBotFramework);

// conversation schema -- change to program your bot

app.intent(BOT.INTENTS.Launch, { "utterances": ['/launch', '/open'] })

app.dialog('/', [BOT.INTENTS.Launch], function(context, next) {
    context.response.say("Hello!  Please converse with this bot. ").send();
});

app.intent('helloIntent', { "utterances": ['hi', 'hello', 'hey'] }, function(context, next) {
     context.response.say("Hello World").send();
})

app.dialog('/unknown', '*', function(context, next) {
    context.response.say("I don't know what you mean by " + context[BOT.Text]).send();
});

// build and listen to console

app.build();
app.listen();