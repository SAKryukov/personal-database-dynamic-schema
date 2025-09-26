/*
Personal Database

Copyright (c) 2017, 2023, 2025 by Sergey A Kryukov
http://www.SAKryukov.org
http://www.codeproject.com/Members/SAKryukov
*/

"use strict";

const definitionSet = {

    product: "Personal Database",
    version: "5.2.0",
    years: "2017, 2023, 2025",

    productFormat: function() { return `${this.product} v.&thinsp;${this.version}`; },
    titleFormat: function(value) { return value ? `${value} — ${this.product}` : `${this.product}` },

    eventHandler: {
        dataModifiedRequest: "Data is <i><b>modified</b></i>.<br/>Do you want to continue?",
        dataModifiedRequestButtonConfirm: "Proceed",
        dataModifiedRequestButtonCancel: "Cancel",
        dataModifiedRequestStyles: {
            cssClass: "exception",
        },
        readOnlyEvent: "readonly",
        modifiedEvent: "modified",
        storedEvent: "stored",
        readOnlyIndicator: ["Read/Write", "Read-only"],
        modifiedIndicator: "✷",
    },

    search: {
        foundNumber: found => `${found} found`,
    },
      
    table: {
        headerTag: "th",
        tableTag: "table",
        rowIndexHeader: "#",
        initialPropertyName: "Name",
        initialData: { properties: ["Name"], values: [], records: [[]]},
        initialValue: "",
        editingHint: "Ctrl+Enter: commit, Escape: cancel",
        hint: "cite",
        hintOffset: { x: -3, y: -4 },
        hintTimeout: 4000,
    },

    tableTest: {
        headerText: index => `${index} name`,
        cellText: index => `${index} data`,
    },

    scripting: {
        script: "script",
        dataFunctionName: () => { const SAPersonalDatabase = () => null; return SAPersonalDatabase.name; },
        checkupSignature: function(text) {
            const signature = this.dataFunctionName();
            const regexp = new RegExp(`^const\\s+${signature}\\s*=\\s*\{`);
            if (!regexp.test(text.trim()))
                throw new Error(`Invalid signature. Database file should start with:<br/><code>const ${signature} = {</code>`);
        }, //checkupSignature
        extractJson: text =>
            text.substring(
                text.indexOf("{"), text.length - 1).trim(),
        wrapJson: function(json) {
            return `const ${this.dataFunctionName()}=${json};`;
        },
        invalidDatabase: "Invalid database",
    },

    exceptions: {
        commandNotDefined: element => `Define "data-command" for the element ${element.tagName} "${element.textContent}"`,
        commandNotFound: commandKey => `Command not found: "${commandKey}"`,
    },

    CSS: {
        found: "found",
        selection: "select",
        URI: "URI",
        buttonUp: "up",
        buttonDown: "down",
        scopeSelector: childrenSelector => `:scope ${childrenSelector}`,
        coordinate: value => `${value}px`,
        visibility: {
            visible: "visible",
            hidden: "hidden",
        },
        display: {
            none: "none",
            button: "inline",
        },
        position: {
            hint: "absolute",
        },
    },

    events: {
        click: "click",
    },

    attributes: {
        disabled: "disabled",
    },

    keyboard: {
        left: "ArrowLeft",
        right: "ArrowRight",
        up: page => page ? "PageUp" : "ArrowUp",
        down: page => page ? "PageDown" : "ArrowDown",
        home: "Home",
        end: "End",
        escape: "Escape",
        enter: "Enter",
        edit: "F2",
        findNext: "F3",
    },

    fileIO: {
        accept: ".sadb",
        filePickerOptions: function() {
            return {
               types: [
                    {
                        description: "SADB or JSON file",
                        accept: { "application/ecmascript": [this.accept, ".json"] },
                    },                
                ],
                suggestedName: this.defaultSaveFilename(),
                startIn: "downloads",
            };
        },
        defaultSaveFilename: function() { return `default${this.accept}`; },
    },

    time: {
        fixISOTime: time => time.replaceAll("-", "/").replaceAll("T", " ").slice(0, time.indexOf(".")),
        formatTime : function(time) {
            const result = time.toISOString();
            let timezoneOffset = -time.getTimezoneOffset()/60;
            const sign = timezoneOffset > 0 ? "+" : String.fromCodePoint(0x2212); // typographically correct minus
            timezoneOffset = Math.abs(timezoneOffset);  
            return `${this.fixISOTime(result)} UTC${sign}${timezoneOffset}`;    
        },
    },

    persistence: {
        toText: element => {
            if (element.innerHTML.includes("<br")) {
                const lines = element.innerHTML.split("<br>");
                const result = [];
                for (let line of lines) {
                    const node = document.createElement("p");
                    node.innerHTML = line;
                    result.push(node.textContent);
                } //loop
                return result.join("\n");
            } else
                return element.textContent; 
        }, //toText
        fromText: (element, data) => {
            if (data.includes("\n")) {
                element.textContent = "";
                const lines = data.split("\n");
                let lineNumber = 0;
                for (let line of lines) {
                    const node = document.createTextNode(line);
                    node.textContent = line;
                    element.appendChild(node);
                    if (lineNumber < lines.length - 1)
                        element.appendChild(document.createElement("br"));
                    lineNumber++;
                } //loop
            } else
                element.textContent = data;    
        }, //fromText
        formatPersistenceErrorMessage: (message, fileName) =>
            `<p>${message}</p><p>Script: ${String.fromCodePoint(0x201c)}${fileName}${String.fromCodePoint(0x201d)}</p>`,
    }, //persistence

    URI: {
        HTTP: ["https://", "http://"],
        newTab: "_blank",
    },

    initialize: function() {
        const freezeObject = object => {
            for (let index in object) {
                const property = object[index];
                if (property && property.constructor == Object)
                    freezeObject(property);
            } //loop
            Object.freeze(object);
        }; //freezeObject
        freezeObject(this);
    } //initialize

} //const definitionSet

definitionSet.initialize();
