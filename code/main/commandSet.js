"use strict";

const createCommandSet = () => {
    
    const commandSet = new Map();
    const storedEvent = new CustomEvent(definitionSet.eventHandler.storedEvent);
    const notifyStored = () => window.dispatchEvent(storedEvent);
            
    // definitionSet is frozen, but modalPopup.show tries to modify styles, hence this workaround:
    const styles = window.structuredClone(definitionSet.eventHandler.dataModifiedRequestStyles);

    commandSet.actConfirmed = function(action) {
        if (this.table.isModified) {
            modalPopup.show(definitionSet.eventHandler.dataModifiedRequest, [
                { text: definitionSet.eventHandler.dataModifiedRequestButtonConfirm, action: action },
                { escape: true, text: definitionSet.eventHandler.dataModifiedRequestButtonCancel }
            ], styles);
        } else
            action();
    }; //commandSet.actConfirmed

    const showException = exception => {
        document.title = definitionSet.titleFormat();
        commandSet.errorElement.textContent = exception.toString();
        commandSet.errorElement.style.display = definitionSet.display.errorElementShow;
    }; //showException

    const showTitle = data => {
        const title = data ? (data.summary ? data.summary.title : null) : null;
        document.title = definitionSet.titleFormat(title);
    }; //showTitle

    commandSet.set("new", new Command("New",
        () => true,
        () => commandSet.actConfirmed(() => commandSet.table.reset() ),
    ));

    commandSet.set("open", new Command("Open...",
        () => true,
        () => commandSet.actConfirmed(() => {
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
        })
    ));

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

    commandSet.set("save", new Command("Save",
        () => commandSet.table.canStore,
        () => implementSave(false),
    ));

    commandSet.set("save as", new Command("Save As...",
        () => commandSet.table.canStore,
        () => implementSave(true),
    ));

    commandSet.set("insert row", new Command("Insert Row",
        () => commandSet.table.canInsertRow,
        () => commandSet.table.insertRow()
    ));
    commandSet.set("remove row", new Command("Remove Row",
        () => commandSet.table.canRemoveRow,
        () => commandSet.table.removeRow()
    ));

    commandSet.set("add property", new Command("Add Property",
        () => commandSet.table.canAddProperty,
        () => commandSet.table.addProperty()
    ));
    commandSet.set("insert property", new Command("Insert Property",
        () => commandSet.table.canInsertProperty,
        () => commandSet.table.insertProperty()
    ));
    commandSet.set("remove property", new Command("Remove Property",
        () => commandSet.table.canRemoveProperty,
        () => commandSet.table.removeProperty()
    ));

    commandSet.set("copy", new Command("Ctrl+C, Ctrl+Insert : Copy",
        () => commandSet.table.canCopyToClipboard,
        () => {
            try {
                commandSet.table.toClipboard();
            } catch (ex) { showException(ex); }
        }
    ));    

    commandSet.set("paste", new Command("Ctrl+V, Shift+Insert: Paste",
        () => commandSet.table.canPasteFromClipboard,
        () => {
            try {
                commandSet.table.fromClipboard();
            } catch (ex) { showException(ex); }
        }
    ));    

    commandSet.set("find", new Command("Find...", () => true, () => {
        console.log("find..."); //SA???
    }));

    commandSet.set("edit selected/commit", new Command(null,
        control => {
            if (control)
                control.textContent = !commandSet.table.editingMode
                ? "F2: Edit Selected Cell"
                : "Ctrl+Enter: Commit";
            return commandSet.table.canEditSelectedCell;
        },
        () => {
            if (commandSet.table.editingMode)
                setTimeout( () => { commandSet.table.commitEdit(); });
            else
                setTimeout( () => { commandSet.table.editSelectedCell(); });
        }
    ));
    
    commandSet.set("edit column name/cancel", new Command(null,
        control => {
            if (control)
                control.textContent = !commandSet.table.editingMode
                ? "Edit Property Name"
                : "Escape: Cancel";
            return commandSet.table.canEditProperty;
        },
        () => {
            if (commandSet.table.editingMode)
                setTimeout( () => { commandSet.table.cancelEdit(); });
            else
                setTimeout( () => { commandSet.table.editProperty(); });
        }
    ));

    commandSet.set("shuffle row up", new Command(null,
        () => commandSet.table.canShuffleRow(true),
        () => commandSet.table.shuffleRow(true)
    ));    
    commandSet.set("shuffle row down", new Command(null,
        () => commandSet.table.canShuffleRow(false),
        () => commandSet.table.shuffleRow(false)
    ));    
    commandSet.set("shuffle column left", new Command(null,
        () => commandSet.table.canShuffleColumn(true),
        () => commandSet.table.shuffleColumn(true)
    ));    
    commandSet.set("shuffle column right", new Command(null,
        () => commandSet.table.canShuffleColumn(false),
        () => commandSet.table.shuffleColumn(false)
    ));    

    return commandSet;

};
