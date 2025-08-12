/*
Personal Database

Copyright (c) 2017, 2023, 2025 by Sergey A Kryukov
http://www.SAKryukov.org
http://www.codeproject.com/Members/SAKryukov
*/

class Table {

    #parent = null;
    #table = null;
    #headerRow = null;
    #body = null;
    #fromData = null;
    #addRow = null;
    #selectedCell = null;
    #editingCell = null;
    #savedCellData = null;
    #isReadOnly = false;
    #searchResults = [];
    #indexInSearchResults = -1;
    #readOnlyEvent = new CustomEvent(definitionSet.eventHandler.readOnlyEvent);
    #modifiedEvent = new CustomEvent(definitionSet.eventHandler.modifiedEvent);
    #notifyReadonly = null;
    #notifyModified = null;
    #hint = null;
    #doubleClickHandler = null;
    #getUri = null;
    #setupUri = null;
    #modified = false;

    constructor(parent) {
        const rowCount = 1;
        const propertyCount = 1; //otherwise it will test the component
        this.#parent = parent;
        this.#table = document.createElement(definitionSet.table.tableTag);
        const head = this.#table.createTHead();
        this.#headerRow = head.insertRow();
        this.#body = this.#table.createTBody();
        this.#hint = new Hint(parent, definitionSet.table.editingHint);
        const onBlurHandle = event => {
            if (event.target == this.#editingCell)
                this.#stopEditing(event.target, true, false, true);
        } //onBlurHandle
        for (let xIndex = -1; xIndex <= propertyCount; ++xIndex) {
            const cell = document.createElement(definitionSet.table.headerTag);
            cell.onblur = onBlurHandle;
            this.#headerRow.appendChild(cell);
            if (xIndex >= 0 && xIndex < propertyCount)
                cell.textContent = propertyCount == 1
                    ? definitionSet.table.initialPropertyName
                    : definitionSet.tableTest.headerText(xIndex);
            else
                cell.textContent = definitionSet.table.rowIndexHeader;
        } //loop
        for (let rowIndex = 0; rowIndex < rowCount; ++rowIndex) {
            const row = this.#body.insertRow();
            const left = row.insertCell();
            left.textContent = rowIndex + 1;
            for (let xIndex = 0; xIndex < propertyCount; ++xIndex) {
                const cell = row.insertCell(1);
                cell.textContent = propertyCount == 1
                    ? definitionSet.table.initialValue
                    : definitionSet.tableTest.cellText(rowIndex);
                cell.onpointerdown = event => this.#select(event.target);
                cell.onblur = onBlurHandle;
                row.appendChild(cell);
            } //loop x
            const right = row.insertCell();
            right.textContent = rowIndex + 1;
        } //loop row
        this.#getUri = cell => {
            if (!cell) return null;
            const content = cell.textContent;
            if (!content) return null;
            if (content.startsWith(definitionSet.URI.HTTP[0]) || content.startsWith(definitionSet.URI.HTTP[1]))
                return content;
        } //this.#getUri
        this.#setupUri = cell => {
            const uri = this.#getUri(cell);
            cell.ondblclick = uri != null && this.#doubleClickHandler == null
                ? null
                : event => this.#doubleClickHandler(event);
            if (uri == null)
                cell.classList.remove(definitionSet.CSS.URI);
            else
                cell.classList.add(definitionSet.CSS.URI);
        }; //this.#setupUri
        this.#fromData = data => {
            const propertyCount = data.properties.length;
            while (this.#body.rows.length > 0)
                this.#body.removeChild(this.#body.lastChild);
            while (this.#headerRow.cells.length > 0)
                this.#headerRow.removeChild(this.#headerRow.lastChild);
            for (let xIndex = -1; xIndex <= propertyCount; ++xIndex) {
                const cell = document.createElement(definitionSet.table.headerTag);
                if (xIndex >= 0 && xIndex < propertyCount)
                    cell.textContent = data.properties[xIndex];
                else
                    cell.textContent = definitionSet.table.rowIndexHeader;
                this.#headerRow.appendChild(cell);
            } //loop      
            for (let rowIndex = 0; rowIndex < data.records.length; ++rowIndex) {
                const row = this.#body.insertRow();
                const left = row.insertCell();
                left.textContent = rowIndex + 1;
                for (let index = 0; index < propertyCount; ++index)
                    row.insertCell(1).onpointerdown = event => this.#select(event.target);
                for (let factIndex = 0; factIndex < data.records[rowIndex].length; ++factIndex) {
                    const fact = data.records[rowIndex][factIndex];
                    const cell = this.#body.rows[rowIndex].cells[fact.property + 1];
                    //cell.textContent = data.values[fact.value]; //SA??? from data
                    definitionSet.persistence.fromText(cell, data.values[fact.value]);
                    this.#setupUri(cell);
                } //loop
                const right = row.insertCell();
                right.textContent = rowIndex + 1;        
            } //loop row
            if (data.records && (data.records.length < 1 || data.records[data.records.length - 1].length > 0))
                this.#addRow();
            this.#setInitialSelection();
        } //this.#fromData
        this.#addRow = () => {
            const rowIndex = this.#body.rows.length;
            const propertyCount = this.#headerRow.cells.length - 2;
            const row = this.#body.insertRow();
            const left = row.insertCell();
            left.textContent = rowIndex + 1;
            for (let xIndex = 0; xIndex < propertyCount; ++xIndex) {
                const cell = row.insertCell(1);
                cell.onpointerdown = event => this.#select(event.target);
            } //loop x
            const right = row.insertCell();
            right.textContent = rowIndex + 1;
        }; //this.#addRow
        this.#table.tabIndex = 0;
        parent.appendChild(this.#table);
        this.#table.onkeypress = event => {
            if (event.ctrlKey || this.editingMode)
                return;
            this.editSelectedCell();
        }; //this.#table.onkeypress
        this.#table.onkeydown = event => {
            if (this.editingMode)
                return;
            const page = true;
            switch (event.key) {
                case definitionSet.keyboard.left:
                    if (event.ctrlKey && event.shiftKey) {
                        if (this.canShuffleColumn(true))   
                            this.shuffleColumn(true);
                    } else
                        this.#selectLeft();
                    break;
                case definitionSet.keyboard.right:
                    if (event.ctrlKey && event.shiftKey) {
                        if (this.canShuffleColumn(false))   
                            this.shuffleColumn(false);
                    } else
                        this.#selectRight();
                    break;
                case definitionSet.keyboard.up():
                    if (event.ctrlKey && event.shiftKey) {
                        if (this.canShuffleRow(true))   
                            this.shuffleRow(true);
                    } else
                        this.#selectUp();
                    break;
                case definitionSet.keyboard.down():
                    if (event.ctrlKey && event.shiftKey) {
                        if (this.canShuffleRow(false))
                            this.shuffleRow(false);
                    } else
                        this.#selectDown(); break;
                case definitionSet.keyboard.up(page):
                    this.#selectUp(page); break;
                case definitionSet.keyboard.down(page):
                    this.#selectDown(page); break;
                case definitionSet.keyboard.home:
                    this.#selectTop(); break;
                case definitionSet.keyboard.end:
                    this.#selectBottom(); break;
                case definitionSet.keyboard.edit:
                    if (event.ctrlKey)
                        this.editProperty();
                    else
                        this.editSelectedCell();
                    break;
                default: return;
            } //switch
            event.preventDefault(); 
        }; //this.#table.onkeydown
        document.body.oncopy = () => {
            if (this.#editingCell)
                return;
            this.toClipboard();
        }; //document.body.oncopy
        document.body.onpaste = () => {
            if (this.#editingCell)
                return;
            if (!this.#isReadOnly)
                this.fromClipboard();   
        }; //document.body.onpaste
        this.#setInitialSelection();
        this.#notifyReadonly = function() { window.dispatchEvent(this.#readOnlyEvent); }
        this.#notifyModified = function() { this.#modified = true; window.dispatchEvent(this.#modifiedEvent); }
    } //constructor

    #setInitialSelection() {
        if (this.#body.rows.length > 0 && this.#body.rows[0].cells.length > 2)
            this.#select(this.#body.rows[0].cells[1]);
    } //#setInitialSelection

    #select(cell, down, noFocus) {
        const previouslySelectedCell = this.#selectedCell;
        if (this.#selectedCell != null)
            this.#selectedCell.classList.remove(definitionSet.CSS.selection);
        this.#selectedCell = cell;
            this.#selectedCell.classList.add(definitionSet.CSS.selection);
        let showingCell = cell;
        let rowIndex = this.#selectedCell.parentElement.rowIndex - 1;
        let xIndex = cell.cellIndex;
        if (!down) rowIndex -= 1;
        if (rowIndex < 0)
            rowIndex = 0;
        if (xIndex <= 1)
           xIndex = 0;
        else if (xIndex >= this.#headerRow.childNodes.length - 2)
           xIndex = this.#headerRow.childNodes.length - 1
        if (xIndex <= 1)
            xIndex = 0;
        showingCell = this.#body.rows[rowIndex].cells[xIndex];
        showingCell.scrollIntoView({block: "nearest", inline: "nearest"});
        if (rowIndex < 1) {
            const parent = this.#table.parentElement;
            parent.scrollTo(parent.scrollLeft, 0);
        } //if
        if (!noFocus && previouslySelectedCell != null)
            this.#stopEditing(previouslySelectedCell, undefined, true);
    } //select

    #getVisibleCellNumber() {
        let rect = this.#parent.getBoundingClientRect();
        let bodyHeight = rect.height;
        rect = this.#headerRow.getBoundingClientRect();
        bodyHeight -= rect.height;
        rect = this.#selectedCell.getBoundingClientRect();
        const cellHeight = rect.height;
        return Math.floor(bodyHeight / cellHeight);
    } //#getVisibleCellNumber

    #selectRight() {
        const newX = this.#selectedCell.cellIndex + 1;
        if (newX >= this.#headerRow.childNodes.length - 1) return true;
        const rowIndex = this.#selectedCell.parentElement.rowIndex - 1;
        this.#select(this.#body.rows[rowIndex].cells[newX]);
    } //#selectRight
    #selectLeft() {
        const newX = this.#selectedCell.cellIndex - 1;
        if (newX <= 0) return true;
        const rowIndex = this.#selectedCell.parentElement.rowIndex - 1;
        this.#select(this.#body.rows[rowIndex].cells[newX]);
    } //#selectRight
    #selectUp(page) { 
        const newX = this.#selectedCell.cellIndex;
        let rowIndex = this.#selectedCell.parentElement.rowIndex - 1;
        if (page)
            rowIndex -= this.#getVisibleCellNumber() - 2;
        if (rowIndex < 1) rowIndex = 1;
        this.#select(this.#body.rows[rowIndex - 1].cells[newX]);
    } //#selectUp
    #selectDown(page) {
        const newX = this.#selectedCell.cellIndex;
        let rowIndex = this.#selectedCell.parentElement.rowIndex - 1;
        if (page)
            rowIndex += this.#getVisibleCellNumber() - 2;
        if (rowIndex + 1 >= this.#body.rows.length) rowIndex = this.#body.rows.length - 2;
        this.#select(this.#body.rows[rowIndex + 1].cells[newX], true);
    } //#selectDown
    #selectTop() {
        const x = this.#selectedCell.cellIndex;
        this.#select(this.#body.rows[0].cells[x]);
    } //#selectTop
    #selectBottom() {
        const x = this.#selectedCell.cellIndex;
        this.#select(this.#body.rows[this.#body.rows.length - 1].cells[x], true);
    } //#selectBottom

    #renumberRows(start) {
        for (let index = start; index < this.#body.rows.length; ++index) {
            const row = this.#body.rows[index];
            row.cells[0].textContent = row.cells[row.cells.length - 1].textContent = index + 1;
        } //loop
    } //#renumberRows

    get canRemoveRow() {
        return !this.#isReadOnly && this.#selectedCell != null && this.#body.rows.length > 2;
    } //canRemoveRow
    removeRow() {
        const cellIndex = this.#selectedCell.cellIndex;
        let rowIndex = this.#selectedCell.parentElement.rowIndex;
        this.#body.deleteRow(rowIndex - 1);
        this.#renumberRows(rowIndex - 1);
        if (rowIndex > this.#body.rows.length)
            rowIndex = this.#body.rows.length;
        this.#select(this.#body.rows[rowIndex - 1].cells[cellIndex]);
        this.#notifyModified();
        setTimeout(() => this.#table.focus());
    } //removeRow

    get canInsertRow() {
        return !this.#isReadOnly && this.#selectedCell != null;
    } //canInsertRow
    insertRow() {
        const rowIndex = this.#selectedCell.parentElement.rowIndex;
        const row = this.#body.insertRow(rowIndex - 1);
        for (let index = 0; index < this.#headerRow.cells.length; ++index) {
            const cell = row.insertCell();
            if (index == 0 || index == this.#headerRow.cells.length - 1)
                cell.textContent = rowIndex;
            else
                cell.onpointerdown = event => this.#select(event.target);
        } //loop
        this.#renumberRows(rowIndex);
        const newCell = row.cells[this.#selectedCell.cellIndex];
        this.#select(newCell);
        this.#notifyModified();
        setTimeout(() => this.#table.focus());
    } //insertRow

    get canAddProperty() { return !this.#isReadOnly; }
    addProperty() {
        const cell = document.createElement(definitionSet.table.headerTag);
        const index = this.#headerRow.cells.length - 1;
        this.#headerRow.insertBefore(cell, this.#headerRow.cells[index]);
        for (let rowIndex = 0; rowIndex < this.#body.rows.length; ++rowIndex)
            this.#body.rows[rowIndex].insertCell(index).onpointerdown = event => this.#select(event.target);
        this.#notifyModified();
        const row = this.#selectedCell.parentElement;
        const newCell = row.cells[row.cells.length - 2];
        this.#select(newCell);
        setTimeout(() => this.#table.focus());
    } //addProperty

    get canInsertProperty() {
        return !this.#isReadOnly && this.#selectedCell != null;
    } //canInsertProperty
    insertProperty() {
        const index = this.#selectedCell.cellIndex - 1;
        if (index >= this.#headerRow.cells.length - 2) return;
        const cell = document.createElement(definitionSet.table.headerTag);
        this.#headerRow.insertBefore(cell, this.#headerRow.cells[index + 1]);
        for (let rowIndex = 0; rowIndex < this.#body.rows.length; ++rowIndex)
            this.#body.rows[rowIndex].insertCell(index + 1).onpointerdown = event => this.#select(event.target);
        this.#notifyModified();
        const row = this.#selectedCell.parentElement;
        const newCell = row.cells[this.#selectedCell.cellIndex - 1];
        this.#select(newCell);
        setTimeout(() => this.#table.focus());
    } //insertProperty

    canShuffleRow(up) {        
        if (this.#isReadOnly || this.#selectedCell == null)
            return false;
        const rowIndex = this.#selectedCell.parentElement.rowIndex - 1;
            return up
            ? rowIndex > 0
            : rowIndex < this.#body.rows.length - 1;
    } //canShuffleRow
    shuffleRow(up) {
        const cellIndex = this.#selectedCell.cellIndex;
        const rowIndex = this.#selectedCell.parentElement.rowIndex - 1;
        const target = this.#body.rows[rowIndex];
        this.#body.removeChild(target);
        const newRowIndex = up ? rowIndex - 1 : rowIndex + 1;
        this.#body.insertBefore(target, this.#body.rows[newRowIndex]);
        this.#select(this.#body.rows[newRowIndex].cells[cellIndex]);
        this.#renumberRows(newRowIndex <= 0 ? 0 : newRowIndex - 1);
        this.#notifyModified();
    } //shuffleRow

    canShuffleColumn(left) {
        if (this.#isReadOnly || this.#selectedCell == null)
            return false;
        const cellIndex = this.#selectedCell.cellIndex;
        return left
        ? cellIndex > 1 
        : cellIndex < this.#headerRow.cells.length - 2;
    } //canShuffleColumn
    shuffleColumn(left) {
        const cellIndex = this.#selectedCell.cellIndex;
        const rowIndex = this.#selectedCell.parentElement.rowIndex - 1;
        const newCellIndex = left ? cellIndex - 1 : cellIndex + 1;
        const columnName = this.#headerRow.cells[cellIndex].textContent;
        this.#headerRow.cells[cellIndex].textContent = this.#headerRow.cells[newCellIndex].textContent;
        this.#headerRow.cells[newCellIndex].textContent = columnName;
        for (let row of this.#body.rows) {
            const movingCell = row.cells[cellIndex];
            row.removeChild(movingCell);
            row.insertBefore(movingCell, row.cells[newCellIndex]);
        } //loop
        this.#select(this.#body.rows[rowIndex].cells[newCellIndex]);
        this.#notifyModified();
    } //shuffleColumn

    get canRemoveProperty() {
        return !this.#isReadOnly && this.#selectedCell != null && this.#headerRow.cells.length > 3;
    } //canRemoveProperty
    removeProperty() {
        let cellIndex = this.#selectedCell.cellIndex;
        const rowIndex = this.#selectedCell.parentElement.rowIndex;
        this.#headerRow.deleteCell(cellIndex);
        for (let rowIndex = 0; rowIndex < this.#body.rows.length; ++rowIndex)
            this.#body.rows[rowIndex].deleteCell(cellIndex);
        if (cellIndex > this.#headerRow.cells.length - 2)
            cellIndex = this.#headerRow.cells.length - 2;
        this.#select(this.#body.rows[rowIndex - 1].cells[cellIndex]);
        this.#notifyModified();
        setTimeout(() => this.#table.focus());
    } //removeProperty

    #editCell(cell) {
        if (this.#isReadOnly) return;
        if (!cell) return;
        cell.contentEditable = true;
        this.#hint.show(cell);
        this.#editingCell = cell;
        this.#savedCellData = cell.innerHTML;
        cell.onkeydown = event => {
            const escape = event.key == definitionSet.keyboard.escape;
            const commit = event.ctrlKey && event.key == definitionSet.keyboard.enter;
            if (!(escape || commit))
                return;
            event.preventDefault();
            this.#stopEditing(cell, escape);
        } //cell.onkeydown
        const range = document.createRange();
        range.selectNodeContents(cell);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    } //#editCell
    #stopEditing(cell, cancel, isSelection, noFocus) {
        this.#hint.show();
        if (!noFocus)
            setTimeout(() => this.#table.focus());
        this.#editingCell = null;
        cell.contentEditable = false;
        if (!cancel)
            this.#addRowOnEdit(cell);
        else
            cell.innerHTML = this.#savedCellData;
        this.#setupUri(cell);
        if (!cancel && !isSelection)
            this.#notifyModified();
    } //stopEditing

    get canEditSelectedCell() { return this.#selectedCell != null && ! this.#isReadOnly }
    editSelectedCell() {
        this.#editCell(this.#selectedCell);
        this.#selectedCell.focus();
    } //#editSelectedCell
    get canEditProperty() { return this.#selectedCell != null && ! this.#isReadOnly }
    editProperty() {
        if (!this.#selectedCell) return;
        const propertyCell = this.#headerRow.cells[this.#selectedCell.cellIndex];
        this.#editCell(propertyCell);
        setTimeout(() => { propertyCell.focus(); });
    } //editProperty

    #addRowOnEdit(cell) {
        if (cell.parentElement == this.#body.rows[this.#body.rows.length - 1] && cell.innerHTML != null && cell.innerHTML.length > 0)
            this.#addRow();
    } //#addRowOnEdit

    commitEdit() { this.#stopEditing(this.#editingCell, false); }
    cancelEdit() { this.#stopEditing(this.#editingCell, true); }

    get editingMode() { return this.#editingCell != null; }

    load(data) {
        this.#fromData(data);
    } //populate
    reset() {
        this.load(definitionSet.table.initialData);
        this.isReadOnly = false;
    } //reset

    get canStore() { return !this.#isReadOnly; }
    store() {
        const properties = [];
        for (let cell of this.#headerRow.cells) {
            if (cell.cellIndex <= 0 || cell.cellIndex >= this.#headerRow.cells.length - 1) continue;
            //SA??? store
            properties.push(definitionSet.persistence.toText(cell));
        } //loop
        const values = [];
        const records = [];
        const valueMap = new Map();
        const isEmpty = row => {    
            for (let cell of row.cells) {
                if (cell.cellIndex == 0 || cell.cellIndex == row.cells.length - 1)
                    continue;
                if (cell.textContent)
                    return false;
            } //loop
            return true;
        } //isEmpty
        for (let row of this.#body.rows) {
            if (row == this.#body.lastChild && (isEmpty(row)))
                break;
            const record = [];
            for (let cell of row.cells) {
                if (cell.cellIndex <= 0 || cell.cellIndex >= this.#headerRow.cells.length - 1) continue;
                const value = definitionSet.persistence.toText(cell); //SA??? store
                if (value == null || value.length < 1)
                    continue;
                let valueIndex = valueMap.get(value);
                if (valueIndex == null) {
                    valueIndex = values.length;
                    valueMap.set(value, valueIndex);
                    values.push(value);
                } //if
                record.push({ property: cell.cellIndex - 1, value: valueIndex });
            } //loop row
            records.push(record);
        } //loop rows
        return { summary: {}, properties: properties, values: values, records: records };
    } //store

    get canPasteFromClipboard() { return !this.#isReadOnly && this.#selectedCell != null; }
    fromClipboard() {
        if (this.#selectedCell == null) return;
        navigator.clipboard.readText().then(value => {
            //this.#selectedCell.textContent = value; //SA??? from clipboard
            definitionSet.persistence.fromText(this.#selectedCell, value);
            this.#addRowOnEdit(this.#selectedCell);
            this.#notifyModified();
        }).catch(pasteException => {
            console.info(pasteException);
        });
        setTimeout(() => this.#table.focus());
    } //fromClipboard

    get canCopyToClipboard() { return this.#selectedCell != null; }
    toClipboard() {
        if (this.#selectedCell == null) return;
        //navigator.clipboard.writeText(this.#selectedCell.textContent); //SA??? to clipboard
        navigator.clipboard.writeText(definitionSet.persistence.toText(this.#selectedCell));
        setTimeout(() => this.#table.focus());
    } //toClipboard

    focus() {
        this.#table.focus();
    } //focus

    find(pattern, matchCase, wholeWord, isRegexp) {
        const escapeAll = text => text;
        const createRegexp = (pattern, matchCase, wholeWord, isRegexp) => {
            if (isRegexp || wholeWord) {
                if (isRegexp)
                    return new RegExp(pattern, matchCase ? "ui" : "u");
                else
                    return new RegExp("\\b" + escapeAll(pattern) + "\\b", matchCase ? "ui" : "u");
            } else
                return null;
        }; //createRegexp
        const findInCell = (cell, pattern, matchCase, regexp) => {
            let source = cell.textContent;
            if (regexp == null) {   
                let searchString = pattern;
                if (!matchCase) {
                    searchString = searchString.toLocaleLowerCase();
                    source = source.toLocaleLowerCase();
                } //if
                return source.includes(searchString);
            } else
                return regexp.test(source); 
        }; //findInCell
        this.hideFound();
        this.#searchResults.splice(0);
        const regexp = createRegexp(pattern, matchCase, wholeWord, isRegexp);
        for (let row of this.#body.rows)
            for (let cell of row.cells) {
                if (cell.cellIndex < 1 || cell.cellIndex >= this.#headerRow.cells.length - 1) continue;
                if (findInCell(cell, pattern, matchCase, regexp)) {
                    this.#searchResults.push(cell);
                    cell.classList.add(definitionSet.CSS.found);
                } //if
            } //loop
        const hasResults = this.#searchResults.length > 0;
        this.#indexInSearchResults = hasResults ? 0 : -1;
        if (hasResults) {
            const currentSelection = this.#selectedCell == null ? -1 : this.#selectedCell.parentElement.rowIndex;
            const newSelection = this.#searchResults[0].parentElement.rowIndex;
            this.#select(this.#searchResults[0], newSelection >= currentSelection, true);
            this.#table.focus();
        } //if
        return this.#searchResults.length;
    } //find
    hideFound() {
        for(let cell of this.#searchResults)
            cell.classList.remove(definitionSet.CSS.found);
    } //hideFound
    findNext() {
        if (this.#indexInSearchResults < 0) return;
        ++this.#indexInSearchResults;
        if (this.#indexInSearchResults >= this.#searchResults.length)
            this.#indexInSearchResults = 0;
        this.#select(this.#searchResults[this.#indexInSearchResults], this.#indexInSearchResults > 0, true);
        this.#table.focus();
    } //findNext

    get isReadOnly() { return this.#isReadOnly; }
    set isReadOnly(value) { this.#isReadOnly = value; this.#notifyReadonly(); }

    get isModified() { return this.#modified; }
    set isModified(value) { this.#modified = value; }

    get selectedCell() { return this.#selectedCell; }
    get selectedUri() { return this.#getUri(this.#selectedCell); }
    
    get doubleClickHandler() { return this.#doubleClickHandler; }
    set doubleClickHandler(handler) { this.#doubleClickHandler = handler; }

    get element() { return this.#table; }

} //class Table
