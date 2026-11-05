class HtmlTemplateCard extends HTMLElement {
    static get properties() {
        return {
            _config: {},
            _hass: {},
        };
    }

    set hass(hass) {
        this._hass = hass;
        this._subscribe();
    }

    setConfig(config) {
        if (!config.content) {
            throw new Error("You need to define 'content' in your configuration.")
        }
        this._unsubscribe();
        this._config = config;
        if (!this._config.picture_elements_mode) {
            let haCard = document.createElement("ha-card");
            haCard.style.padding = "16px";
            this._rootElement = haCard;
        } else {
            this._rootElement = document.createElement("div");
        }
        this._subscribe();
    }

    connectedCallback() {
        this._subscribe();
    }

    disconnectedCallback() {
        this._unsubscribe();
    }

    // One render_template subscription per card: Home Assistant re-renders it whenever
    // the entities the template reads change, so hass updates need no handling here.
    _subscribe() {
        if (this._subscription || this._rendered || !this._config || !this._hass || !this.isConnected) {
            return;
        }
        let content = this._config.content;
        if (!this._config.ignore_line_breaks) {
            content = content.replace(/\r?\n|\r/g, "</br>");
        }
        if (this._config.do_not_parse) {
            this._rendered = true;
            this.render(content);
        } else {
            this._subscription = this._hass.connection.subscribeMessage(
                (msg) => this.render(msg.result),
                {type: "render_template", template: content}
            );
        }
        if (!(this._rootElement in this.children)) {
            this.appendChild(this._rootElement);
        }
    }

    _unsubscribe() {
        this._rendered = false;
        if (this._subscription) {
            const subscription = this._subscription;
            this._subscription = undefined;
            subscription.then((unsubscribe) => unsubscribe()).catch(() => {});
        }
    }

    render(content) {
        let header = ``;
        if (this._config.title) {
            header = `<div class="card-header" style="padding: 8px 0 16px 0;"><div class="name">${this._config.title}</div></div>`;
        }
        this._rootElement.innerHTML = this._config.picture_elements_mode
            ? content
            : `${header}<div>${content}</div>`;
    }

    getCardSize() {
        return 1;
    }
}

customElements.define('html-template-card', HtmlTemplateCard);
