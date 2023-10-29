class Summary {

    #title = null;
    #created = null;
    #updated = null;
    #description = null;

    constructor(title, created, updated, description) {
        this.#title = title;
        this.#created = created;
        this.#updated = updated;
        this.#description = description;
        this.populate({});
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
