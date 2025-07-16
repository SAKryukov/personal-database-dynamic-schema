/*
Personal Database

Copyright (c) 2017, 2023, 2025 by Sergey A Kryukov
http://www.SAKryukov.org
http://www.codeproject.com/Members/SAKryukov
*/

"use strict";

const createCommandSet = (table, summary) => {
    
    const commandSetMap = new Map();
    commandSetMap.table = table;

    const storedEvent = new CustomEvent(definitionSet.eventHandler.storedEvent);
    const notifyStored = () => window.dispatchEvent(storedEvent);

    const showException = exception => {      
        modalPopup.show(
            exception.toString(),
            [],
            definitionSet.eventHandler.dataModifiedRequestStyles,
            null, // handler for the end of "modal" state
            commandSetMap.table.element // element to finally focus
        );
        document.title = definitionSet.titleFormat();
    }; //showException

    const fileIO = createFileIO(showException);
            
    commandSetMap.actConfirmed = function (action) {
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

    commandSetMap.set("New", actionRequest => {
        if (!actionRequest) return;
        commandSetMap.actConfirmed(() => commandSetMap.table.reset() );
    });

    const loadDatabase = data => {
        commandSetMap.table.load(data);
        summary.populate(data);
        showTitle(data);
    }; //loadDatabase

    commandSetMap.set("Open", actionRequest => {
        if (!actionRequest) return;
        commandSetMap.actConfirmed(() => {
            fileIO.loadTextFile((_, text) => {
                try {
                    const json = definitionSet.scripting.extractJson(text);
                    const data = JSON.parse(json);
                    loadDatabase(data);
                    commandSetMap.table.isReadOnly = false;
                    notifyStored();
                } catch (ex) { showException(ex); }
            }, definitionSet.fileIO.filePickerAcceptType());
        });
    });

    const implementSave = (alwaysDialog) => {
        let content = null;
        try {
            const data = commandSetMap.table.store();
            summary.updateData(data);
            showTitle(data);
            const json = JSON.stringify(data);
            content = definitionSet.scripting.wrapJson(json);
        } catch (ex) { showException(ex); }
        if (fileIO.canSave() && (!alwaysDialog))
            fileIO.saveExisting(definitionSet.fileIO.defaultSaveFilename(), content, definitionSet.fileIO.filePickerAcceptType());
        else
            fileIO.storeFile(definitionSet.fileIO.defaultSaveFilename(), content, definitionSet.fileIO.filePickerAcceptType());
    }; //implementSave

    commandSetMap.set("Save", actionRequest => {
        if (!actionRequest) return commandSetMap.table.canStore; //SA???
        implementSave(false);
    });

    commandSetMap.set("SaveAs", actionRequest => {
        if (!actionRequest) return;
        implementSave(true);
    });

    commandSetMap.set("Insert Row", actionRequest => {
        if (!actionRequest) return commandSetMap.table.canInsertRow;
        commandSetMap.table.insertRow();
    });
    
    commandSetMap.set("Remove Row", actionRequest => {
        if (!actionRequest) return commandSetMap.table.canRemoveRow;
        commandSetMap.table.removeRow();
    });

    commandSetMap.set("Add Property", actionRequest => {
        if (!actionRequest) return commandSetMap.table.canAddProperty;
        commandSetMap.table.addProperty()
    });
    commandSetMap.set("Insert Property", actionRequest => {
        if (!actionRequest) return commandSetMap.table.canInsertProperty;
        commandSetMap.table.insertProperty();
    });
    commandSetMap.set("Remove Property", actionRequest => {
        if (!actionRequest) return commandSetMap.table.canRemoveProperty;
        commandSetMap.table.removeProperty()
    });

    commandSetMap.set("Copy", actionRequest => {
        if (!actionRequest) return commandSetMap.table.canCopyToClipboard;
        try {
            commandSetMap.table.toClipboard();
        } catch (ex) { showException(ex); }
    });    

    commandSetMap.set("Paste", actionRequest => {
        if (!actionRequest) return commandSetMap.table.canPasteFromClipboard;
        try {
            commandSetMap.table.fromClipboard();
        } catch (ex) { showException(ex); }
    });    
    
    commandSetMap.set("Edit Selected Cell", actionRequest => {
        if (!actionRequest) return commandSetMap.table.canEditSelectedCell;
        if (commandSetMap.table.editingMode)
            setTimeout( () => { commandSetMap.table.commitEdit() });
        else
            setTimeout( () => { commandSetMap.table.editSelectedCell() });
    });

    commandSetMap.set("Edit Property Name", actionRequest => {
        if (!actionRequest) return commandSetMap.table.canEditProperty;
        if (commandSetMap.table.editingMode)
            setTimeout( () => { commandSetMap.table.cancelEdit(); });
        else
            setTimeout( () => { commandSetMap.table.editProperty(); });
    });

    const loadWebPage = (actionRequest) => {
        const uri = commandSetMap.table.selectedUri;
        if (!actionRequest) return !!uri;
        if (!uri) return false;
        try {
            window.open(uri, definitionSet.URI.newTab);
        } catch (exception) {
            showException(exception);
        } //exception
    } //loadWebPage
    commandSetMap.set("Load", loadWebPage);

    commandSetMap.set("up", actionRequest => {
        if (!actionRequest) return commandSetMap.table.canShuffleRow(true);
        commandSetMap.table.shuffleRow(true)
    });    
    commandSetMap.set("down", actionRequest => {
        if (!actionRequest) return commandSetMap.table.canShuffleRow(false);
        commandSetMap.table.shuffleRow(false)
    });    
    commandSetMap.set("left", actionRequest => {
        if (!actionRequest) return commandSetMap.table.canShuffleColumn(true);
        commandSetMap.table.shuffleColumn(true)
    });    
    commandSetMap.set("right", actionRequest => {
        if (!actionRequest) return commandSetMap.table.canShuffleColumn(false);
        commandSetMap.table.shuffleColumn(false)
    });    

    commandSetMap.set("Remember Query String in the Clipboard", actionRequest => {
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

    return { commandSetMap, aboutCommandSet, doubleClickHandler: loadWebPage, loadDatabase, showPreloadException };

};
