"use strict";

const Hint = function (parent, target) {

    let text, time;
    
    if (target.constructor == String) {
        text = target;
        time = undefined;
    } else {
        text = target.title;
        target.title = definitionSet.table.initialValue;    
        time = definitionSet.table.hintTimeout;
    } //if

    const element = document.createElement(definitionSet.table.hint);
    element.style.visibility = definitionSet.CSS.visibility.hidden;
    element.style.position = definitionSet.CSS.display.hint;
    element.style.zIndex = Number.MAX_SAFE_INTEGER;
    element.textContent = text;
    parent.appendChild(element);

    const show = function (remove, currentTarget) {
        if (!currentTarget) currentTarget = target;
        element.style.visibility = remove
            ? definitionSet.CSS.visibility.hidden
            : definitionSet.CSS.visibility.visible;
        if (!remove) {
            const rectangle = currentTarget.getBoundingClientRect();
            element.style.top = definitionSet.CSS.coordinate(
                rectangle.top + definitionSet.table.hintOffset.y - element.offsetHeight);
            element.style.left =
                definitionSet.CSS.coordinate(rectangle.left  + definitionSet.table.hintOffset.x);
        } //if
    } //show

    this.show = cell => {
        if (cell)
            show(false, cell);
        else
            show(true);
    } //this.show

    if (target && target instanceof HTMLElement) {
        target.addEventListener("pointerenter", () => {
            show();
            if (time)
                setTimeout(() => show(true), time);
        }); //target.onpointerenter
        target.onmouseleave = () => {
            show(true);
        }; //target.onpointerleave    
    } //if

};