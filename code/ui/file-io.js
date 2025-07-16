/*
File I/O
Copyright (c) 2017, 2025 by Sergey A Kryukov
http://www.SAKryukov.org
*/

"use strict";

const createFileIO = showException => {

    const definitionSet = {
        defaultLocation: "downloads",
        nonHandledExceptionName: "AbortError",
    }; //definitionSet

    const experimentalImplementation = window.showOpenFilePicker && window.showSaveFilePicker;

    let fileHandleSave = undefined;
    let fileHandleOpen = undefined;
    let previouslyOpenedFilename = null; // fallback

    const exceptionHandler = exception => {
        if (showException != null && exception.name != definitionSet.nonHandledExceptionName)
            showException(exception);
    }; //exceptionHandler

    const saveFileWithHandle = (handle, content) => {
        if (!handle) return;
        handle.createWritable().then(stream => {
            stream.write(content).then(() => {
                stream.close();
            }).catch(writeException => {
                exceptionHandler(writeException);
            });
        }).catch(createWritableException => {
            exceptionHandler(createWritableException);
        });
    }; //saveFileWithHandle

    const loadTextFile = (fileHandler, options) => { // fileHandler(fileName, text)
        options.startIn = fileHandleSave ?? fileHandleOpen ?? definitionSet.defaultLocation;
        if (!fileHandler) return;
        window.showOpenFilePicker(options).then(handles => {
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

    const storeTextFile = (_, content, options) => {
        options.startIn = fileHandleSave ?? fileHandleOpen ?? definitionSet.defaultLocation;
        window.showSaveFilePicker(options).then(handle => {
            if (!handle) return;
            fileHandleSave = handle;
            saveFileWithHandle(handle, content);
        }).catch(saveFilePickerException => {
            exceptionHandler(saveFilePickerException);
        });
    }; //storeTextFile

    const saveExisting = (_, content, options) => {
        if (fileHandleSave != null)
            saveFileWithHandle(fileHandleSave, content);
        else
            storeTextFile(null, content, options);
    }; //saveExisting

    const storeTextFileFallback = (fileName, content, _) => {
        const link = document.createElement('a');
        link.href = `data:application/javascript;charset=utf-8,${encodeURIComponent(content)}`; //sic!
        link.download = this.previouslyOpenedFilename == null
            ? fileName
            : this.previouslyOpenedFilename;
        link.click();
    }; //storeTextFileFallback

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

    const saveExistingFallback = (fileName, content) => {
        storeTextFileFallback(previouslyOpenedFilename ?? fileName, content);
    }; //saveExistingFallback

    return {
        isFallback: !experimentalImplementation,
        saveExisting: experimentalImplementation ? saveExisting : saveExistingFallback,
        storeTextFile: experimentalImplementation ? storeTextFile : storeTextFileFallback,
        loadTextFile: experimentalImplementation ? loadTextFile : loadTextFileFallback,
    };

}; //createFileIO
