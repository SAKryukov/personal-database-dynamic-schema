/*
Personal Database

Copyright (c) 2017, 2023, 2025 by Sergey A Kryukov
http://www.SAKryukov.org
http://www.codeproject.com/Members/SAKryukov
*/

"use strict";

const getElements = () => {
    
    const result = {
        main: document.querySelector("main"),
        product: document.querySelector("#product"),
        mainMenu: document.querySelector("header > menu"),
        contextMenu: document.querySelector("main select"),
        summary: {
            title: document.querySelector("#summary-title"),
            created: document.querySelector("#summary-created"),
            updated: document.querySelector("#summary-updated"),
            description: document.querySelector("#summary-description"),
        },
        indicators: {
            readOnly: document.querySelector("#read-only"),
            modified: document.querySelector("#modified"),
        },
        search: {
            searchPattern: document.querySelector("#search"),
            options: {
                matchCase: document.querySelector("#search-match-case"),
                wholeWord: document.querySelector("#search-whole-word"),
                useRegexp: document.querySelector("#search-regexp"),
            },
            searchResults: document.querySelector("#search-results"),
            buttonNext: document.querySelector("#search-next"),
        },
    };

    Object.freeze(result);

    return result;

};

