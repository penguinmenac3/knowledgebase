export function md_to_html(md: string) {
    let html = ""
    let lines = md.split("\n")
    let lastLine = ""
    let lastIndents = [0]
    let logicalIndent = 0
    let state = []
    for (let line of lines) {
        let origLine = line
        let indent = line.length - line.trim().length
        if (line.trim() == "") {
            if (lastLine != "<BR>" && !lastLine.startsWith("<h")) {
                line = "<BR>"
            }
        } else {
            while (indent < lastIndents[logicalIndent]) {
                logicalIndent -= 1
                lastIndents.pop()
                html += state.pop()
            }
        }
        if (lastLine.startsWith(">") && !line.startsWith(">")) {
            logicalIndent -= 1
            lastIndents.pop()
            html += state.pop()
        }
        if (line.startsWith("##")) {
            line = "<h2>" + line.slice(2).trim() + "</h2>"
        } else if (line.startsWith("#")) {
            line = "<h1>" + line.slice(2).trim() + "</h1>"
        } else if (line.startsWith(">")) {
            let prefix = ""
            if (!lastLine.startsWith(">")) {
                logicalIndent += 1
                lastIndents.push(indent)
                prefix = "<div class='markdownNoteElement'>"
                state.push("</div>")
            }
            line = prefix + line.slice(1).trim()
        } else if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
            let prefix = ""
            if (indent > lastIndents[logicalIndent]) {
                logicalIndent += 1
                lastIndents.push(indent)
                prefix = "<ul>"
                state.push("</ul>")
            }
            line = prefix + "<li>" + line.trim().slice(2).trim() + "</li>"
        }
        lastLine = origLine
        lastIndents[logicalIndent] = indent
        html += " " + parseLine(line)
    }
    return html
}

function parseLine(line: string): string {
    let out = ""
    let isBoldOrItalic = false
    let isBold = false
    let isItalic = false
    let stars = 0
    let under = 0
    let isLink = 0
    let isImage = false
    let linkStart = 0
    let linkText = ""
    let linkURL = ""
    for (let char of line) {
        if (isLink == 0 && char == "!") {
            isImage = true
            linkStart = out.length
        } else if (char == "[") {
            isLink = 1
            linkText = ""
            linkURL = ""
            if (!isImage) {
                linkStart = out.length
            }
        } else if (isLink == 0 && isImage) {
            isImage = false
        } else if (isLink == 1 && char == "]") {
            isLink = 2
        } else if (isLink == 1) {
            linkText += char
        } else if (isLink == 2 && char == "(") {
            isLink = 3
        } else if (isLink == 2) {
            isLink = 0
        } else if (isLink == 3 && char == ")") {
            out = out.slice(0, linkStart)
            if (!isImage) {
                out += "<a href='" + linkURL + "'>" + linkText + "</a>"
            } else {
                out += "<image src='" + linkURL + "' alt='" + linkText + "' />"
            }
            isLink = 0
            isImage = false
            continue
        } else if (isLink == 3) {
            linkURL += char
        }
        if (char == "*" || char == "_") {
            if (!isBoldOrItalic) {
                if (char == "*")
                    stars += 1
                if (char == "_")
                    under += 1
            } else {
                if (char == "*" && stars > 0)
                    stars -= 1
                if (char == "_" && under > 0)
                    under -= 1
                if (stars == 0 && isBold) {
                    out += "</b>"
                    isBold = false
                    isBoldOrItalic = false
                } else if ((stars == 0 && under == 0) && isItalic) {
                    out += "</i>"
                    isItalic = false
                    isBoldOrItalic = false
                }
            }
        } else if (!isBoldOrItalic && char == " " && stars > 0) {
            for (let i = 0; i < stars; i++) {
                out += "*"
            }
            stars = 0
            out += char
        } else if (!isBoldOrItalic && char == " " && under > 0) {
            for (let i = 0; i < stars; i++) {
                out += "_"
            }
            under = 0
            out += char
        } else if (!isBoldOrItalic && char != "*" && (under > 0 || stars > 0)) {
            isBoldOrItalic = true
            if (stars >= 2) {
                out += "<b>"
                isBold = true
            } else {
                out += "<i>"
                isItalic = true
            }
            out += char
        } else {
            out += char
        }
    }
    return out
}