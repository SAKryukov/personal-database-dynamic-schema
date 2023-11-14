class Search {

    constructor(elements, findHandler, hideFoundHandler, findNextHandler) {

        const pattern = elements.search.searchPattern;

        const matchCase = new TwoStateButton(elements.search.options.matchCase, definitionSet.CSS.buttonUp, definitionSet.CSS.buttonDown, true);
        const wholeWord = new TwoStateButton(elements.search.options.wholeWord, definitionSet.CSS.buttonUp, definitionSet.CSS.buttonDown, false);
        const useRegexp = new TwoStateButton(elements.search.options.useRegexp, definitionSet.CSS.buttonUp, definitionSet.CSS.buttonDown, false);
        const searchResults = elements.search.searchResults;
        const buttonNext = elements.search.buttonNext;

        new Hint(elements.main, pattern);
        new Hint(elements.main, elements.search.options.matchCase);
        new Hint(elements.main, elements.search.options.wholeWord);
        new Hint(elements.main, elements.search.options.useRegexp);
        new Hint(elements.main, buttonNext);

        const hideFound = () => {
            searchResults.textContent = null;
            buttonNext.style.display = definitionSet.CSS.display.none;
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
            const found = findHandler(pattern.value, matchCase.isDown, wholeWord.isDown, useRegexp.isDown);
            searchResults.textContent = definitionSet.search.foundNumber(found);
            if (found > 0)
                buttonNext.style.display = definitionSet.CSS.display.button;
        } //pattern.onkeydown

        if (findNextHandler)
            buttonNext.onclick = () => findNextHandler();

        const setButtonChangeHandler = button => {

            button.onChange = () => {
                hideFound();
                if (findNextHandler)
                    hideFoundHandler();
            };
        } //setButtonChangeHandler

        setButtonChangeHandler(matchCase);
        setButtonChangeHandler(wholeWord);
        setButtonChangeHandler(useRegexp);

    } //constructor

} //class Search
