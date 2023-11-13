"use strict";

const commandLineParameter = (commandLine => {
    const search = new URLSearchParams(commandLine.slice(1));
    let scriptName = null;
    for (let pair of search)
        if (pair[1] != null && pair[1].length < 1) {    
            scriptName = pair[0];
            break;
        } //if
    if (scriptName) {
        const script = document.createElement(definitionSet.scripting.script);
        script.src = scriptName;
        document.head.appendChild(script);    
    } //if scriptName
    return scriptName;
})(window.location.search);

window.onload = () => {

    document.querySelector("#product").innerHTML = definitionSet.productFormat();
    document.title = definitionSet.titleFormat();

    const commandSet = createCommandSet();
    //SA new!!!
    const mainMenu = new menuGenerator(document.querySelector("header > menu"));
    const contextMenu = new menuGenerator(document.querySelector("main select"));
    mainMenu.subscribe(commandSet);
    contextMenu.subscribe(commandSet);
    contextMenu.onShown(() => {
        errorElement.style.display = definitionSet.display.hide;
        errorElement.style.textContent = null;
    }); //contextMenu.onShown
    const errorElement = document.querySelector("#error");

    (() => { //context menu activation:
        let lastPointerX = 0;
        let lastPointerY = 0;
        window.onpointermove = event => {
            lastPointerX = event.clientX;
            lastPointerY = event.clientY;
        }; //window.onpointermove
        window.oncontextmenu = event => {
            const isPointer = event.button >= 0;
            if (isPointer)
                contextMenu.activate(event.clientX, event.clientY);
            else
                contextMenu.activate(lastPointerX, lastPointerY);
            event.preventDefault();
        }; //window.oncontextmenu    
    })(); //
    
    const summary = new Summary(
        document.querySelector("#summary-title"),
        document.querySelector("#summary-created"),
        document.querySelector("#summary-updated"),
        document.querySelector("#summary-description")
    );
    const readOnlyIndicator = document.querySelector("#read-only");
    const modifiedIndicator = document.querySelector("#modified");
    const table = new Table(document.querySelector("main"));
    
    commandSet.table = table;

    window.addEventListener(definitionSet.eventHandler.readOnlyEvent, () => {
        const value = commandSet.table.isReadOnly;
        readOnlyIndicator.textContent = definitionSet.eventHandler.readOnlyIndicator[value ? 1 : 0];
    });
    window.addEventListener(definitionSet.eventHandler.modifiedEvent, () => {
        modifiedIndicator.textContent = definitionSet.eventHandler.modifiedIndicator;
    });
    window.addEventListener(definitionSet.eventHandler.storedEvent, () => {
        commandSet.table.isModified = false;
        modifiedIndicator.textContent = null;
    });
    window.addEventListener("beforeunload", event => { // protect from losing unsaved data
        const requiresConfirmation = commandSet.table.isModified;
        if (requiresConfirmation) { // guarantee unload prompt for all browsers:
            event.preventDefault(); // guarantees showing confirmation dialog
            event.returnValue = true; // show confirmation dialog
        } else // to guarantee unconditional unload
            delete (event.returnValue);
    }); // protect from losing unsaved data

    table.isReadOnly = false;
    if (commandLineParameter && typeof SAPersonalDatabase != typeof undefined) {
        if (SAPersonalDatabase.name != definitionSet.scripting.dataFunctionName())
            definitionSet.scripting.alert();
        const data = JSON.parse(SAPersonalDatabase());
        table.load(data);
        summary.populate(data);
        document.title = definitionSet.titleFormat(data.summary.title);
        table.isReadOnly = true;
    } //if
    table.focus();

    new Search(
        document.querySelector("#search"),
        new TwoStateButton(document.querySelector("#search-match-case"), definitionSet.CSS.buttonUp, definitionSet.CSS.buttonDown, true),
        new TwoStateButton(document.querySelector("#search-whole-word"), definitionSet.CSS.buttonUp, definitionSet.CSS.buttonDown, false),
        new TwoStateButton(document.querySelector("#search-regexp"), definitionSet.CSS.buttonUp, definitionSet.CSS.buttonDown, false),
        document.querySelector("#search-results"),
        document.querySelector("#search-next"),
        (pattern, matchCase, wholeWord, isRegexp) => table.find(pattern, matchCase, wholeWord, isRegexp),
        () => table.hideFound(),
        () => table.findNext()
    );

    window.onkeydown = event => {
        if (event.key == definitionSet.keyboard.findNext) {
            table.findNext();
            event.preventDefault();
        } //if
    }; //window.onkeydown

    commandSet.summary = summary;
    commandSet.errorElement = errorElement;

}; //window.onload
