export default class TextController {
    constructor(document) {
        this.textDiv = document.getElementById('message-box');
        this.uniques = [];
    }

    showText(text, duration = 10000) {
        const textElement = document.createElement('p');
        textElement.textContent = text;
        textElement.style.margin = '4px 0';
        this.textDiv.appendChild(textElement);

        setTimeout(() => {
            if (this.textDiv.contains(textElement)) {
                this.textDiv.removeChild(textElement);
            }
        }, duration);
    }

    showUnique(key, text) {
        if(!this.uniques.includes(key)) {
            this.uniques.push(key);
            this.showText(text);
        }
    }
}