/*
Personal Database

Copyright (c) 2017, 2023 by Sergey A Kryukov
http://www.SAKryukov.org
http://www.codeproject.com/Members/SAKryukov
*/

"use strict";

const createCommandSet = () => {
    
    const commandSet = new Map();
    const storedEvent = new CustomEvent(definitionSet.eventHandler.storedEvent);
    const notifyStored = () => window.dispatchEvent(storedEvent);

    const showException = exception => {
        document.title = definitionSet.titleFormat();
        commandSet.errorElement.textContent = exception.toString();
        commandSet.errorElement.style.display = null;
    }; //showException

    const fileIO = createFileIO(showException);
            
    commandSet.actConfirmed = function (action) {
        if (this.table.isModified) {
            modalPopup.show(
                definitionSet.eventHandler.dataModifiedRequest,
                [
                    { text: definitionSet.eventHandler.dataModifiedRequestButtonConfirm, action: action },
                    { escape: true, text: definitionSet.eventHandler.dataModifiedRequestButtonCancel }
                ],
                definitionSet.eventHandler.dataModifiedRequestStyles,
                null, // handler for the end of "modal" state
                this.table // element to finally focus
            );
        } else
            action();
    }; //commandSet.actConfirmed

    const showTitle = data => {
        const title = data ? (data.summary ? data.summary.title : null) : null;
        document.title = definitionSet.titleFormat(title);
    }; //showTitle

    commandSet.set("New", actionRequest => {
        if (!actionRequest) return;
        commandSet.actConfirmed(() => commandSet.table.reset() );
    });

    commandSet.set("Open", actionRequest => {
        if (!actionRequest) return;
        commandSet.actConfirmed(() => {
            fileIO.loadTextFile((_, text) => {
                try {
                    const json = definitionSet.scripting.extractJson(text);
                    const data = JSON.parse(json);
                    commandSet.table.load(data);
                    commandSet.summary.populate(data);
                    commandSet.table.isReadOnly = false;
                    showTitle(data);
                    notifyStored();
                } catch (ex) { showException(ex); }
            }, definitionSet.fileIO.filePickerAcceptType());
        });
    });

    const implementSave = (alwaysDialog) => {
        let content = null;
        try {
            const data = commandSet.table.store();
            commandSet.summary.updateData(data);
            showTitle(data);
            const json = JSON.stringify(data);
            content = definitionSet.scripting.wrapJson(json);
        } catch (ex) { showException(ex); }
        if (fileIO.canSave() && (!alwaysDialog))
            fileIO.saveExisting(definitionSet.fileIO.defaultSaveFilename(), content, definitionSet.fileIO.filePickerAcceptType());
        else
            fileIO.storeFile(definitionSet.fileIO.defaultSaveFilename(), content, definitionSet.fileIO.filePickerAcceptType());
    }; //implementSave

    commandSet.set("Save", actionRequest => {
        if (!actionRequest) return commandSet.table.canStore; //SA???
        implementSave(false);
    });

    commandSet.set("SaveAs", actionRequest => {
        if (!actionRequest) return;
        implementSave(true);
    });

    commandSet.set("Insert Row", actionRequest => {
        if (!actionRequest) return commandSet.table.canInsertRow;
        commandSet.table.insertRow();
    });
    
    commandSet.set("Remove Row", actionRequest => {
        if (!actionRequest) return commandSet.table.canRemoveRow;
        commandSet.table.removeRow();
    });

    commandSet.set("Add Property", actionRequest => {
        if (!actionRequest) return commandSet.table.canAddProperty;
        commandSet.table.addProperty()
    });
    commandSet.set("Insert Property", actionRequest => {
        if (!actionRequest) return commandSet.table.canInsertProperty;
        commandSet.table.insertProperty();
    });
    commandSet.set("Remove Property", actionRequest => {
        if (!actionRequest) return commandSet.table.canRemoveProperty;
        commandSet.table.removeProperty()
    });

    commandSet.set("Copy", actionRequest => {
        if (!actionRequest) return commandSet.table.canCopyToClipboard;
        try {
            commandSet.table.toClipboard();
        } catch (ex) { showException(ex); }
    });    

    commandSet.set("Paste", actionRequest => {
        if (!actionRequest) return commandSet.table.canPasteFromClipboard;
        try {
            commandSet.table.fromClipboard();
        } catch (ex) { showException(ex); }
    });    
    
    commandSet.set("Edit Selected Cell", actionRequest => {
        if (!actionRequest) return commandSet.table.canEditSelectedCell;
        if (commandSet.table.editingMode)
            setTimeout( () => { commandSet.table.commitEdit() });
        else
            setTimeout( () => { commandSet.table.editSelectedCell() });
    });

    commandSet.set("Edit Property Name", actionRequest => {
        if (!actionRequest) return commandSet.table.canEditProperty;
        if (commandSet.table.editingMode)
            setTimeout( () => { commandSet.table.cancelEdit(); });
        else
            setTimeout( () => { commandSet.table.editProperty(); });
    });

    const loadWebPage = (actionRequest) => {
        const uri = commandSet.table.selectedUri;
        if (!actionRequest) return !!uri;
        if (!uri) return false;
        try {
            window.open(uri, definitionSet.URI.newTab);
        } catch (exception) {
            showException(exception);
        } //exception
    } //loadWebPage
    commandSet.set("Load", loadWebPage);

    commandSet.set("up", actionRequest => {
        if (!actionRequest) return commandSet.table.canShuffleRow(true);
        commandSet.table.shuffleRow(true)
    });    
    commandSet.set("down", actionRequest => {
        if (!actionRequest) return commandSet.table.canShuffleRow(false);
        commandSet.table.shuffleRow(false)
    });    
    commandSet.set("left", actionRequest => {
        if (!actionRequest) return commandSet.table.canShuffleColumn(true);
        commandSet.table.shuffleColumn(true)
    });    
    commandSet.set("right", actionRequest => {
        if (!actionRequest) return commandSet.table.canShuffleColumn(false);
        commandSet.table.shuffleColumn(false)
    });    

    commandSet.set("Remember Query String in the Clipboard", actionRequest => {
        if (!actionRequest) return;
        const parameters = (new URLSearchParams(window.location.search));
        for (const [key, _] of parameters) {
            const result = key;
            navigator.clipboard.writeText(result);
            break;
        }
    });

    const aboutCommandSet = new Map();
    aboutCommandSet.set("About", actionRequest => {
        if (!actionRequest) return;
        window.open("./metadata/about.html", definitionSet.URI.newTab);
    });
    aboutCommandSet.set("Source Code", actionRequest => {
        if (!actionRequest) return;
        window.open("https://www.github.com/SAKryukov/personal-database-dynamic-schema", definitionSet.URI.newTab);
    });

    return { commandSet, aboutCommandSet, doubleClickHandler: loadWebPage };

};
