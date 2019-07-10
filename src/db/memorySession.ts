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

export interface SessionDBCapability {
  get(path: string): Promise<any>
  put(path: string, blob: any): Promise<void>
  delete(path): Promise<void>
}

export default function MemorySessionMiddleware(this: any, app) {
  if (app.properties['server.Capabilities']['urn:io.iopa.database:session'])
    throw new Error('Session Database already registered for this app')

  this.app = app

  var db = {}
  this.db = db

  app.properties['server.Capabilities']['urn:io.iopa.database:session'] = {
    get: function(path) {
      return Promise.resolve(db[path])
    },
    put: function(path, blob) {
      if (blob) blob.timestamp = new Date().getTime()
      db[path] = blob
      return Promise.resolve()
    },
    delete: function(path) {
      delete db[path]
      return Promise.resolve()
    }
  } as SessionDBCapability

  app.properties['server.Capabilities']['urn:io.iopa.database:session'][
    'iopa.Version'
  ] = '2.0'

  app.properties['server.Capabilities']['urn:io.iopa.database'] =
    app.properties['server.Capabilities']['urn:io.iopa.database'] ||
    app.properties['server.Capabilities']['urn:io.iopa.database:session']
}
