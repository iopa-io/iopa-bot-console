# [![IOPA](http://iopa.io/iopa.png)](http://iopa.io)<br> iopa-bot-console

[![NPM](https://img.shields.io/badge/iopa-certified-99cc33.svg?style=flat-square)](http://iopa.io/)
[![NPM](https://img.shields.io/badge/iopa-bot%20framework-F67482.svg?style=flat-square)](http://iopa.io/)

[![NPM](https://nodei.co/npm/iopa-bot-console.png?downloads=true)](https://nodei.co/npm/iopa-bot-console/)

## About

This repository contains a connector the for terminal console for the IOPA Bot Framework.

It is typically used only in localhost testing.

## Example Usage

```js
const iopaBotFramework = require('iopa-bot'),
  iopa = require('iopa'),
  BOT = iopaBotFramework.constants.BOT

require('iopa-bot-console')

var app = new iopa.App()

app.use(iopaBotFramework.connectors.console)
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
})

app.dialog('/unknown', '*', function(context, next) {
  context.response
    .say("I don't know what you mean by " + context[BOT.Text])
    .send()
})

// build and listen to console

app.build()
app.listen()
```

## License

Apache-2.0

## API Reference Specification

[![IOPA](http://iopa.io/iopa.png)](http://iopa.io)
