"use strict";

window.onload = () => {

    const properties = [];
    const valueMap = new Map();
    const records = [];
    const values = [];

    // exported file to be converted additionally needs text area for output and ol of property names:
    // <body>
    // <textarea></textarea>
    //  <ol><li>Property</li><li>Property</li> ... list of properties </ol>

    const propertyList = document.querySelectorAll("body > ol > li");
    const propertyMap = new Map;
    for (let index = 0; index < propertyList.length; ++index) {
        const property =  propertyList[index].textContent;
        propertyMap.set(property, index);
        properties.push(property);
    } //loop

    let valueIndex = 0;
    const recordSet = document.querySelectorAll(".record");
    for (let record of recordSet) {
        const rows = record.rows;
        const recordItem = [];
        for (let row of rows) {
            const cells = row.cells;
            const cellProperty = cells[0].textContent;
            const propertyIndex = propertyMap.get(cellProperty);
            const cellValue = cells[1].innerHTML.replaceAll("&nbsp;", " ");
            let existingValueIndex = valueMap.get(cellValue);
            if (existingValueIndex == null) {
                existingValueIndex = valueIndex;
                valueMap.set(cellValue, valueIndex++);
                values.push(cellValue);
            } //if
            recordItem.push({ property: propertyIndex, value: existingValueIndex });
            console.log("inside");
        } //loop rows
        records.push(recordItem);
    } //loop tables
    
    const result = JSON.stringify({ properties: properties, values: values, records: records }, null, "\t");
    const resultView = document.querySelector("textarea");
    resultView.value = result;

}; //window.onload

