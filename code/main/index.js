/*
Personal Database

Copyright (c) 2017, 2023, 2025 by Sergey A Kryukov
http://www.SAKryukov.org
http://www.codeproject.com/Members/SAKryukov
*/

"use strict";

let lexicalErrorMessage = undefined;
window.onerror = message =>
    lexicalErrorMessage = message;

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
        document.head.appendChild(script); // can invoke window.onerror before calling window.onload
    } //if scriptName
    return scriptName;
})(window.location.search);

window.onload = () => {

    fixAccessKeyAttributes();

    const elements = getElements();
    elements.product.innerHTML = definitionSet.productFormat();
    document.title = definitionSet.titleFormat();

    const commandSet = createCommandSet(
        new Table(elements.main),
        new Summary(elements));
    const commandSetMap = commandSet.commandSetMap;

    commandSetMap.table.doubleClickHandler = commandSet.doubleClickHandler;
    const mainMenu = new menuGenerator(elements.mainMenu);

    const contextMenu = new menuGenerator(elements.contextMenu);
    (() => { //menu:
        mainMenu.options = { afterActionBehavior: { hide: true } };
        mainMenu.subscribe(commandSetMap);
        mainMenu.subscribe(commandSet.aboutCommandSet);
        contextMenu.subscribe(commandSetMap);
        const onMenuCancel = () => setTimeout(() => commandSetMap.table.focus());
        mainMenu.onCancel = onMenuCancel;
        contextMenu.onCancel = onMenuCancel;
    })(); //menu

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

    window.addEventListener(definitionSet.eventHandler.readOnlyEvent, () => {
        const value = commandSetMap.table.isReadOnly;
        elements.indicators.readOnly.textContent = definitionSet.eventHandler.readOnlyIndicator[value ? 1 : 0];
    });
    window.addEventListener(definitionSet.eventHandler.modifiedEvent, () => {
        elements.indicators.modified.textContent = definitionSet.eventHandler.modifiedIndicator;
    });
    window.addEventListener(definitionSet.eventHandler.storedEvent, () => {
        commandSetMap.table.isModified = false;
        elements.indicators.modified.textContent = null;
    });

    window.onbeforeunload = event => {
        const requiresConfirmation = commandSetMap.table.isModified;
        if (requiresConfirmation) { // guarantee unload prompt for all browsers:
            event.preventDefault(); // guarantees showing confirmation dialog
            event.returnValue = true; // show confirmation dialog
        } else // to guarantee unconditional unload
            delete (event.returnValue);
    }; //window.onbeforeunload

    commandSetMap.table.isReadOnly = false;

    new Search(
        elements,
        (pattern, matchCase, wholeWord, isRegexp) => commandSetMap.table.find(pattern, matchCase, wholeWord, isRegexp),
        () => commandSetMap.table.hideFound(),
        () => commandSetMap.table.findNext()
    );

    (() => { //set hints:
        new Hint(elements.main, elements.search.searchPattern);
        new Hint(elements.main, elements.search.options.matchCase);
        new Hint(elements.main, elements.search.options.wholeWord);
        new Hint(elements.main, elements.search.options.useRegexp);
        new Hint(elements.main, elements.search.buttonNext);
        new Hint(elements.main, elements.indicators.modified);
    })(); //set hints

    window.onkeydown = event => {
        if (event.key == definitionSet.keyboard.findNext) {
            commandSetMap.table.findNext();
            event.preventDefault();
        } //if
    }; //window.onkeydown

    if (commandLineParameter) {
        try {
            if (lexicalErrorMessage != undefined)
                return lexicalErrorMessage =
                    commandSet.showPreloadException(lexicalErrorMessage, commandLineParameter);
            if (typeof SAPersonalDatabase == typeof undefined)
                return commandSet.showPreloadException(definitionSet.scripting.invalidDatabase, commandLineParameter);
            commandSet.loadDatabase(SAPersonalDatabase);
            commandSetMap.table.isReadOnly = true;
        } catch (e) {
            commandSet.showPreloadException(e.toString(), commandLineParameter);
            document.title = definitionSet.titleFormat();
        } //exception
    } //if

}; //window.onload
