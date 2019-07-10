/*
 * Iopa Bot Framework
 * Copyright (c) 2016-2019 Internet of Protocols Alliance
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

import { constants } from 'iopa'
const { IOPA, SERVER } = constants
import { BOT } from 'iopa-bot'

import { default as memorySessionDbMiddleware } from '../db/memorySession'
import { asyncForEach } from 'iopa-bot/dist/util/forEachAsync'

export interface AppConsoleExtensions {
  listen: Function
}

var readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})

var env = {
  user: {
    name: 'local'
  }
}

export default class ConsoleBot {
  constructor(app) {
    app.use(this.invoke_)
    app.use(memorySessionDbMiddleware)

    app.listen = function() {
      readline.on('line', function(input) {
        var context = new IopaConsole(readline, input)
        app.invoke(context)
      })

      var launch = new IopaConsole(readline, '')
      launch[BOT.Intent] = BOT.INTENTS.Launch
      app.invoke(launch)
    }
  }

  private invoke_ = (context, next) => {
    context[BOT.Source] = BOT.CAPABILITIES.Console
    context[BOT.Intent] =
      context[BOT.Intent] || 'urn:io.iopa.bot:intent:literal'
    context[BOT.Text] = context[IOPA.Body]
    context[BOT.Address] = {}
    context[BOT.Address][BOT.User] = env.user.name
    context[BOT.Timestamp] = new Date().getTime()

    context.response.status(200)

    context.response.show = function() {
      throw new Error('not implemented')
    }

    context.response[BOT.ShouldEndSession] = false

    context.response.shouldEndSession = function(flag, ignore) {
      context.response[BOT.ShouldEndSession] = flag
    }

    var dbsession = context[SERVER.Capabilities][BOT.CAPABILITIES.Session]

    return dbsession
      .get(context[BOT.Address][BOT.User])
      .then(function(session) {
        context[BOT.Session] = session
      })
      .then(next)
  }
}

class IopaConsole {
  private response: IopaConsoleResponse
  private log: any

  constructor(_console, req) {
    this[IOPA.Body] = req
    this[IOPA.RawBody] = req
    this[IOPA.Headers] = []
    this[IOPA.Path] = '/'
    this[IOPA.Scheme] = 'console:'
    this[IOPA.QueryString] = null
    this[IOPA.Protocol] = 'IOPA/1.4'
    this[IOPA.Method] = 'GET'
    this[IOPA.Host] = 'localhost'
    this[IOPA.Port] = 0
    this[SERVER.Capabilities] = {}

    this.response = new IopaConsoleResponse(this)
    this.response[IOPA.Body] = null
    this.response[IOPA.StatusCode] = 200
    this.response[SERVER.Capabilities] = {}
    this.response[BOT.isDelayDisabled] = false

    this.log = console.log.bind(console)
    this.log.error = this.log
  }

  done() {
    return Promise.resolve(null)
  }
}

class IopaConsoleResponse {
  private _context: any

  constructor(context) {
    this._context = context
  }

  body(obj2) {
    this[IOPA.Body] = this[IOPA.Body] || {}
    for (var attrname in obj2) {
      this[IOPA.Body][attrname] = obj2[attrname]
    }
    return this
  }

  /** Send responseg back to console */
  send(this: IopaConsoleResponse) {
    var message
    var card

    if (this[IOPA.StatusCode] !== 200) {
      message =
        'Unfortunately an error has occured:\n  ' +
        this[IOPA.StatusCode] +
        ' ' +
        this[IOPA.Body].text
    } else {
      message = this[IOPA.Body].text
      if (this[IOPA.Body].attachments) {
        card = this[IOPA.Body].attachments[0]
      }
    }

    if (!card) {
      console.log('& ' + message.replace(/\\n/g, '\n& '))
    } else {
      if (card.type == 'AdaptiveCard') {
        renderAdaptiveCard(card)
      } else {
        console.log(
          '+----------------------------------------------------------+'
        )
        console.log('+ ' + message)
        console.log(JSON.stringify(card, null, 2))
        console.log(
          '+----------------------------------------------------------+'
        )
      }
    }
    this.resetContext()
    return Promise.resolve(this)
  }

  resetContext() {
    this.status(200)
    this[IOPA.Body] = {}
  }

  fail(msg) {
    console.log('!500 ' + msg)
    return Promise.resolve(this)
  }

  status(code) {
    this[IOPA.StatusCode] = code
    return this
  }

  done() {
    return Promise.resolve(null)
  }

  say(text) {
    if (this[IOPA.Body]) {
      if (this[IOPA.Body].text)
        this[IOPA.Body].text = this[IOPA.Body].text + '\n' + text
      else this[IOPA.Body].text = text
    } else this[IOPA.Body] = { text: text }

    return this
  }

  card(card) {
    this.say(card.text)

    if (card.attachments) {
      this[IOPA.Body].attachments = card.attachments
    }

    if (card.image) {
      this[IOPA.Body].image = card.image
    }

    if (card.title) {
      this[IOPA.Body].attachments = this[IOPA.Body].attachments || []
      this[IOPA.Body].attachments[0] = this[IOPA.Body].attachments[0] || {}
      this[IOPA.Body].attachments[0]['text'] = card.title
    }

    return this
  }

  async sendAll(messages, typingDelay) {
    return asyncForEach(messages, async message => {
      if (typeof message == 'string' || message instanceof String) {
        this.say(message)
      } else {
        this.card({ text: '', attachments: [message] })
      }
      await this.send()
    })
  }

  public reset = () => {
    this.status(200)
    this[IOPA.Body] = {}
    return this
  }
}

function renderAdaptiveCard(item) {
  switch (item.type) {
    case 'AdaptiveCard':
      const { body, actionset } = item
      body.forEach(bodyItem => renderAdaptiveCard(bodyItem))
      if (actionset) {
        renderAdaptiveCard({ type: 'ActionSet', actionset })
      }
      return
    case 'TextBlock':
      console.log(item.text)
      return
    case 'ColumnSet':
      item.columns && item.columns.forEach(column => renderAdaptiveCard(column))
      return
    case 'Column':
      item.items &&
        item.items.forEach(columnItem => renderAdaptiveCard(columnItem))
      return
    case 'ImageSet':
      item.images && item.images.forEach(image => renderAdaptiveCard(image))
      return
    case 'Image':
      console.log(`IMAGE:${item.url}`)
      return
    case 'ActionSet':
      const choices = item.actionset
        .map(action => `[ ] ${action.title}`)
        .join(' ')
      console.log(choices)
      return
    default:
      return
  }
}
