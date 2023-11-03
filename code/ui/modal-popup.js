/*

Modal Popup

v.3.0

Copyright (c) 2015, 2017, 2019, 2023 by Sergey A Kryukov
http://www.SAKryukov.org
http://www.codeproject.com/Members/SAKryukov

Published: http://www.codeproject.com/Articles/1061121/ModalPopupFromScratch

*/
"use strict";

const modalPopup = {

    version: "3.0",
    date: 2023,

    show: function(content, buttonDescriptors, styles, onEndModalState) {

        if (!this.instance) {

        const constants = {
                escape: "Escape",
                formatSizeProperty: value => value + "px",
            }; //constants
            const defaultButtonDescriptor =
                [{ text: "Close", access: 0, action: null, escape: true }];
            const defaultStyleSet = {
                textAlign: null,
                width: "25em", // use null for width-to-content feature
                dimmerOpacity: 0.7,
                dimmerColor: "#040809",
                thickness: {
                    horizontalLine: "1px",
                    buttonBorder: "1px",
                },
                allowDragging: true,
                equalizeButtonWidths: false,
                buttonFocusOutline: "solid 2.8px ghostWhite",
                backgroundColor: { message: "floralWhite", buttonPad: "silver", button: "ghostWhite" },
                textLineColor: { message: "black", button: "black", horizontalLine: "black", buttonBorder: "black" },
                padding: {
                    textPad: { horizontal: "1em", vertical: "0.6em" },
                    buttonPad: { horizontal: "0.4em", vertical: "0.4em" },
                    button: { horizontal: "2em", vertical: "0.4em" },
                    buttonSpacing: "1.6em" },
                borderRadius: { window: "9px", button: "4.1px" }
            } //defaultStyleSet
            const styleTemplates = {
                messageWindow: (color, backgroundColor, borderRadius, width) =>
                    `position: absolute; padding:0; margin:0; color: ${color};
                    background-color: ${backgroundColor}; border-radius: ${borderRadius}; width: ${width}`,
                dimmer: (opacity, color) =>
                    `position: absolute; margin: 0; padding: 0; top:0; right:0; left:0; bottom:0;
                    opacity: ${opacity}; background-color: ${color}`,
                buttonPad: (paddingHorizontal, paddingVertical, borderRadius, horizontalLineThickness, borderColor, backgroundColor) =>
                    `overflow: auto; text-align: center; margin: 0;
                    padding-left: ${paddingHorizontal}; padding-right: ${paddingHorizontal};
                    padding-top: ${paddingVertical}; padding-bottom: ${paddingVertical}; 
                    border-bottom-left-radius: ${borderRadius}; border-bottom-right-radius: ${borderRadius};
                    border-top: solid ${horizontalLineThickness} ${borderColor}; background-color: ${backgroundColor}`,
                textPad: (paddingHorizontal, paddingVertical) =>
                    `margin: 0; padding-left: ${paddingHorizontal}; padding-right: ${paddingHorizontal};
                    padding-top: ${paddingVertical}; padding-bottom: ${paddingVertical};
                    -webkit-touch-callout: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none`,
                button: (paddingHorizontal, paddingVertical, borderThickness, borderColor, borderRadius, color, backgroundColor) =>
                    `padding-left: ${paddingHorizontal}; padding-right: ${paddingHorizontal};
                    padding-top: ${paddingVertical}; padding-bottom: ${paddingVertical};
                    border: solid ${borderThickness} ${borderColor}; border-radius: ${borderRadius};
                    color: ${color}; background-color: ${backgroundColor}; 
                    text-align:center;`,
            } //styleTemplates
            Object.freeze(constants);
            Object.freeze(defaultButtonDescriptor);
            Object.freeze(defaultStyleSet);

            const hide = object => { object.style.visibility = "hidden"; }
            const show = object => { object.style.visibility = null; }
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

            this.instance = new function() {

                this.dimmer = document.createElement("div");
                this.messageWindow = document.createElement("div");

                hide(this.messageWindow);
                hide(this.dimmer);
                this.messageWindow.modalPopupControl = this;

                document.body.appendChild(this.dimmer);
                document.body.appendChild(this.messageWindow);

                let allowDragging;
                let modalPopupIsShowing = false;
                let draggingInfo = null;
                let currentLocation;

                this.resizeHandler = () => {
                    currentLocation = {
                        x: (window.innerWidth - this.messageWindow.offsetWidth) / 2,
                        y: (window.innerHeight - this.messageWindow.offsetHeight) / 2
                    };
                    this.messageWindow.style.top = constants.formatSizeProperty(currentLocation.y);
                    this.messageWindow.style.left = constants.formatSizeProperty(currentLocation.x);
                } //this.resizeHandler

                const windowResizeHandler = () => {
                    this.modalPopupControl.resizeHandler();
                } //windowResizeHandler

                const startDragging = (element, ev) => {
                    if (!allowDragging) return;
                    draggingInfo = { x: ev.pageX, y: ev.pageY };
                    element.style.cursor = "move";
                    if (element.buttonSet)
                        for (let index = 0; index < element.buttonSet.length; ++index)
                            element.buttonSet[index].style.cursor = "move";
                } //startDragging
                const stopDragging = element => {
                    element.style.cursor = "default";
                    if (element.buttonSet)
                        for (let index = 0; index < element.buttonSet.length; ++index)
                            element.buttonSet[index].style.cursor = "default";
                    draggingInfo = null;
                } //stopDragging

                this.dimmer.onmousedown = ev => {
                    ev.preventDefault();
                    return false;
                } //this.dimmer.onmousedown
                this.messageWindow.onmousedown = ev => {
                    if (!modalPopupIsShowing) return;
                    if (ev.button != 0) return;
                    startDragging(ev.target, ev);
                }; //this.messageWindow.onmousedown
                window.modalPopupControl = this;
                const windowMouseUpHandler = ev => {
                    if (!modalPopupIsShowing) return;
                    if (ev.button != 0) return;
                    stopDragging(ev.target);
                }; //windowMouseUpHandler
                const windowMouseMoveHandler = function(ev) {
                    if (!allowDragging) return;
                    if (!modalPopupIsShowing) return;
                    if (!draggingInfo) return;
                    if (ev.button != 0) return;
                    if (ev.pageX <= 0 || ev.pageY <= 0 || ev.pageX >= window.innerWidth || ev.pageY >= window.innerHeight) {
                        stopDragging(this.modalPopupControl.messageWindow);
                        return false;
                    } //if outside
                    const newCurrentLocation = {
                        x: currentLocation.x + ev.pageX - draggingInfo.x,
                        y: currentLocation.y + ev.pageY - draggingInfo.y
                    };
                    const max = { x: window.innerWidth - this.modalPopupControl.messageWindow.offsetWidth, y: window.innerHeight - this.modalPopupControl.messageWindow.offsetHeight };
                    if (newCurrentLocation.x < 0) newCurrentLocation.x = 0;
                    if (newCurrentLocation.y < 0) newCurrentLocation.y = 0;
                    if (newCurrentLocation.x > max.x) newCurrentLocation.x = max.x;
                    if (newCurrentLocation.y > max.y) newCurrentLocation.y = max.y;
                    this.modalPopupControl.messageWindow.style.top = constants.formatSizeProperty(newCurrentLocation.y);
                    this.modalPopupControl.messageWindow.style.left = constants.formatSizeProperty(newCurrentLocation.x);
                    draggingInfo = { x: ev.pageX, y: ev.pageY };
                    currentLocation = newCurrentLocation;
                    ev.preventDefault();
                    return false;
                }; //windowMouseMoveHandler

                const disableAll = (list, exclusion, parent) => {
                    modalPopupIsShowing = true;
                    if (parent == exclusion) return;
                    const objectSample = {};
                    for (let index in parent.childNodes) {
                        let child = parent.childNodes[index];
                        disableAll(list, exclusion, child);
                        if (typeof child == typeof objectSample && "disabled" in child && !child.disabled) {
                            child.disabled = true;
                            list.push({ element: child, accessKey: child.accessKey });
                            child.accessKey = undefined; // this is a workaround for Mozilla
                        } //if
                    } //loop
                } //disableAll
                const modalClosing = (itself, list) => {
                    window.removeEventListener("resize", windowResizeHandler)
                    window.removeEventListener("mousemove", windowMouseMoveHandler);
                    window.removeEventListener("mouseup", windowMouseUpHandler);
                    for (let index in list) {
                        list[index].element.disabled = false;
                        if (list[index].accessKey) // because of just Mozilla
                            list[index].element.accessKey = list[index].accessKey;
                    } //loop
                    hide(itself.messageWindow);
                    hide(itself.dimmer);
                    modalPopupIsShowing = false;
                } //modalClosing
                const modalClosed = (focusedElement, messageWindow, endModalStateHandler) => {
                    if (endModalStateHandler && endModalStateHandler.constructor == Function)
                        endModalStateHandler();
                    if (focusedElement) focusedElement.focus();
                    messageWindow.innerHTML = null;
                } //modalClosed

                this.show = function(content, buttonDescriptors, userStyles, endModalStateHandler) {
                    if (modalPopupIsShowing) return;
                    this.messageWindow.onkeydown = null;
                    let effectiveStyles;
                    if (!userStyles)
                        effectiveStyles = defaultStyleSet;
                    else
                        effectiveStyles = specialize(defaultStyleSet, userStyles);
                    allowDragging = effectiveStyles.allowDragging;
                    if (allowDragging) {
                        window.addEventListener("mouseup", windowMouseUpHandler);
                        window.addEventListener("mousemove", windowMouseMoveHandler);
                    } //if allowDragging
                    this.dimmer.style.cssText = styleTemplates.dimmer(
                        effectiveStyles.dimmerOpacity,
                        effectiveStyles.dimmerColor)
                    this.messageWindow.style.cssText =
                        styleTemplates.messageWindow(
                            effectiveStyles.textLineColor.message,
                            effectiveStyles.backgroundColor.message,
                            effectiveStyles.borderRadius.window,
                            effectiveStyles.width);
                    let focusedElement = document.activeElement;
                    const list = [];
                    disableAll(list, this.messageWindow, document.body);
                    const insertUnderscore = (text, underscoreIndex) => {
                        let result = "";
                        const array = text.split("");
                        for (let index = 0; index < array.length; ++index)
                            if (index == underscoreIndex)
                                result += "<u>" + array[index] + "</u>";
                            else
                                result += array[index];
                        return result;
                    } //insertUnderscore
                    const buttonPad = document.createElement("div");
                    const textPad = document.createElement("div");
                    buttonPad.style.cssText = styleTemplates.buttonPad(
                        effectiveStyles.padding.buttonPad.horizontal,
                        effectiveStyles.padding.buttonPad.vertical,
                        effectiveStyles.borderRadius.window,
                        effectiveStyles.thickness.horizontalLine,
                        effectiveStyles.textLineColor.horizontalLine,
                        effectiveStyles.backgroundColor.buttonPad);
                    textPad.style.cssText = styleTemplates.textPad(
                        effectiveStyles.padding.textPad.horizontal,
                        effectiveStyles.padding.textPad.vertical);
                    if (effectiveStyles.textAlign)
                        textPad.style.textAlign = effectiveStyles.textAlign; 
                    textPad.innerHTML = content;
                    if (!buttonDescriptors || !("length" in buttonDescriptors) || buttonDescriptors.length < 1) buttonDescriptors = defaultButtonDescriptor;
                    this.messageWindow.buttonSet = [];
                    let lastButton, defaultButton, escapeButton;
                    for (let buttonIndex = 0; buttonIndex < buttonDescriptors.length; ++buttonIndex) {
                        const button = document.createElement("button");
                        button.onfocus = event => {
                            event.target.style.outline = effectiveStyles.buttonFocusOutline;
                        } //closeButton.onfocus
                        button.onblur = event => {
                            event.target.style.outline = null;
                        } //closeButton.onfocus
                        button.modalPopupControl = this;
                        button.descriptor = buttonDescriptors[buttonIndex];
                        let accessIndex = buttonDescriptors[buttonIndex].access;
                        if (!accessIndex) accessIndex = 0;
                        if (accessIndex > buttonDescriptors[buttonIndex].text.length - 1)
                            accessIndex = 0;
                        button.innerHTML = insertUnderscore(buttonDescriptors[buttonIndex].text, accessIndex);
                        button.setAttribute("accesskey", buttonDescriptors[buttonIndex].text[accessIndex]);
                        button.style.cssText = styleTemplates.button(
                            effectiveStyles.padding.button.horizontal,
                            effectiveStyles.padding.button.vertical,
                            effectiveStyles.thickness.buttonBorder,
                            effectiveStyles.textLineColor.buttonBorder,
                            effectiveStyles.borderRadius.button,
                            effectiveStyles.textLineColor.button,
                            effectiveStyles.backgroundColor.button);
                        button.messageWindow = this.messageWindow;
                        button.onclick = function(ev) {
                            modalClosing(this.modalPopupControl, list);
                            if (this.descriptor && this.descriptor.action) { this.descriptor.action(); }
                            modalClosed(focusedElement, this.messageWindow, endModalStateHandler);
                            return false;
                        } //closeButton.onclick
                        buttonPad.appendChild(button);
                        const margin = effectiveStyles.padding.buttonSpacing;
                        if (buttonIndex < buttonDescriptors.length - 1)
                            button.style.marginRight = margin;
                        else
                            lastButton = button;
                        if (!defaultButton && buttonDescriptors[buttonIndex].default)
                            defaultButton = button;
                        if (!escapeButton && buttonDescriptors[buttonIndex].escape) {
                            escapeButton = button;
                            escapeButton.escapeAction = buttonDescriptors[buttonIndex].action;
                        } //if
                        this.messageWindow.buttonSet.push(button);
                    } //loop
                    if (escapeButton)
                        this.messageWindow.onkeydown = function(ev) {
                            if (ev.ctrlKey || ev.shiftKey || ev.altKey || ev.metaKey) return true;
                            if (ev.key != constants.escape) return true;
                            modalClosing(this.modalPopupControl, list);
                            if (escapeButton.escapeAction, endModalStateHandler)
                                escapeButton.escapeAction();
                            modalClosed(focusedElement, this);
                            return false;
                        } //this.messageWindow.onkeydown
                    buttonPad.style.whiteSpace = "nowrap";
                    if (!effectiveStyles.width) textPad.style.whiteSpace = "nowrap";
                    this.messageWindow.appendChild(textPad);
                    this.messageWindow.appendChild(buttonPad);
                    if (effectiveStyles.equalizeButtonWidths) {
                        let max = 0;
                        for (let index = 0; index < this.messageWindow.buttonSet.length; ++index)
                            if (this.messageWindow.buttonSet[index].offsetWidth > max)
                                max = this.messageWindow.buttonSet[index].offsetWidth;
                        for (let index = 0; index < this.messageWindow.buttonSet.length; ++index)
                            constants.formatSizeProperty(this.messageWindow.buttonSet[index].style.width);
                    } //if style.equalizeButtonWidths
                    if (!effectiveStyles.width) {
                        let max = textPad.offsetWidth;
                        if (buttonPad.offsetWidth > max) max = buttonPad.offsetWidth;
                        this.messageWindow.style.width = constants.formatSizeProperty(max + 2); //SA???
                    } //if width by content
                    this.resizeHandler();
                    if (!defaultButton)
                        defaultButton = lastButton;
                    show(this.messageWindow);
                    show(this.dimmer);
                    if (defaultButton)
                        defaultButton.focus();
                    if (!window.hasEventListenerModalClose) {    
                        window.addEventListener("beforeunload", function() {
                            modalClosing(this.modalPopupControl, list);
                            modalClosed(null, this, null);
                        });
                        window.hasEventListenerModalClose = this;
                    } //if
                    window.addEventListener("resize", windowResizeHandler);
                } //this.show

            } //function
        } //if this instance was not yet defined

        this.instance.show(content, buttonDescriptors, styles, onEndModalState);

    }, //show
    
    // content of some element to jump to the popup show if used as a first "content" argument:
    prepareContent: (element) => {
        const content = element.innerHTML;
        element.parentNode.removeChild(element);
        return content;
    }, //prepareContent
    prepareContentById: id => {
        return modalPopup.prepareContent(document.getElementById(id));
    } //prepareContentById

} //modalPopup
