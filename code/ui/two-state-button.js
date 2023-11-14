class TwoStateButton {

    #element = null;
    #isDown = false;
    #upClass = null;
    #downClass = null;
    #onChange = null;

    constructor(element, upClass, downClass, initialDown, onChange) {
        this.#element = element;
        this.#upClass = upClass;
        this.#downClass = downClass;
        this.isDown = initialDown;
        this.#onChange = onChange;
        this.#element.onclick = () => { this.isDown = !this.isDown; };
    } //constructor

    get isDown() { return this.#isDown; }
    set isDown(value) {
        this.#isDown = value;
        this.#element.className = value ? this.#downClass : this.#upClass;
        if (this.#onChange)
            this.#onChange(value);
    } //isDown

    set onChange(handler) {
        this.#onChange = handler;
    }
    get element() { return this.#element; }

} //class TwoStateButton

