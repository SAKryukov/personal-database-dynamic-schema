/*
Personal Database

Copyright (c) 2017, 2023, 2025 by Sergey A Kryukov
http://www.SAKryukov.org
http://www.codeproject.com/Members/SAKryukov
*/

"use strict";

const Hint = function (parent, textOrTarget) {

    let text, time;
    
    if (textOrTarget instanceof HTMLElement) {
        text = textOrTarget.title;
        textOrTarget.title = definitionSet.table.initialValue;    
        time = definitionSet.table.hintTimeout;
    } else if (textOrTarget.constructor == String)
        text = textOrTarget;

    const element = document.createElement(definitionSet.table.hint);
    element.textContent = text;
    element.style.display = definitionSet.CSS.display.none;
    element.style.position = definitionSet.CSS.position.hint;
    element.style.zIndex = Number.MAX_SAFE_INTEGER;
    parent.appendChild(element);

    const show = function (currentTarget, remove) {
        if (!currentTarget) currentTarget = textOrTarget;
        element.style.display = remove
            ? definitionSet.CSS.display.none
            : null;
        if (!remove) {
            const rectangle = currentTarget.getBoundingClientRect();
            element.style.top = definitionSet.CSS.coordinate(
                rectangle.top + definitionSet.table.hintOffset.y - element.offsetHeight);
            element.style.left =
                definitionSet.CSS.coordinate(rectangle.left  + definitionSet.table.hintOffset.x);
        } //if
    } //show
    this.show = cell => show(cell, cell == null);

    if (textOrTarget && textOrTarget instanceof HTMLElement) {
        textOrTarget.onpointerenter = () => {
            show(null);
            if (time)
                setTimeout(() => show(null, true), time);
        }; //target.onpointerenter
        textOrTarget.onmouseleave = () => {
            show(null, true);
        }; //target.onpointerleave    
    } //if

};
