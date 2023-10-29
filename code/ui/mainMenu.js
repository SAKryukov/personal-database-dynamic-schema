class MainMenu {

    #windowKeyHandler = null;

    constructor(element, commandSet, topElementSelector, menuElementSelector, popupMenuItemSelector) {

        const itemToMenuMap = new Map();
        const acceleratorKeyToMenuMap = new Map();
        const menuToItemMap = new Map();
        const topItemSet = element.querySelectorAll(definitionSet.CSS.scopeSelector(topElementSelector));
        const contextMenus = [];

        const showContextMenu = menu => {
            const item = menuToItemMap.get(menu);
            for (let anItem of topItemSet) anItem.classList.remove(definitionSet.CSS.selection);
            item.classList.add(definitionSet.CSS.selection);
            const itemBound = item.getBoundingClientRect();
            const elementBounds = element.getBoundingClientRect();
            menu.show(itemBound.left, elementBounds.top + elementBounds.height - 1);
        }; //showContextMenu

        for (let topLevelItem of topItemSet) {
            const menuElement = topLevelItem.parentElement.querySelector(definitionSet.CSS.scopeSelector(menuElementSelector));
            const contextMenu = new ContextMenu(menuElement, commandSet, popupMenuItemSelector);
            contextMenus.push(contextMenu);
            contextMenu.horizontalHandler = (menu, isLeft) => {
                const theOtherMenu = isLeft ? menu.previous : menu.next;
                if (!theOtherMenu) return;
                showContextMenu(theOtherMenu);
            }; //popup.horizontalHandler
            contextMenu.hideHandler = menu => {
                const item = menuToItemMap.get(menu);
                item.classList.remove(definitionSet.CSS.selection);
            }; //contextMenu.hideHandler
            itemToMenuMap.set(topLevelItem, contextMenu);
            menuToItemMap.set(contextMenu, topLevelItem);
            if (topLevelItem.accessKey && !acceleratorKeyToMenuMap.has(topLevelItem.accessKey))
                acceleratorKeyToMenuMap.set(topLevelItem.accessKey.toLowerCase(), contextMenu);
            topLevelItem.onpointerdown = event => {
                const popup = itemToMenuMap.get(event.target);
                showContextMenu(popup);
                event.preventDefault();
            } //topLevelItem.onclick
        } //loop

        let index = 0;
        for (let menu of contextMenus) {
            menu.next = index >= contextMenus.length - 1
            ? contextMenus[0]
            : contextMenus[index + 1];
            menu.previous = index > 0
            ? contextMenus[index - 1]
            : contextMenus[contextMenus.length - 1];
            ++index;
        } //loop

        this.#windowKeyHandler = event => {
            if (!event.altKey) return false;
            const menu = acceleratorKeyToMenuMap.get(event.key.toLowerCase());
            if (menu)
                showContextMenu(menu);
            return !!menu;
        }; //

    } //constructor

    windowKeyHandler(event) { return this.#windowKeyHandler(event); }

} //class MainMenu

