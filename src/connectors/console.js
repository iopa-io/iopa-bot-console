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

const iopa = require('iopa'),
  constants = iopa.constants,
  IOPA = constants.IOPA,
  SERVER = constants.SERVER, 
  BOT = require('iopa-bot').constants.BOT;

const memorySessionDbMiddleware = require('../db/memorySession');

var readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})

var env = {
  user: {
    name: "local"
  }
}

var ConsoleBot = function (app) {
    app.use(ConsoleBot.invoke_);
    app.use(memorySessionDbMiddleware);

    app.listen = function () {
        readline.on('line', function (input) {
            var context = new IopaConsole(readline, input);
            app.invoke(context);
        });

         var launch = new IopaConsole(readline, "");
         launch[BOT.Intent] = BOT.INTENTS.Launch;
         app.invoke(launch);
    };
};

module.exports = ConsoleBot;

ConsoleBot.invoke_ = function (context, next) {
    context[BOT.Source] = BOT.CAPABILITIES.Console;
    context[BOT.Intent] = context[BOT.Intent] || "urn:io.iopa.bot:intent:literal";
    context[BOT.Text] = context[IOPA.Body];
    context[BOT.Address] = {};
    context[BOT.Address][BOT.User] = env.user.name;
    context[BOT.Timestamp] = new Date().getTime();

    context.response.status(200);
   
    context.response.reset = ConsoleBot._resetContext.bind(null, context);
    context.response.say = ConsoleBot._say.bind(null, context);
    context.response.card = ConsoleBot._card.bind(null, context);
    context.response.show = function(){};
  
    context.response[BOT.ShouldEndSession] = false;
    context.response.shouldEndSession = function(flag, ignore) {
        context.response[BOT.ShouldEndSession] = flag;
    }

    var dbsession = context[SERVER.Capabilities][BOT.CAPABILITIES.Session];
  
    return dbsession.get(context[BOT.Address][BOT.User]).then(function (session) {
        context[BOT.Session] = session;
    })        
    .then(next);
};

ConsoleBot._say = function (context, text) {
    if (context.response[IOPA.Body]) {
        if (context.response[IOPA.Body].text)
            context.response[IOPA.Body].text = context.response[IOPA.Body].text + "\n" + text;
        else
            context.response[IOPA.Body].text = text;
    } else
        context.response[IOPA.Body] = { text: text };

    return context.response;
}

ConsoleBot._fail = function(context, error, message, in_channel) {
    context.response[IOPA.StatusCode] = context.response[IOPA.StatusCode] || 200;

    context.res[IOPA.Body] = {
        text: message + ": " + error
    }
    context.done();
}

ConsoleBot._card = function(context, card) {

    /* 
        type: "Standard",
        title: survey[question],
        text: "Question #" + (question + 1),
        image: {
            smallImageUrl: "https://crossorigin.me/https://mediakit.synchronoushealth.co/img/likert.png",
            largeImageUrl: "https://crossorigin.me/https://mediakit.synchronoushealth.co/img/likert-lg.png"
        }
        attachments: {
            text: "One line optional text attachment, sometimes replaced by title",
            actions: [{ text: "Yes", type: "button", value: "YesIntent"}, ...]
        }
    */

    context.response.say(card.text);

    if (card.attachments)
          context.response[IOPA.Body].attachments = card.attachments;

    if (card.image)
          context.response[IOPA.Body].image = card.image;

    if (card.title)
    {
         context.response[IOPA.Body].attachments =  context.response[IOPA.Body].attachments || [];
         context.response[IOPA.Body].attachments[0] = context.response[IOPA.Body].attachments[0] || {};
         context.response[IOPA.Body].attachments[0]["text"] = card.title;
    }

    return context.response;
}

ConsoleBot._resetContext = function(context) {
    context.response.status(200);
    context.response[IOPA.Body] = {}; 
    return context;
}

function IopaConsole(_console, req) {
  this[IOPA.Body] = req;
  this[IOPA.RawBody] = req;
  this[IOPA.Headers] = [];
  this[IOPA.Path] = "/";
  this[IOPA.Scheme] = "console:";
  this[IOPA.QueryString] = null;
  this[IOPA.Protocol] = "IOPA/1.4";
  this[IOPA.Method] = "GET";
  this[IOPA.Host] = "localhost";
  this[IOPA.Port] = 0;
  this[SERVER.Capabilities] = {};

  this.response = new IopaConsoleResponse(this);
  this.response[IOPA.Body] = null;
  this.response[IOPA.StatusCode] = 200
  this.response[SERVER.Capabilities] = {};

  this.log = console.log.bind(console);
  this.log.error = this.log;
}

IopaConsole.prototype.done = function () {
  return Promise.resolve(null);
};

function IopaConsoleResponse(context) {
  this._context = context;
}

IopaConsoleResponse.prototype.body = function (obj2) {
  this[IOPA.Body] = this[IOPA.Body] || {};
  for (var attrname in obj2) { this[IOPA.Body][attrname] = obj2[attrname]; }
  return this;
};

IopaConsoleResponse.prototype.send = function () {
  if (this[IOPA.StatusCode] != 200)
     console.log("!" + this[IOPA.StatusCode] + " " + this[IOPA.Body].text);
  else
  {
      if (!this[IOPA.Body].attachments)
        console.log("& " + this[IOPA.Body].text.replace(/\\n/g, '\n& '));
      else
      {
          console.log("+----------------------------------------------------------+");
          console.log("+ "+  this[IOPA.Body].text);
        
          if (this[IOPA.Body].attachments[0].text)
             console.log("+ | " + this[IOPA.Body].attachments[0].text);
        
          if (this[IOPA.Body].image && this[IOPA.Body].image.smallImageUrl)
             console.log("IMAGE " + this[IOPA.Body].image.smallImageUrl);
  
          if (this[IOPA.Body].attachments[0].actions)
             console.log("+ [ " + this[IOPA.Body].attachments[0].actions.map(function(item){ return item.text; }).join(", ") + "] ");

         console.log("+----------------------------------------------------------+");
      }
  }
  return Promise.resolve(this);
};

IopaConsoleResponse.prototype.fail = function (msg) {
  console.log( "!500 " + msg);
  return Promise.resolve(this);
};

IopaConsoleResponse.prototype.status = function (code) {
  this[IOPA.StatusCode] = code;
  return this;
};

IopaConsoleResponse.prototype.done = function () {
  return Promise.resolve(null);
};