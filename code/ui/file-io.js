/*
Personal Database

Copyright (c) 2017, 2023 by Sergey A Kryukov
http://www.SAKryukov.org
http://www.codeproject.com/Members/SAKryukov
*/

"use strict";

const createFileIO = showException => {

    const experimentalImplementation = window.showOpenFilePicker && window.showSaveFilePicker;
    const storedEvent = new CustomEvent(definitionSet.eventHandler.storedEvent);
    const notifyStored = () => window.dispatchEvent(storedEvent);

    let previouslyOpenedFilename = null;
    let fileHandleSave = undefined;
    let fileHandleOpen = undefined;
    const canSave = () => experimentalImplementation ? fileHandleSave != null : previouslyOpenedFilename != null;

    const exceptionHandler = exception => {
        if (showException != null &&
            //SA??? cannot see the other way to detect "The user aborted a request",
            // in contrast to "real" I/O error:
            !exception.message.toLowerCase().includes("user")) 
            showException(exception);
    }; //exceptionHandler

    const storeFileFallback = (fileName, content) => {
        const link = document.createElement('a');
        link.href = `data:application/javascript;charset=utf-8,${encodeURIComponent(content)}`; //sic!
        link.download = this.previouslyOpenedFilename == null
            ? fileName
            : this.previouslyOpenedFilename;
        link.click();
        notifyStored(); //can be false-positive, because it is not known if download was successful or not
    }; //storeFileFallback

    const saveExistingFallback = (fileName, content) => {
        storeFileFallback(previouslyOpenedFilename ?? fileName, content);
    }; //saveExistingFallback

    const loadTextFileFallback = (fileHandler, fileType) => { // fileHandler(fileName, text)
        if (!fileHandler) return;
        const input = document.createElement("input");
        input.type = "file";
        let acceptFileTypes = null;
        for (let index in fileType.accept) {
            acceptFileTypes = fileType.accept[index][0];
            break;
        } //loop
        input.accept = acceptFileTypes;
        input.value = null;
        if (fileHandler)
            input.onchange = event => {
                const file = event.target.files[0];
                previouslyOpenedFilename = file.name;
                if (!file) return;
                const reader = new FileReader();
                reader.readAsText(file);
                reader.onload = readEvent => fileHandler(file.name, readEvent.target.result);
            }; //input.onchange
        input.click();
    }; //loadTextFileFallback

    const createOptions = fileType => { return {
            types: [fileType],
            startIn: fileHandleSave ?? fileHandleOpen,
        };
    }; //createOptions
    const saveFileWithHandle = (handle, content) => {
        if (!handle) return;
        handle.createWritable().then(stream => {
            stream.write(content).then(() => {
                stream.close();
                notifyStored();
            }).catch(writeException => {
                exceptionHandler(writeException);
            });
        }).catch(createWritableException => {
            exceptionHandler(createWritableException);
        });
    }; //saveFileWithHandle

    const loadTextFile = (fileHandler, fileType) => { // fileHandler(fileName, text)
        if (!fileHandler) return;
        window.showOpenFilePicker(createOptions(fileType)).then(handles => {
            if (!handles) return;
            if (!handles.length) return;
            fileHandleOpen = handles[0];
            handles[0].getFile().then(file => {
                file.text().then(text => {
                    fileHandler(handles[0].name, text);
                }).catch(fileTextException => {
                    exceptionHandler(fileTextException);
                });
            }).catch(getFileException => {
                exceptionHandler(getFileException);
            });
        }).catch(openFilePicketException => {
            exceptionHandler(openFilePicketException);
        });
    }; //loadTextFile

    const storeFile = (_, content, fileType) => {
        window.showSaveFilePicker(createOptions(fileType)).then(handle => {
            if (!handle) return;
            fileHandleSave = handle;
            saveFileWithHandle(handle, content);
        }).catch(saveFilePickerException => {
            exceptionHandler(saveFilePickerException);
        });
    }; //storeFile

    const saveExisting = (_, content, fileType) => {
        if (fileHandleSave != null)
            saveFileWithHandle(fileHandleSave, content);
        else
            storeFile(null, content, fileType);
    }; //saveExisting

    return {
        canSave: canSave,
        saveExisting: experimentalImplementation ? saveExisting : saveExistingFallback,
        storeFile: experimentalImplementation ? storeFile : storeFileFallback,
        loadTextFile: experimentalImplementation ? loadTextFile : loadTextFileFallback,
    };

}; //createFileIO
