/*
HTML Menu

Copyright (c) 2017, 2023, 2025 by Sergey A Kryukov
http://www.SAKryukov.org
http://www.codeproject.com/Members/SAKryukov
*/

"use strict";

function menuGenerator (container, focusElement) {

    const version = "1.4.0";
    if (!new.target) return version;

    if (!container) return;
    const isContextMenu = container instanceof HTMLSelectElement;
    if (!isContextMenu && !(container instanceof HTMLElement)) {
        class MenuFailure extends Error {
            constructor(message) { super(message); }
        } //class MenuFailure
            throw new MenuFailure(`
                Menu container should be an ${HTMLElement.name} (${HTMLSelectElement.name} for context menu)`);
    } //if

    const definitionSet = {
        selectionIndicator: "selected",
        events: { optionClick: "optionClick", keyUp: "keyup", keyDown: "keydown" },
        keyboard: {
            left: "ArrowLeft",
            right: "ArrowRight",
            up: "ArrowUp",
            down: "ArrowDown",
            home: "Home",
            end: "End",
            escape: "Escape",
            enter: "Enter",
            edit: "F2",
            findNext: "F3",
            underline: text => `<u>${text}</u>`,
        },
        keyToCode: key => `Key${key.toUpperCase()}`,
        elements: {
            header: "header",
            select: "select",
            span: "span",
        },
        css: {
            show: "inline",
            hide: "none",
            positionAbsolute: "absolute",
            pixels: value => `${value}px`,
            noPointerEvents: "none",
            underline: "underline",
        },
        check: {
            checkbox: String.fromCodePoint(0x2610, 0x2009), //Ballot Box
            checkedCheckbox: String.fromCodePoint(0x2611, 0x2009), //Ballot Box with Check
            radioButton: String.fromCodePoint(0x2B58, 0x2009), //Heavy Circle
            checkedRadioButton: String.fromCodePoint(0x2B57, 0x2009), //Heavy Circle with Circle Inside
            menuItemProxyHint: hint => `Use: ${hint.join(", ")}`,
            menuItemProxyBrackets: "()",
        },
        apiHint: {
            stringify: hint => `Use: ${hint.join(", ")}`,
            brackets: "()",
            assignment: " = ",
            exclude: "toString",
        },
        exceptions: {
            menuItemSubscriptionFailure: value => `
                Menu item "${value}" subscription failed:
                menu item (HTML option) with this value does not exist`, //sic!
        },
        goodKeyboardActivationPrefix: (event, activationPrefix) => {
            for (const prefix of activationPrefix)
                if (!event[prefix])
                    return false;
            return true;
        }, //goodKeyboardActivationPrefix
        toString: text => `${text == null ? "" : text}`,
        isShortcut: (event, shortcut) => {
            if (event.code != shortcut.key) return false;
            if (!shortcut.prefix || shortcut.prefix.length < 1)
                return !(event.shiftKey || event.ctrlKey || event.metaKey || event.altKey);
            for (const prefixElement of shortcut.prefix)
                if (!event[prefixElement]) return false;
            return true;
        }, //isShortcut
    } //const definitionSet
    Object.freeze(definitionSet);
    const menuItemButtonState = {
        none: 0,
        checkBox: 1,
        checkedCheckbox: 2,
        radioButton: 3,
        checkedRadioButton: 4,
    }; //menuItemButtonState
    Object.freeze(menuItemButtonState);
    let menuOptions = {
        keyboardShortcuts: {
            // allowed (AND-ed) combinations of: altKey, ctrlKey, metaKey and shiftKey:
            activationPrefix: ["altKey"],
            excludes: "|/\\`~;:,." + "q-lip"+ "jpg" + "!@#$%^&*()_+",
        },
        afterActionBehavior: {
            hide: false,
            reset: false,
        },
    }; //menuOptions
    const boxMap = new Map();
    boxMap.setup = function(state, texts) {
        this.set(state.none, null);
        this.set(state.checkBox, texts.checkbox);
        this.set(state.checkedCheckbox, texts.checkedCheckbox);
        this.set(state.radioButton, texts.radioButton);
        this.set(state.checkedRadioButton, texts.checkedRadioButton);
    };
    boxMap.setup(menuItemButtonState, definitionSet.check);

    class MenuSubscriptionFailure extends Error {
        constructor(message) { super(message); }
    } //class MenuSubscriptionFailure

    const row = [];
    let isCurrentVisible = false, current = null,
        onShownHandler = null, onCancelHandler, onBlurHandler = null;
    const actionMap = new Map();
    const elementMap = new Map();
    const keyboardMap = new Map();

    const describeSelfDocumentedAPI = self => {
        const propertyNames = [];
        for (const index in self) {
            if (index == definitionSet.apiHint.exclude)
                continue;
            if (self[index] && self[index].constructor == Function)
                propertyNames.push(index + definitionSet.apiHint.brackets);
            else {
                const descriptor = Object.getOwnPropertyDescriptor(self, index);
                if (descriptor || descriptor.set != null)
                    propertyNames.push(index + definitionSet.apiHint.assignment);
            } //if
        } //loop
        return definitionSet.apiHint.stringify(propertyNames);
    }; //describeSelfDocumentedAPI

    function menuItemProxyApi(menuItem) {
        const setBox = newButton => {
            const menuItemData = elementMap.get(menuItem);
            menuItemData.button = newButton;
            menuItemData.shadowButtonText =
                definitionSet.toString(boxMap.get(newButton));
            menuItem.textContent = menuItemData.shadowButtonText + menuItemData.shadowText;
        }; //setBox
        Object.defineProperties(this, {
            subscribeToShortcut: {
                get() {
                    return hotkey => {
                        window.addEventListener(definitionSet.events.keyDown, event => {
                            if (!definitionSet.isShortcut(event, hotkey))
                                return;
                            const menuItemData = elementMap.get(menuItem);
                            const actionMapValue = actionMap.get(menuItemData.shadowValue);
                            const action = actionMapValue.action;
                            if (action(false, null, menuItemData.customItemData))
                                action(true, null, menuItemData.customItemData);
                        }); //window.addEventListener
                    }; //window.addEventListener
                }, enumerable: true,
            }, //subscribeToShortcut
            changeText: {
                get() {
                    return text => {
                        const menuItemData = elementMap.get(menuItem);
                        menuItemData.shadowText = definitionSet.toString(text);
                        menuItem.textContent = menuItemData.shadowButtonText + menuItemData.shadowText;
                    };
                }, enumerable: true
            },
            color: {
                set(value) { menuItem.style.color = value; }
            }, //color
            opacity: {
                set(value) { menuItem.style.opacity = value; }
            }, //opacity
            fontWeight: {
                set(value) { menuItem.style.fontWeight = value; }
            }, //v
            title: {
                get() { return menuItem.title; },
                set(value) { menuItem.title = value; },
            }, //title
            userData: {
                get() {
                    const menuItemData = elementMap.get(menuItem);
                    return menuItemData.userData;
                }, //userData getter
                set(value) {
                    const menuItemData = elementMap.get(menuItem);
                    menuItemData.userData = value;
                }, //userData setter
            }, //userData
            indent: {
                set(value) { menuItem.style.paddingLeft = `${value}em`; },
            }, //indent
            setCheckBox: {
                get() { return () => setBox(menuItemButtonState.checkBox) }, enumerable: true },
            setCheckedCheckBox: {
                get() { return () => setBox(menuItemButtonState.checkedCheckbox) }, enumerable: true },
            setRadioButton: {
                get() { return () => setBox(menuItemButtonState.radioButton) }, enumerable: true },
            setCheckedRadioButton: {
                get() { return () => setBox(menuItemButtonState.checkedRadioButton) }, enumerable: true },
            clearBoxesButtons: {
                get() { return () => setBox(menuItemButtonState.none) }, enumerable: true },
            enable: {
                get() { return () => menuItem.disabled = false }, enumerable: true },
            disable: {
                get() { return () => menuItem.disabled = true }, enumerable: true },
        }); //Object.defineProperties
        this.toString = function() { return describeSelfDocumentedAPI(this); };
        Object.freeze(this);
    }; // menuItemProxyApi

    Object.defineProperties(this, { //menu API:
        subscribe: {
            get() {
                return (value, action, customItemData) => {
                    if (!value) return;
                    if (value instanceof Map) {
                        for (const [key, command] of value)
                            command.menuItemHandle = this.subscribe(key, command);
                    } else {
                        const actionMapData = actionMap.get(value);
                        actionMapData.customItemData = customItemData;
                        if (!actionMapData)
                            throw new MenuSubscriptionFailure(
                                definitionSet.exceptions.menuItemSubscriptionFailure(value));
                        actionMapData.action = action;
                        return new menuItemProxyApi(actionMapData.menuItem);
                    } //if
                }
            }, //get subscribe
            enumerable: true
        }, //subscribe
        activate: {
            get() {
                return (pointerX, pointerY) => {
                    if (isContextMenu) {
                        container.style.zIndex = Number.MAX_SAFE_INTEGER;
                        updateStates(container);
                        container.style.position = definitionSet.css.positionAbsolute;
                        container.style.display = definitionSet.css.show;
                        const rectangle = container.getBoundingClientRect();
                        const optimizeLocation = (pointer, max, size) => {
                            const center = (max - size) / 2;
                            if (pointer == null) return center;
                            let result = pointer;
                            if (result + size > max)
                                result = pointer - size;
                            if (result < 0)
                                return center;
                            return result;
                        }; //optimizeLocation
                        container.style.left =
                            definitionSet.css.pixels(optimizeLocation(pointerX, window.innerWidth, rectangle.width));
                        container.style.top =
                            definitionSet.css.pixels(optimizeLocation(pointerY, window.innerHeight, rectangle.height));
                        if (menuOptions.afterActionBehavior.reset)
                            container.selectedIndex = 0;
                        setTimeout(() => container.focus());
                        return;
                    } //if
                    if (row.left < 1) return;
                    if (current)
                        select(current, true);
                    else
                        select(row[0].element, true);
                } //activate
            }, //get activate
            enumerable: true
        }, //activate
        options: {
            get() { return menuOptions },
            set(customOptions) {
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
                menuOptions = specialize(menuOptions, customOptions);
                remapKeyboardShortcuts();
            }, //set
            enumerable: true,
        }, //options
        onShown: {
            get() { return onShownHandler; },
            set(handler) { onShownHandler = handler; },
            enumerable: true,
        }, //onShown
        onCancel: {
            get() { return onCancelHandler; },
            set(handler) { onCancelHandler = handler; },
            enumerable: true,
        }, //onShown
        onBlur: {
            get() { return onBlurHandler; },
            set(handler) { onBlurHandler = handler; },
            enumerable: true,
        }, //onShown
        version: {
            get() { return version; },
        }, //onShown
    }); //menu API

    const remapKeyboardShortcuts = () => {
        keyboardMap.clear();
        for (const character of menuOptions.keyboardShortcuts.excludes)
            keyboardMap.set(definitionSet.keyToCode(character), null);
        const remapKeyboardShortcut = (header, xPosition) => { //automatic keyboard shortcuts:
            if (!goodForKeyboardHandling())
                return;
            let index = 0;
            let found = false;
            const textContent = header.textContent;
            header.innerHTML = textContent; // remove markup
            for (const character of textContent) {
                const code = definitionSet.keyToCode(character);
                if (!keyboardMap.has(code) && !(keyboardMap.has(code))) {
                    keyboardMap.has(code);
                    keyboardMap.set(code, xPosition);
                    found = true;
                    break;
                } //if
                ++index;
            } //loop
            if (!found) { header.textContent = textContent; return; }
            (header => { //underline keyboard shortcut:
                const shortcut = header.textContent[index];
                const split = header.textContent.split(shortcut);
                const before = document.createTextNode(split[0]);
                const shortcutHtml = document.createElement(definitionSet.elements.span);
                const after = document.createTextNode(split[1]);
                shortcutHtml.textContent = shortcut;
                shortcutHtml.style.pointerEvents = definitionSet.css.noPointerEvents;
                shortcutHtml.style.textDecoration = definitionSet.css.underline;
                header.textContent = null;
                header.appendChild(before);
                header.appendChild(shortcutHtml);
                header.appendChild(after);
            })(header); //underline keyboard shortcut
        } //remapKeyboardShortcut
        let xPosition = 0;
        for (const element of row)
            remapKeyboardShortcut(element.header, xPosition++);
        for (const character of menuOptions.keyboardShortcuts.excludes)
            keyboardMap.delete(definitionSet.keyToCode(character));
    }; //remapKeyboardShortcuts

    const reset = () => {
        if (!menuOptions.afterActionBehavior.reset) return;
        if (row.length < 1) return;
        for (const element of row) {
            if (element.select)
                element.select.selectedIndex = 0;
        } //loop
        current = row[0].element;
    }; //reset

    container.addEventListener(definitionSet.events.optionClick, event => {
        if (!event.detail.action) return;
        const menuItemData = actionMap.get(event.detail.action);
        const action = menuItemData.action;
        if (action) {
            action(true, event.detail.action, menuItemData.customItemData);
            if (isContextMenu) {
                updateStates(container);
                container.style.display = definitionSet.css.hide;
            } else
                updateStates(row[menuItemData.xPosition].element);
        } //if
        if (menuOptions.afterActionBehavior.hide && current)
            select(current, false);
        reset();
    }); //container.optionClick
    const leftRightHandler = (event, right) => {
        let xPosition = event.detail.xPosition;
        if (right) {
            if (xPosition < row.length - 1)
                xPosition++;
            else
                xPosition = 0;
        } else {
            if (xPosition > 0)
                xPosition--;
            else
                xPosition = row.length - 1;
        } //if
        select(current, false);
        select(row[xPosition].select, true);
    }; //leftRightHandler
    container.addEventListener(definitionSet.keyboard.left, event => {
        leftRightHandler(event, false);
    }); //container.optionClick
    container.addEventListener(definitionSet.keyboard.right, event => {
        leftRightHandler(event, true);
    }); //container.optionClick

    const updateStates = element => {
        let hasDisabled = false;
        let menuItems;
        if (!isContextMenu) {
            const elementValue = elementMap.get(element);
            menuItems = elementValue.menuItems;
        } else
            menuItems = element.options;
        if (menuItems.length < 1) return;
        const verticalMenu = menuItems[0].parentElement;
        for (const menuItem of menuItems) {
            const menuItemData = elementMap.get(menuItem);
            const value = menuItemData.shadowValue;
            const action = actionMap.get(value).action;
            if (!action) continue;
            const result = action(false, value);
            if (result == null) continue;
            menuItem.disabled = !result;
            hasDisabled ||= menuItem.disabled;
        } //loop
        if (!hasDisabled) return;
        if (!verticalMenu.options[verticalMenu.selectedIndex].disabled) return;
        // more complicated: removing selection from the disabled menu item:
        for (const menuItem of menuItems) {
            if (!menuItem.disabled) {
                for (const optionIndex in verticalMenu.options) {
                    if (verticalMenu.options[optionIndex] == menuItem) {
                        verticalMenu.selectedIndex = optionIndex;
                        return;
                    } //if
                } //loop
            } //if
        } //loop
        if (current)
            select(current, false);
    }; //updateStates

    const select = (element, doSelect) => {
        if (!element) return focusElement?.focus();
        element.style.zIndex = Number.MAX_SAFE_INTEGER;
        const eventData = elementMap.get(element);
        if (doSelect)
            eventData.header.classList.add(definitionSet.selectionIndicator);
        else
            eventData.header.classList.remove(definitionSet.selectionIndicator);
        eventData.select.style.display = doSelect
            ? definitionSet.css.show : definitionSet.css.hide;
        if (!doSelect) return focusElement?.focus();
        if (eventData.optionSize < 2) ++eventData.optionSize; // SA??? weird bug workaround
        eventData.select.size = eventData.optionSize;
        if (doSelect)
            current = element;
        setTimeout(() => eventData.select.focus());
        if (doSelect)
            updateStates(element);
        isCurrentVisible = doSelect;
    }; //select

    const goodForKeyboardHandling = () => {
        if (isContextMenu) return;
        if (menuOptions.keyboardShortcuts.activationPrefix == null) return;
        if (menuOptions.keyboardShortcuts.activationPrefix.constructor != Array) return;
        if (menuOptions.keyboardShortcuts.activationPrefix.length < 1) return;
        return true;
    }; //goodForKeyboardHandling

    const twoLevelMenuPopulate = () => {
        for (const child of container.children) {
            const rowCell = {
                element: child,
                header: child.querySelector(definitionSet.elements.header),
                select: child.querySelector(definitionSet.elements.select),
            };
            if (rowCell.element == null || rowCell.header == null || rowCell.select == null )
                continue;
            const data = {
                xPosition: row.length,
                element: rowCell.element,
                header: rowCell.header,
                select: rowCell.select,
                menuItems: [],
            };
            row.push(rowCell);
            rowCell.select.style.position = definitionSet.css.positionAbsolute;
            elementMap.set(rowCell.element, data);
            elementMap.set(rowCell.header, data);
            elementMap.set(rowCell.select, data);
            data.optionSize = contextMenuPopulate(rowCell.select, data);
            rowCell.header.onpointerdown = event => {
                const element = elementMap.get(event.target).element;
                if (element == current && !isCurrentVisible) return;
                select(current, false);
                select(element, true);
            } //rowCell.header.onpointerdown
        } //loop
        remapKeyboardShortcuts();
    }; //twoLevelMenuPopulate

    const contextMenuPopulate = (selectElement, data) => {
        selectElement.onkeydown = event => {
            switch (event.key) {
                case definitionSet.keyboard.escape:
                    if (isContextMenu)
                        container.style.display = definitionSet.css.hide;
                    else
                        select(current, false);
                    reset();
                    event.preventDefault();
                    if (onCancelHandler)
                        onCancelHandler(event);
                    break;
                case definitionSet.keyboard.enter:
                    const optionData = elementMap.get(event.target.options[event.target.selectedIndex]);
                    const clickData = { action: optionData.shadowValue };
                    container.dispatchEvent(
                        new CustomEvent(definitionSet.events.optionClick, { detail: clickData }));
                    event.preventDefault();
                    break;
                case definitionSet.keyboard.up:
                    if (event.target.selectedIndex < 1) {
                        const newIndex = event.target.options.length - 1;
                        if (!event.target.options[newIndex].disabled)
                            event.target.selectedIndex = newIndex;
                        event.preventDefault();
                    } //if
                    break;
                case definitionSet.keyboard.down:
                    if (event.target.selectedIndex >= event.target.options.length - 1) {
                        const newIndex = 0;
                        if (!event.target.options[newIndex].disabled)
                            event.target.selectedIndex = newIndex;
                        event.preventDefault();
                    } //if
                    break;
                default:
                    if (isContextMenu) break;
                    const data = elementMap.get(event.target);
                    data.target = event.target;
                    container.dispatchEvent(
                        new CustomEvent(event.key, { detail: data }));
            } //switch
        }; //selectElement.onkeydown
        selectElement.onblur = event => {
            if (!isContextMenu) {
                const data = elementMap.get(event.target);
                select(data.element, false);
            } else {
                event.target.style.display = definitionSet.css.hide;
                focusElement?.focus();
            } //if
            if (onBlurHandler)
                onBlurHandler(event);
        } //selectElement.onblur
    let optionIndex = 0, optionSize = 0;
        const optionHandler = event => {
            if (event.target.disabled) return;
            const data = elementMap.get(event.target);
            const menuItemData = elementMap.get(event.target);
            data.action = menuItemData.shadowValue;
            setTimeout(() => {
                container.dispatchEvent(
                    new CustomEvent(
                        definitionSet.events.optionClick,
                        { detail: data }));
            });
        }; //optionHandler
        const setupOption = (option, xPosition, yPosition, optionValue) => {
            elementMap.set(option, { xPosition: xPosition, yPosition: yPosition,
                shadowValue: optionValue, shadowText: optionValue,
                shadowButtonText: definitionSet.toString(null),
                button: menuItemButtonState.none });
            actionMap.set(optionValue, { menuItem: option, xPosition: xPosition, action: null });
            data.menuItems.push(option);
            option.onpointerdown = optionHandler;
        }; //setupOption
        for (const option of selectElement.children) {
            if (option.constructor == HTMLOptionElement)
                setupOption(option, row.length - 1, optionIndex++, option.value);
            else if (option.constructor == HTMLOptGroupElement)
                for (const subOption of option.children) {
                    setupOption(subOption, row.length - 1, optionIndex++, subOption.value);
                    optionSize++;
                } //loop
            optionSize++;
        } //loop
        return optionSize;
    } // contextMenuPopulate

    if (isContextMenu) {
        const selectElement = container;
        const data = { menuItems: [], };
        const size = contextMenuPopulate(selectElement, data);
        selectElement.size = size;
        container.onfocus = () => { if (onShownHandler != null) onShownHandler(container); }
    } else
        twoLevelMenuPopulate();

    if (row.length > 0) {
        container.tabIndex = 0;
        container.onfocus = () => {
            if (current)
                select(current, true)
            else
                select(row[0].element, true)
            if (onShownHandler != null) onShownHandler(container);
       }; //container.onfocus
    }; //if

    const startKeyboardHandling = handler => {
        if (!goodForKeyboardHandling()) return;
        window.addEventListener(definitionSet.events.keyDown, event => {
            if (!keyboardMap.has(event.code)) return;
            //if (event.key == "Alt") return;
            //if (event.key == "Meta") return;
            if (!definitionSet.goodKeyboardActivationPrefix(event, menuOptions.keyboardShortcuts.activationPrefix)) return;
            handler(event);
        });
    }; //startKeyboardHandling

    startKeyboardHandling(event => {
        const length = row.length;
        if (keyboardMap.size < 1) return;
        if (length < 1) return;
        const index = keyboardMap.get(event.code);
        if (index == null) return;
        if (index < 0 || index >= length) return;
        event.preventDefault();
        select(row[index].element, true);
    }); //startKeyboardHandling

    this.toString = () => { return describeSelfDocumentedAPI(this); };
    Object.freeze(this);

};
