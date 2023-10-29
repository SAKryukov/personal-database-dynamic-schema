class Search {

    constructor(pattern, matchCase, wholeWord, regexp, indicator, findNextButton, findHandler, hideFoundHandler, findNextHandler) {

        const hideFound = () => {
            indicator.textContent = null;
            findNextButton.style.display = definitionSet.CSS.display.none;
        }; //hideFound
        hideFound();

        pattern.oninput = () => {
            hideFound();
            if (hideFoundHandler)
                hideFoundHandler();
        }; //pattern.oninput

        pattern.onkeydown = event => {
            if (!findHandler) return;
            if (event.key != definitionSet.keyboard.enter) return;
            const found = findHandler(pattern.value, matchCase.isDown, wholeWord.isDown, regexp.isDown);
            indicator.textContent = definitionSet.search.foundNumber(found);
            if (found > 0)
                findNextButton.style.display = definitionSet.CSS.display.button;
        } //pattern.onkeydown

        if (findNextHandler)
            findNextButton.onclick = () => findNextHandler();

        const setButtonChangeHandler = button => {

            button.onChange = () => {
                hideFound();
                if (findNextHandler)
                    hideFoundHandler();
            };
        } //setButtonChangeHandler

        setButtonChangeHandler(matchCase);
        setButtonChangeHandler(wholeWord);
        setButtonChangeHandler(regexp);

    } //constructor

} //class Search
