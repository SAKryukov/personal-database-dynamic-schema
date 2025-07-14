/*
Personal Database

Copyright (c) 2017, 2023, 2025 by Sergey A Kryukov
http://www.SAKryukov.org
http://www.codeproject.com/Members/SAKryukov
*/

class Summary {

    #title = null;
    #created = null;
    #updated = null;
    #description = null;

    constructor(elements){
        this.#title = elements.summary.title;
        this.#created = elements.summary.created;
        this.#updated = elements.summary.updated;
        this.#description = elements.summary.description;
        this.populate({});
        const modifiedEvent = new CustomEvent(definitionSet.eventHandler.modifiedEvent);
        const notifyModified = function() { window.dispatchEvent(modifiedEvent); }
        this.#description.onchange = function() { notifyModified(); };
        this.#title.onchange = function() { notifyModified(); };
    } //constructor

    #getTimeNow() {
        const time = new Date();
        return definitionSet.time.formatTime(time);
    } //#getTimeNow

    populate(data) {
        const now = this.#getTimeNow();
        this.#created.textContent = now;
        if (!data.summary) return;
        this.#created.textContent = data.summary.created ? data.summary.created : now;
        this.#updated.textContent = data.summary.updated ? data.summary.updated : null;
        this.#title.value = data.summary.title ? data.summary.title : null;
        this.#description.value = data.summary.description ? data.summary.description : null;
    } //populate

    updateData(data) {
        const now = this.#getTimeNow();
        if (!data.summary)
            data.summary = {};
        data.summary.title = this.#title.value;
        data.summary.description = this.#description.value;
        data.summary.created = this.#created.textContent;
        data.summary.updated = now;
        this.#updated.textContent = now;
    } //updateData

} //class Summary
