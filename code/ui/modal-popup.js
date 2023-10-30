/*

Modal Popup

v.2.2

Copyright (c) 2015, 2017, 2019 by Sergey A Kryukov
http://www.SAKryukov.org
http://www.codeproject.com/Members/SAKryukov

Published: http://www.codeproject.com/Articles/1061121/ModalPopupFromScratch

*/
"use strict";

const modalPopup = {

	show: function(content, buttonDescriptors, styles, onEndModalState) {

		if (!this.instance) {

			const constants = {
				escape: 27,
				enter: 13,
				formatSizeProperty: (value) => { return value + "px"; }
			}; //constants	

			const defaultButtonDescriptor = [{ text: "Close", access: 0, action: null, escape: true }];
			const defaultStyleSet = {
				width: "20em", // use null for width-to-content feature
				textAlign: null,
				dimmerOpacity: 0.7,
				dimmerColor: "#040809",
				horizontalLineThickness: "1px",
				allowDragging: true,
				equalizeButtonWidths: false,
				backgroundColor: { message: "white", buttonPad: "silver", button: "" },
				textLineColor: { message: "black", button: "", horizontalLine: "black" },
				padding: { textPad: ["1em", "0.6em"], buttonPad: ["0.4em", "0.4em"], button: ["1em", "0.4em"], buttonSpacing: "1.6em" },
				borderRadius: { window: "9px", button: "" }
			} //defaultStyleSet

			if (!String.prototype.format) {
				Object.defineProperty(String.prototype, "format", {
					enumerable: false, configurable: false, writable: false,
					value: function() { this
						const args = arguments;
						return this.replace(/{(\d+)}/g, (match, number) => {
							return args[number] != undefined ? args[number] : match;
						}) //replace
					}
				});
			} //if !String.prototype.format

		    const hide = (object) => { object.style.visibility = "hidden"; }
			const show = (object) => { object.style.visibility = null; }
			const populateWithDefault = (value, defaultValue) => {
				if (!defaultValue) return;
				if (!value) return;
				if (defaultValue.constructor == Object && value.constructor == Object) {
					for (let index in defaultValue)
						if (!(index in value))
							value[index] = defaultValue[index];
						else
							populateWithDefault(value[index], defaultValue[index]);
				} else
					value = defaultValue;
			} //populateWithDefault

			this.instance = new function() {

				const styleTemplates = {
					messageWindow: "position: absolute; padding:0; margin:0; color: {0}; background-color: {1}; border-radius: {2}; width: {3}",
					dimmer: "position: absolute; margin: 0; padding: 0; top:0; right:0; left:0; bottom:0; opacity: {0}; background-color: {1}",
					buttonPad: "margin: 0; padding-left: {0}; padding-right: {0}; padding-top: {1}; padding-bottom: {1}; text-align: center; border-bottom-left-radius: {2}; border-bottom-right-radius: {2}; border-top: solid {3} {4}; background-color: {5}",
					textPad: "margin: 0; padding-left: {0}; padding-right: {0}; padding-top: {1}; padding-bottom: {1};" +
						"-webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none",
					button: "bottom: 0.4; padding-left: {0}; padding-right: {0}; padding-top: {1}; padding-bottom: {1}; text-align:center; border-radius: {2}; background-color: {3}; color: {4}"
				} //styleTemplates

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

				const windowResizeHandler = (ev) => {
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
				const stopDragging = (element, ev) => {
					element.style.cursor = "default";
					if (element.buttonSet)
						for (let index = 0; index < element.buttonSet.length; ++index)
							element.buttonSet[index].style.cursor = "default";
					draggingInfo = null;
				} //stopDragging

				this.dimmer.onmousedown = (ev) => {
					ev.preventDefault();
					return false;
				} //this.dimmer.onmousedown
				this.messageWindow.onmousedown = (ev) => {
					if (!modalPopupIsShowing) return;
					ev = ev || window.event;
					if (ev.button != 0) return;
					startDragging(ev.target, ev);
				}; //this.messageWindow.onmousedown
				window.modalPopupControl = this;
				const windowMouseUpHandler = (ev) => {
					if (!modalPopupIsShowing) return;
					if (ev.button != 0) return;
					ev = ev || window.event;
					stopDragging(ev.target);
				}; //windowMouseUpHandler
				const windowMouseMoveHandler = function(ev) {
					if (!allowDragging) return;
					if (!modalPopupIsShowing) return;
					if (!draggingInfo) return;
					ev = ev || window.event;
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

				this.show = function(content, buttonDescriptors, styles, endModalStateHandler) {
					if (modalPopupIsShowing) return;
					this.messageWindow.onkeydown = null;
					if (!styles)
						styles = defaultStyleSet;
					else
						populateWithDefault(styles, defaultStyleSet);
					allowDragging = styles.allowDragging;
					if (allowDragging) {
						window.addEventListener("mouseup", windowMouseUpHandler);
						window.addEventListener("mousemove", windowMouseMoveHandler);
					} //if allowDragging
					this.dimmer.style.cssText = styleTemplates.dimmer.format(styles.dimmerOpacity, styles.dimmerColor);
					this.messageWindow.style.cssText = styleTemplates.messageWindow.format(styles.textLineColor.message, styles.backgroundColor.message, styles.borderRadius.window, styles.width);
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
					buttonPad.style.cssText = styleTemplates.buttonPad.format(styles.padding.buttonPad[0], styles.padding.buttonPad[1], styles.borderRadius.window, styles.textLineColor.horizontalLine, styles.horizontalLineThickness, styles.backgroundColor.buttonPad);
					textPad.style.cssText = styleTemplates.textPad.format(styles.padding.textPad[0], styles.padding.textPad[1]);
					if (styles.textAlign)
						textPad.style.textAlign = styles.textAlign; 
					textPad.innerHTML = content;
					if (!buttonDescriptors || !("length" in buttonDescriptors) || buttonDescriptors.length < 1) buttonDescriptors = defaultButtonDescriptor;
					this.messageWindow.buttonSet = [];
					let lastButton, defaultButton, escapeButton;
					for (let buttonIndex = 0; buttonIndex < buttonDescriptors.length; ++buttonIndex) {
						const closeButton = document.createElement("button");
						closeButton.modalPopupControl = this;
						closeButton.descriptor = buttonDescriptors[buttonIndex];
						let accessIndex = buttonDescriptors[buttonIndex].access;
						if (!accessIndex) accessIndex = 0;
						if (accessIndex > buttonDescriptors[buttonIndex].text.length - 1)
							accessIndex = 0;
						closeButton.innerHTML = insertUnderscore(buttonDescriptors[buttonIndex].text, accessIndex);
						closeButton.setAttribute("accesskey", buttonDescriptors[buttonIndex].text[accessIndex]);
						closeButton.style.cssText = styleTemplates.button.format(styles.padding.button[0], styles.padding.button[1], styles.borderRadius.button, styles.backgroundColor.button, styles.textLineColor.button);
						closeButton.messageWindow = this.messageWindow;
						closeButton.onclick = function(ev) {
							modalClosing(this.modalPopupControl, list);
							if (this.descriptor && this.descriptor.action) { this.descriptor.action(); }
							modalClosed(focusedElement, this.messageWindow, endModalStateHandler);
							return false;
						} //closeButton.onclick
						buttonPad.appendChild(closeButton);
						const margin = styles.padding.buttonSpacing;
						if (buttonIndex < buttonDescriptors.length - 1)
							closeButton.style.marginRight = margin;
						else
							lastButton = closeButton;
						if (!defaultButton && buttonDescriptors[buttonIndex].default)
							defaultButton = closeButton;
						if (!escapeButton && buttonDescriptors[buttonIndex].escape) {
							escapeButton = closeButton;
							escapeButton.escapeAction = buttonDescriptors[buttonIndex].action;
						} //if
						this.messageWindow.buttonSet.push(closeButton);
					} //loop
					if (escapeButton)
						this.messageWindow.onkeydown = function(ev) {
							if (ev.ctrlKey || ev.shiftKey || ev.altKey || ev.metaKey) return true;
							if (ev.keyCode != constants.escape) return true;
							modalClosing(this.modalPopupControl, list);
							if (escapeButton.escapeAction, endModalStateHandler)
								escapeButton.escapeAction();
							modalClosed(focusedElement, this);
							return false;
						} //this.messageWindow.onkeydown
					buttonPad.style.whiteSpace = "nowrap";
					if (!styles.width) textPad.style.whiteSpace = "nowrap";
					this.messageWindow.appendChild(textPad);
					this.messageWindow.appendChild(buttonPad);
					if (styles.equalizeButtonWidths) {
						let max = 0;
						for (let index = 0; index < this.messageWindow.buttonSet.length; ++index)
							if (this.messageWindow.buttonSet[index].offsetWidth > max)
								max = this.messageWindow.buttonSet[index].offsetWidth;
						for (let index = 0; index < this.messageWindow.buttonSet.length; ++index)
							this.messageWindow.buttonSet[index].style.width = max;
					} //if style.equalizeButtonWidths
					if (!styles.width) {
						let max = textPad.offsetWidth;
						if (buttonPad.offsetWidth > max) max = buttonPad.offsetWidth;
						this.messageWindow.style.width = constants.formatSizeProperty(max);
					} //if width by content
					this.resizeHandler();
					show(this.messageWindow);
					show(this.dimmer);
					if (!defaultButton)
						defaultButton = lastButton;
					if (defaultButton)
						defaultButton.focus();
					if (!window.hasEventListenerModalClose) {	
						window.addEventListener("beforeunload", function(event) {
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
	prepareContentById: (id) => {
		return modalPopup.prepareContent(document.getElementById(id));
	} //prepareContentById

} //modalPopup