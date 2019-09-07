
// Transform the color input to numbers
function textToColour(text) {
    // According to online, a "color" input is invalid if it contains
    // Something other than a 7-char hex number (eg. #F0F0F0). Assume
    // it does lol
    let colour = vec3.create()
    colour[0] = parseInt(text.substring(1, 3), 16) / 255
    colour[1] = parseInt(text.substring(3, 5), 16) / 255
    colour[2] = parseInt(text.substring(5, 7), 16) / 255
    return colour
}

export class ControlBar {
    constructor() {
        let initialcontrol = $(".control")[1] // Skip delete at 0
        $(initialcontrol).addClass("selected")
        $("#controlbar .control").on("click touch", function (e) {
            $(".control").removeClass("selected")
            $(this).addClass("selected")
        })

        // Set up labelling for colours
        $("#controlbar .control").each(function (index, control) {
            if ($(control).is("#delete"))
                return

            let input = $(control).children(".custominput")
            let value = input.val()

            let label = $(control).children(".label")
            label.text(value)

            // Set up labelling in the future
            input.change(function (e) {
                label.text(input.val())
            })
        })
    }

    get isDeleting() {
        return $("#controlbar .control.selected").is("#delete")
    }

    get currentColour() {
        // Find selected colourpicker
        let current = $("#controlbar .control.selected")

        if (current.length == 0 || current.is("#delete"))
            return vec3.fromValues(0, 0, 0)

        // Get colour from picker
        let value = $("#controlbar .control.selected .custominput").val()

        // Parse value
        return textToColour(value)
    }
}