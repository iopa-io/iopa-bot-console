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

const iopaBotFramework = require('iopa-bot');

if (!iopaBotFramework)
   throw new Error("iopa-bot must be a dependency of host package");

function addProperty(obj, property, modulePath) {
    // Add properties as getter to delay load the modules on first invocation
    Object.defineProperty(obj, property, {
        configurable: true,
        get: function () {
            var module = require(modulePath);
            // We do not need the getter any more
            obj[property] = module;
            return module;
        }
    });
}

module.exports = {};
addProperty(iopaBotFramework.connectors, "console", "./src/connectors/console");
addProperty(module.exports, "console", "./src/connectors/console");
