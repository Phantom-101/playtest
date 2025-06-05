export default class TextController {
    constructor(document) {
        this.textDiv = document.getElementById('message-box');
        this.uniques = [];
    }

    showText(text) {
        const textElement = document.createElement('p');
        textElement.textContent = text;
        textElement.style.margin = '4px 0';
        this.textDiv.appendChild(textElement);
    }

    showUnique(key, text) {
        if(!this.uniques.includes(key)) {
            this.uniques.push(key);
            this.showText(text);
        }
    }
}