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

import iopaBotFramework, { BOT, AppBotExtensions } from 'iopa-bot'
import * as iopa from 'iopa'

import iopaBotConnectorConsole, { AppConsoleExtensions } from '../src/index'
import { default as memorySessionDbMiddleware } from '../src/db/memorySession'

interface App extends iopa.App, AppBotExtensions, AppConsoleExtensions {}

const app = (new iopa.App() as any) as App
app.use(memorySessionDbMiddleware)
app.use(iopaBotConnectorConsole)
app.use(iopaBotFramework)

// conversation schema -- change to program your bot

app.intent(BOT.INTENTS.Launch, { utterances: ['/launch', '/open'] })

app.dialog('/', [BOT.INTENTS.Launch], function(context, next) {
  context.response.say('Hello!  Please converse with this bot. ').send()
})

app.intent('helloIntent', { utterances: ['hi', 'hello', 'hey'] }, function(
  context,
  next
) {
  context.response.say('Hello World').send()
  return Promise.resolve()
})

app.dialog('/unknown', '*', function(context, next) {
  context.response
    .say("I don't know what you mean by " + context[BOT.Text])
    .send()
  return Promise.resolve()
})

// build and listen to console
app.build()
app.listen()
