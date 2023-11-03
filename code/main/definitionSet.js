"use strict";

const definitionSet = {

    product: "Personal Database",
    version: "2.0",

    productFormat: function() { return `${this.product} v.&thinsp;${this.version}`; },
    titleFormat: function(value) { return value ? `${value} — ${this.product}` : `${this.product}` },

    eventHandler: {
        dataModifiedRequest: "Data is <i><b>modified</b></i>.<br/>Do you want to continue?",
        dataModifiedRequestButtonConfirm: "Proceed",
        dataModifiedRequestButtonCancel: "Cancel",
        dataModifiedRequestStyles: {
            width: null,
            equalizeButtonWidths: true,
            dimmerOpacity: 0.5,
            dimmerColor: "#332234",
            backgroundColor: { message: "cornSilk", buttonPad: "maroon", button: "aliceBlue" },
            padding: {
                textPad: { horizontal: "2.4em", vertical: "1em" },
                buttonSpacing: "2.4em",
                buttonPad: { horizontal: "2.4em", vertical: "0.6em" },
            },
            buttonFocusOutline: "solid 2.8px cornSilk",
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
    },

    display: {
        hide: "none",
        errorElementShow: "block",
    },

    scripting: {
        script: "script",
        dataFunctionName: () => { const SAPersonalDatabase = () => null; return SAPersonalDatabase.name; },
        alert: function() { alert(`Scripting system broke, invalid name:\n${this.dataFunctionName()}`) },
        extractJson: text => (text.trim().endsWith("`;") || text.trim().endsWith("`"))
            ? text.substring(
                text.indexOf("`") + 1, 
                text.lastIndexOf("`"))
            : text,
        wrapJson: function(json) {
            return `const ${this.dataFunctionName()}=()=>` + "`" + json + "`;";
        },
    },

    tableTest: {
        headerText: index => `${index} name`,
        cellText: index => `${index} data`,
    },

    exceptions: {
        commandNotDefined: element => `Define "data-command" for the element ${element.tagName} "${element.textContent}"`,
        commandNotFound: commandKey => `Command not found: "${commandKey}"`,
    },

    CSS: {
        found: "found",
        selection: "select",
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
        filePickerAcceptType: function() {
            return {
            description: "SADB or JSON file",
            accept: { "application/ecmascript": [this.accept, ".json"] },
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

    stringCleanup: {
        toHtml: value => value.trim().replace(/(\r\n|\n|\r)/gm, "<br>"),
        toWorld: value => value.replace(/<br[\s]*\/*>/gm, "\n").trim(),
        fixAndTrim: function(value) { return this.toHtml(this.toWorld(value)).replaceAll("\"", "&quot;").replaceAll("`", "&grave;"); },
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
