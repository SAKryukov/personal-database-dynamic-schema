/*

Modal Dialog

v.4.1

Copyright (c) 2025 by Sergey A Kryukov
https://www.SAKryukov.org
https://www.codeproject.com/Members/SAKryukov

*/

"use strict";

const modalDialog = (() => {

    const definitionSet = {
        keys: {
            Enter: 0, Escape: 0,
        },
        names: {
            Close: 0,
            Copy: 0,
            absolute: 0,
            pointermove: 0,
        },
        tags: {
            dialog: 0,
            section: 0,
            button: 0,
            aside: 0,
        },
        cssClassSeparator: ` `,
        empty: ``,
        toPixel: value => `${value}px`,
        translate: (x, y) => `translate(${x}px, ${y}px)`,
        setup: function() {
            for (let constantSet of [this.keys, this.tags, this.names])
                for (let index in constantSet)
                    constantSet[index] = index;
            Object.freeze(this);
        }, //setup
    }; //definitionSet
    definitionSet.setup();

    const defaultSingleButton = text => {
        return {
            text: text,
            isDefault: true, isEnter: true, isEscape: true, noClosing: false,
            action: undefined,
        };
    }; //defaultButton

    const defaultOptions = {
        equalButtonWidths: true,
        cssClasses: definitionSet.empty,
        initialFocus: null, // HTMLElement or query string for QuerySelector
        focusAfterAction: null,
        drag: {
            isEnabled: true,
            usePreviousPosition: true,
        },
    }; //defaultOptions

    const defaults = {
        buttons: [ defaultSingleButton(definitionSet.names.Close) ],
        options: defaultOptions,
    }; //defaults

    const elementSet = {
        dialog: null,
        messageSection: null,
        buttonSection: null,
        initialFocusElement: null,
        focusElementOnClose: null,
        previousFocus: null,
    }; //elementSet

    const buttonSet = {
        enterButton: null,
        escapeButton: null,
        reset: function() {
            this.enterKey = null;
            this.escapeKey = null;
        }, //reset
    }; //buttonSet

    const state = {
        previousMessage: null,
        isDragging: false,
        previousDrag: {},
        savedDrag: {},
        drag: { x: 0, y: 0 },
        reset: function() {
            this.isDragging = false;
            this.previousDrag = {};
            this.savedDrag = structuredClone(this.drag);
            this.drag = { x: 0, y: 0 };
        }, //reset
        restore: function() {
            this.drag = structuredClone(this.savedDrag);
        }, //restore
    }; //state

    window.addEventListener(definitionSet.names.pointermove, event => {
        if (!state.isDragging) return;
        const dx = event.clientX - state.previousDrag.x;
        const dy = event.clientY - state.previousDrag.y;
        state.drag = { x:dx, y:dy };
        elementSet.dialog.style.transform = definitionSet.translate(state.drag.x, state.drag.y);
    }); //window.onpointermove

    const setupDialog = () => {
        elementSet.dialog = document.createElement(definitionSet.tags.dialog);
        document.body.appendChild(elementSet.dialog);
        elementSet.messageSection = document.createElement(definitionSet.tags.section);
        elementSet.buttonSection = document.createElement(definitionSet.tags.section);
        elementSet.dialog.appendChild(elementSet.messageSection);
        elementSet.dialog.appendChild(elementSet.buttonSection);
        elementSet.dialog.onkeydown = event => {
            if (event.code == definitionSet.keys.Escape && buttonSet.escapeButton)
                buttonSet.escapeButton.click();
            else if (event.code == definitionSet.keys.Enter && buttonSet.enterButton)
                buttonSet.enterButton.click();
            if (event.code == definitionSet.keys.Escape || event.code == definitionSet.keys.Enter)
                event.preventDefault();
        }; //elementSet.dialog.onkeydown
        const copyElement = document.createElement(definitionSet.tags.aside);
        copyElement.style.position = definitionSet.names.absolute;
        copyElement.title = definitionSet.names.Copy;
        elementSet.dialog.appendChild(copyElement);
        copyElement.onclick = () => 
            navigator.clipboard.writeText(elementSet.messageSection.innerHTML);
    }; //setupDialog

    const cleanUp = () => {
        elementSet.dialog.classList.value = definitionSet.empty;
        elementSet.initialFocusElement = null;
        elementSet.focusElementOnClose = null;
    } //cleanUp

    const close = () => {
        elementSet.dialog.close();
        if (elementSet.focusElementOnClose)
            elementSet.focusElementOnClose.focus();
        else if (elementSet.previousFocus)
            elementSet.previousFocus.focus();
        state.reset();
        elementSet.dialog.style.transform = null;
    }; //close

    const specialize = (defaultValue, value) => {
        if (value == null) return defaultValue;
        const newValue = {};
        for (let index in defaultValue) {
            if (value[index] !== undefined) {
                if (value[index] != null &&
                    defaultValue[index] != null &&
                    value[index].constructor == Object &&
                    defaultValue[index].constructor == Object)
                    newValue[index] = specialize(defaultValue[index], value[index]);
                else
                    newValue[index] = value[index];
            } else
                newValue[index] = defaultValue[index];
        } //loop
        return newValue;
    } //specialize

    const setMessage = message => {
        if (message.constructor == String)
            elementSet.messageSection.innerHTML = message;
        else if (message instanceof HTMLElement)
            elementSet.messageSection.appendChild(message)
        else if (message instanceof Array) {
            for (let element of message)
                if (!element instanceof HTMLElement) return;
            for (let element of message)
                elementSet.messageSection.appendChild(element);
        } //if
    }; //setMessage
    // message is HTML content, HTMLElement or array of HTMLElement:

    const show = (message, detail = defaults) => {
        detail = detail
            ? specialize(defaults, detail)
            : defaults
        if (elementSet.dialog == null)
            setupDialog();
        cleanUp();
        elementSet.focusElementOnClose = detail.options.focusAfterAction;
        if (detail.options.cssClasses) {
            const classes = detail.options.cssClasses.split(definitionSet.cssClassSeparator);
            for (let className of classes)
                if (className)
                    elementSet.dialog.classList.add(className);
        } //if
        let focusButton = null;
        setMessage(message);
        elementSet.buttonSection.innerHTML = null;
        const buttonMap = new Map();
        buttonSet.reset();
        elementSet.previousFocus = document.activeElement;
        if (detail.buttons.length && detail.buttons.length > 0)
            for (let buttonDescriptor of detail.buttons) {
                const button = document.createElement(definitionSet.tags.button);
                if (buttonDescriptor.isEnter)
                    buttonSet.enterButton = button;
                if (buttonDescriptor.isEscape)
                    buttonSet.escapeButton = button;
                buttonMap.set(button, buttonDescriptor);
                button.innerHTML = buttonDescriptor.text;
                button.onclick = event => {
                    const descriptor = buttonMap.get(event.target);
                    if (!descriptor || !descriptor.noClosing)
                        close();
                    if (descriptor && descriptor.action)
                        descriptor.action(event.target);
                }; //button.onclick
                elementSet.buttonSection.appendChild(button);
                if (buttonDescriptor.isDefault)
                    focusButton = button;
            } //loop
        elementSet.dialog.showModal();
        if (detail.options.equalButtonWidths) {
            let buttons = buttonMap.keys().toArray();
            let max = 0;
            for (let button of buttons)
                if (button.offsetWidth > max) max = button.offsetWidth;
            for (let button of buttons)
                button.style.width = definitionSet.toPixel(max);
        } //if
        if (detail.options.initialFocus) {
            if (detail.options.initialFocus.constructor == String)
                elementSet.initialFocusElement = elementSet.messageSection.querySelector(detail.options.initialFocus);
            else if (detail.options.initialFocus instanceof HTMLElement)
                elementSet.initialFocusElement = detail.options.initialFocus;
        } //if
        if (!focusButton && elementSet.buttonSection.firstChild)
            focusButton = elementSet.buttonSection.firstChild;
        const restoreFocus = () => {
            if (elementSet.initialFocusElement)
                elementSet.initialFocusElement.focus();
            else if (focusButton)
                focusButton.focus();
    }; //restoreFocus
        const canRestoreDrag = state.previousMessage == message;
        state.previousMessage = message;
        if (canRestoreDrag && detail.options.drag.usePreviousPosition) {
            state.restore();
            elementSet.dialog.style.transform = definitionSet.translate(state.drag.x, state.drag.y);
        } //if
        if (detail.options.drag.isEnabled) {
            elementSet.dialog.onpointerdown = event => {
                if (event.target.value != undefined) return;
                if (event.target.parentElement instanceof HTMLDetailsElement) return; // summary in <detail>
                state.isDragging = true;
                state.previousDrag.x = event.clientX - state.drag.x;
                state.previousDrag.y = event.clientY - state.drag.y;
            }; //elementSet.dialog.onpointerdown
            elementSet.dialog.onpointerup = () =>
               state.isDragging = false;
        } else
            elementSet.dialog.onpointerdown = undefined;
        restoreFocus();
        elementSet.dialog.onfocus = () => restoreFocus();
    }; //this.show

    const result = { show, defaultSingleButton };
    Object.defineProperties(result, {
        defaultButtons: { get() { return [ defaultSingleButton(definitionSet.names.Close) ]; } },
        defaultOptions: { get() { return structuredClone(defaultOptions); } },
        defaults: { get() { return structuredClone(defaults); } },
    });

    return result;

})(); //modalDialog
