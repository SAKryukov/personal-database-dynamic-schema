class Command {

    constructor(header, canExecuteHandler, executeHandler) { //header can be null
        this.header = header;
        this.canExecuteHandler = canExecuteHandler; 
        this.executeHandler = executeHandler; 
    } //constructor

    get canExecute() {
        if (this.canExecuteHandler == null) return false;
        if (this.executeHandler == null) return false;
        return this.canExecuteHandler();
    } //canExecute

    execute() {
        if (this.executeHandler == null) return;
        if (this.canExecuteHandler != null && !this.canExecuteHandler()) return;
        this.executeHandler();
    } //execute

} //class Command
