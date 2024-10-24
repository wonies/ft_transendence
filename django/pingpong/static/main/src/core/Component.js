export default class Component {
  $target;
  $props;
  $state;

  constructor($target, $props) {
    console.log('Constructor');
    this.$target = $target;
    this.$props = $props;
    this.$state = {
      language: sessionStorage.getItem('language') || 'en',
    };

    this.setup();
    this.render();
    this.setEvent();
  }

  setup() {}
  mounted() {}
  unmounted() {
    this.cleanup();
  }

  template() {
    return '';
  }

  render() {
    this.$target.innerHTML = this.template();
    this.mounted();
  }

  setEvent() {}
  setState(newState) {
    this.$state = { ...this.$state, ...newState };
    this.render();
  }

  goToHome() {}

  addEvent(eventType, selector, callback) {
    this.$target.addEventListener(eventType, (event) => {
      if (!event.target.closest(selector)) return false;
      callback(event);
    });
  }

  cleanup() {
    if (this._eventListeners) {
      this._eventListeners.forEach(({ eventType, selector, callback }) => {
        this.$target.removeEventListener(eventType, callback);
      });
      this._eventListeners = [];
    }

    if (this.$target) {
      this.$target.innerHTML = '';
    }

    this.$state = {};
  }

  addEvent(eventType, selector, callback) {
    const wrappedCallback = (event) => {
      if (!event.target.closest(selector)) return false;
      callback(event);
    };
    this.$target.addEventListener(eventType, wrappedCallback);

    if (!this._eventListeners) {
      this._eventListeners = [];
    }
    this._eventListeners.push({
      eventType,
      selector,
      callback: wrappedCallback,
    });
  }
  setLanguage(lang) {
    sessionStorage.setItem('language', lang);
    this.setState({ language: lang });
  }
  getLanguage() {
    return this.$state.language;
  }
}
