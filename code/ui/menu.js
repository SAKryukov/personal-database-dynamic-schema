/*
HTML Menu

Copyright (c) 2023 by Sergey A Kryukov
http://www.SAKryukov.org
http://www.codeproject.com/Members/SAKryukov
*/

"use strict";

function menuGenerator (container) {

    const version = "0.2.4";
    if (!new.target) return version; this.version = version;

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
        toString: text => `${text == null ? "" : text}`,
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
            activationPrefix: ["Alt"],
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
    let isCurrentVisible = false, current = null, onShownHandler = null;
    const actionMap = new Map();
    const elementMap = new Map();
    const keyboardMap = new Map();

    const createSelfDocumentedList = self => {
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
    }; //createSelfDocumentedList

    function menuItemProxyApi(menuItem) {
        const setBox = newButton => {
            const menuItemData = elementMap.get(menuItem);
            menuItemData.button = newButton;
            menuItemData.shadowButtonText =
                definitionSet.toString(boxMap.get(newButton));
            menuItem.textContent = menuItemData.shadowButtonText + menuItemData.shadowText;
        }; //setBox
        this.changeText = text => {
            const menuItemData = elementMap.get(menuItem);
            menuItemData.shadowText = definitionSet.toString(text);
            menuItem.textContent = menuItemData.shadowButtonText + menuItemData.shadowText;
        }; //this.changeText
        this.setCheckBox = () => {
            setBox(menuItemButtonState.checkBox);
        }; //this.setCheckBox
        this.setCheckedCheckBox = () => {
            setBox(menuItemButtonState.checkedCheckbox);
        }; //this.setCheckedCheckBox
        this.setRadioButton = () => {
            setBox(menuItemButtonState.radioButton);
        }; //setRadioButton
        this.setCheckedRadioButton = () => {
            setBox(menuItemButtonState.checkedRadioButton);
        }; //setCheckedRadioButton
        this.clearBoxesButtons = () => {
            setBox(menuItemButtonState.none);
        }; //this.clearBoxesButtons
        this.enable = () => {
            menuItem.disabled = false;
        }; //enable
        this.disable = () => {
            menuItem.disabled = true;
        }; //disable
        this.toString = () => {
            return createSelfDocumentedList(this);
        }; //this.toString
        Object.freeze(this);
    }; // menuItemProxyApi
    
    (() => { //this.API:
        this.subscribe = (value, action) => {
            if (!value) return;
            if (value instanceof Map) {
                for (const [key, command] of value)
                    command.menuItemHandle = this.subscribe(key, command);
            } else {
                const actionMapData = actionMap.get(value);
                if (!actionMapData)
                    throw new MenuSubscriptionFailure(
                        definitionSet.exceptions.menuItemSubscriptionFailure(value));
                actionMapData.action = action;
                return new menuItemProxyApi(actionMapData.menuItem);    
            } //if
        }; //this.subscribe
        this.activate = (pointerX, pointerY) => {
            if (isContextMenu) {
                container.style.zIndex = Number.MAX_SAFE_INTEGER;
                updateStates(container);
                container.style.position = definitionSet.css.positionAbsolute;
                container.style.display = definitionSet.css.show;
                const rectangle = container.getBoundingClientRect();
                if (pointerX != null && pointerY != null) {
                    container.style.left = pointerX + rectangle.width < window.innerWidth
                        ? definitionSet.css.pixels(pointerX)
                        : definitionSet.css.pixels(pointerX - rectangle.width);
                        container.style.top = pointerY + rectangle.height < window.innerHeight
                        ? definitionSet.css.pixels(pointerY)
                        : definitionSet.css.pixels(pointerY - rectangle.height);
                } else {
                    container.style.left = css.pixels.coordinate(window.innerWidth / 2);
                    container.style.top = css.pixels.coordinate(window.innerHeight / 2);
                } //if
                if (menuOptions.afterActionBehavior.reset)
                    container.selectedIndex = 0;
                setTimeout(() => {
                    if (onShownHandler != null) onShownHandler(container);
                    container.focus();
                });
                return;
            } //if
            if (row.left < 1) return;
            if (current)
                select(current, true);
            else
                select(row[0].element, true);
        }; //this.activate
        Object.defineProperty(this, "options", {
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
                const toRemapKeyboardShortcuts =
                    menuOptions.keyboardShortcuts.excludes !=
                    customOptions.keyboardShortcuts.excludes
                menuOptions = specialize(menuOptions, customOptions);
                if (toRemapKeyboardShortcuts)
                    remapKeyboardShortcuts();
            }, //set
            enumerable: true,
            configurable: true,
          });
        this.onShown = handler => onShownHandler = handler;
        this.toString = () => {
            return createSelfDocumentedList(this);
        }; //this.toString
    })(); //this.API

    const remapKeyboardShortcuts = () => {
        keyboardMap.clear();
        for (const character of menuOptions.keyboardShortcuts.excludes)
            keyboardMap.set(character, null);
        const remapKeyboardShortcut = (header, xPosition) => { //automatic keyboard shortcuts:
            if (!goodForKeyboardHandling())
                return;
            let index = 0;
            let found = false;
            const textContent = header.textContent;
            header.innerHTML = textContent; // remove markup
            for (const character of textContent) {
                const characterKey = character.toLowerCase(character);
                if (!keyboardMap.has(characterKey) && !(keyboardMap.has(character))) {
                    keyboardMap.has(characterKey);
                    keyboardMap.set(characterKey, xPosition);
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
            keyboardMap.delete(character);
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
            action(true, event.detail.action);
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
        if (!element) return;
        element.style.zIndex = Number.MAX_SAFE_INTEGER;
        const eventData = elementMap.get(element);
        if (doSelect)
            eventData.header.classList.add(definitionSet.selectionIndicator);
        else 
            eventData.header.classList.remove(definitionSet.selectionIndicator);
        eventData.select.style.display = doSelect
            ? definitionSet.css.show : definitionSet.css.hide;
        if (!doSelect) return;
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
                    break;
                case definitionSet.keyboard.enter:
                    const optionData = elementMap.get(event.target.options[event.target.selectedIndex]);
                    const clickData = { action: optionData.shadowValue };
                    container.dispatchEvent(
                        new CustomEvent(definitionSet.events.optionClick, { detail: clickData }));
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
            }
                else event.target.style.display = definitionSet.css.hide;
        } //selectElement.onblur
    let optionIndex = 0, optionSize = 0;
        const optionHandler = event => {
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
                shadowValue: optionValue, shadowText: optionValue, shadowButtonText: null, button: menuItemButtonState.none });
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
    } else
        twoLevelMenuPopulate();

    if (row.length > 0) {
        container.tabIndex = 0;
        container.onfocus = () => {
            if (current)
                select(current, true)
            else
                select(row[0].element, true)
        }; //container.onfocus    
    }; //if

    const startKeyboardHandling = handler => {
        if (!goodForKeyboardHandling()) return;
        const downKeys = new Set();
        window.addEventListener(definitionSet.events.keyDown, event => {
            downKeys.add(event.key);
            if (downKeys.size <= menuOptions.keyboardShortcuts.activationPrefix.length) return;
            if (!downKeys.has(event.key)) return;
            for (const pressedOne of menuOptions.keyboardShortcuts.activationPrefix)
                if (!downKeys.has(pressedOne)) return;
            handler(event);
        });
        window.addEventListener(definitionSet.events.keyUp, event => {
            downKeys.delete(event.key);
        });
    }; //startKeyboardHandling

    startKeyboardHandling(event => {
        const length = row.length;  
        if (keyboardMap.size < 1) return;
        if (length < 1) return;
        const index = keyboardMap.get(event.key);
        if (index == null) return;
        if (index < 0 || index >= length) return;
        event.preventDefault();
        select(row[index].element, true);
    }); //startKeyboardHandling

    Object.freeze(this);

};
