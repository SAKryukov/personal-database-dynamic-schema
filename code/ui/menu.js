class Menu {

    #onShown = null;
    #hideHandler = null;

    constructor(element, commandSet) {
        this.element = element;
        element.tabIndex = 0;
        this.commandSet = commandSet;
    } //constructor

    show(pointerX, pointerY) {
        this.updateView();
        this.element.style.zIndex = Number.MAX_SAFE_INTEGER;
        const rectangle = this.element.getBoundingClientRect();
        if (pointerX != null && pointerY != null) {
            this.element.style.left = pointerX + rectangle.width < window.innerWidth
                ? definitionSet.CSS.coordinate(pointerX)
                : definitionSet.CSS.coordinate(pointerX - rectangle.width);
            this.element.style.top = pointerY + rectangle.height < window.innerHeight
                ? definitionSet.CSS.coordinate(pointerY)
                : definitionSet.CSS.coordinate(pointerY - rectangle.height);
        } else {
            this.element.style.left = definitionSet.CSS.coordinate(window.innerWidth / 2);
            this.element.style.top = definitionSet.CSS.coordinate(window.innerHeight / 2);
        } //if
        this.element.style.visibility = definitionSet.CSS.visibility.visible;
        this.owner = document.activeElement;
        this.element.focus();
        if (this.#onShown)
            this.#onShown();
    } //show

    get onShown() { return this.#onShown; }
    set onShown(handler) { this.#onShown = handler; }
    set hideHandler(handler) { this.#hideHandler = handler; }

    hide() {
        this.element.style.visibility = definitionSet.CSS.visibility.hidden;
        if (this.owner)
            this.owner.focus();
        if (this.#hideHandler)
            this.#hideHandler(this);
    } //hide
    
    select(item) {
        if (item == null) return;
        if (this.selectedItem != null)
           this.selectedItem.className = null;
        this.selectedItem = item;
        this.selectedItem.className = definitionSet.CSS.selection;
    } //select

    invokeCommand(item) {
        if (item.dataset.command == null && this.commandSet === null) return;
        const command = this.commandSet.get(item.dataset.command);
        if (!command) return;
        if (!command.canExecute) return;
        command.execute();
        this.hide();
    } //invokeCommand

} //class Menu

