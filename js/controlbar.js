
export class ControlBar {
    constructor() {
        let initialcontrol = $(".control")[1] // Skip delete at 0
        $(initialcontrol).addClass("selected")
    }

    get isDeleting() {
        return false; // TODO
    }

    get currentColour() {

    }
}