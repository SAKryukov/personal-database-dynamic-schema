/*
Personal Database

Copyright (c) 2017, 2023 by Sergey A Kryukov
http://www.SAKryukov.org
http://www.codeproject.com/Members/SAKryukov
*/

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

    const elements = getElements();

    elements.product.innerHTML = definitionSet.productFormat();
    document.title = definitionSet.titleFormat();

    const commandSets = createCommandSet();
    const commandSet = commandSets.commandSet;
    const mainMenu = new menuGenerator(elements.mainMenu);

    const contextMenu = new menuGenerator(elements.contextMenu);
    (() => { //menu:
        mainMenu.options = { afterActionBehavior: { hide: true } };
        mainMenu.subscribe(commandSet);
        mainMenu.subscribe(commandSets.aboutCommandSet);
        contextMenu.subscribe(commandSet);
        contextMenu.onShown(() => {
            elements.errorElement.style.display = definitionSet.display.hide;
            elements.errorElement.style.textContent = null;
        }); //contextMenu.onShown
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
    
    const summary = new Summary(elements);   
    commandSet.table = new Table(elements.main);

    window.addEventListener(definitionSet.eventHandler.readOnlyEvent, () => {
        const value = commandSet.table.isReadOnly;
        elements.indicators.readOnly.textContent = definitionSet.eventHandler.readOnlyIndicator[value ? 1 : 0];
    });
    window.addEventListener(definitionSet.eventHandler.modifiedEvent, () => {
        elements.indicators.modified.textContent = definitionSet.eventHandler.modifiedIndicator;
    });
    window.addEventListener(definitionSet.eventHandler.storedEvent, () => {
        commandSet.table.isModified = false;
        elements.indicators.modified.textContent = null;
    });
    
    window.onbeforeunload = event => {
        const requiresConfirmation = commandSet.table.isModified;
        if (requiresConfirmation) { // guarantee unload prompt for all browsers:
            event.preventDefault(); // guarantees showing confirmation dialog
            event.returnValue = true; // show confirmation dialog
        } else // to guarantee unconditional unload
            delete (event.returnValue);
    };
    
    commandSet.table.isReadOnly = false;
    if (commandLineParameter && typeof SAPersonalDatabase != typeof undefined) {
        if (SAPersonalDatabase.name != definitionSet.scripting.dataFunctionName())
            definitionSet.scripting.alert();
        const data = JSON.parse(SAPersonalDatabase());
        commandSet.table.load(data);
        summary.populate(data);
        document.title = definitionSet.titleFormat(data.summary.title);
        commandSet.table.isReadOnly = true;
    } //if
    commandSet.table.focus();

    new Search(
        elements,
        (pattern, matchCase, wholeWord, isRegexp) => commandSet.table.find(pattern, matchCase, wholeWord, isRegexp),
        () => commandSet.table.hideFound(),
        () => commandSet.table.findNext()
    );

    (()=> { //set hints:
        new Hint(
            elements.main,
            elements.indicators.modified,
            definitionSet.table.hintTimeout);
    })(); //set hints

    window.onkeydown = event => {
        if (event.key == definitionSet.keyboard.findNext) {
            commandSet.table.findNext();
            event.preventDefault();
        } //if
    }; //window.onkeydown

    commandSet.summary = summary;
    commandSet.errorElement = elements.errorElement;

}; //window.onload
