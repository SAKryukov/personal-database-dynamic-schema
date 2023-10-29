class ContextMenu extends Menu {

    #pointerDownItem = null;
    #horizontalHandler = null;
    #next = null;
    #previous = null;

    constructor(element, commandSet, selector) {
        super(element, commandSet);
        const previousIndex = Symbol();
        const nextIndex = Symbol();
        const itemSet = element.querySelectorAll(definitionSet.CSS.scopeSelector(selector));
        for (let index = 0; index < itemSet.length; ++index) {
            const item = itemSet[index];
            item[previousIndex] = index == 0 ? itemSet[itemSet.length - 1] : itemSet[index - 1];
            item[nextIndex] = index == itemSet.length - 1 ? itemSet[0] : itemSet[index + 1];
            const commandKey = item.dataset.command;
            if (commandKey == null)
                throw new Error(definitionSet.exceptions.commandNotDefined(item));
            const command = commandSet.get(commandKey);
            if (command == null)
                throw new Error(definitionSet.exceptions.commandNotFound(commandKey));
            item.onpointerdown = event => { this.#pointerDownItem = event.target; }; // simulates onclick
            item.onpointerup = event => { if (this.#pointerDownItem == event.target) this.invokeCommand(event.target); }; // simulates onclick
            item.onpointerenter = event => {  this.select(event.target); };
            if ((item.textContent == null || item.textContent.length < 1) & command.header != null)
                item.textContent = command.header;
            if (this.selectedItem == null)
                this.select(item);
        } //loop
        const selectDown = () => {
            this.select(this.selectedItem[nextIndex]);
        } //selectDown
        const selectUp = () => {
            this.select(this.selectedItem[previousIndex]);
        } //selectUp
        element.onkeydown = event => {
            switch (event.key) {
                case definitionSet.keyboard.up():
                    selectUp(); break;
                case definitionSet.keyboard.down():
                    selectDown(); break;    
                case definitionSet.keyboard.escape:
                    this.hide(); break;
                case definitionSet.keyboard.enter:
                    this.invokeCommand(this.selectedItem); break;
                case definitionSet.keyboard.left:
                    if (this.#horizontalHandler)
                        this.#horizontalHandler(this, true); break;
                case definitionSet.keyboard.right:
                    if (this.#horizontalHandler)
                        this.#horizontalHandler(this, false); break;
                default: return;
            } //switch
            event.preventDefault();
        }; //element.onkeydown
        element.onblur = () => { this.hide(); };
        this.updateView = () => {
            for (let item of itemSet) {
                const commandKey = item.dataset.command;
                const command = commandSet.get(commandKey);
                if (command.canExecuteHandler != null) {
                    var canExecute = command.canExecuteHandler(item);
                    item.setAttribute(definitionSet.attributes.disabled, !canExecute);
                } //if
            } //loop
            //SA??? rebuild linked list and adjust selection to avoid the disabled
        }; //this.updateView
    } //constructor

    set horizontalHandler(value) { this.#horizontalHandler = value; }
    set next(value) { this.#next = value; }
    set previous(value) { this.#previous = value; }
    get next() { return this.#next; }
    get previous() { return this.#previous; }

} //class ContextMenu
