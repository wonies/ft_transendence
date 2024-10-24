import AiGame from './AiGame.js';
import Component from '../core/Component.js';

export default class AiPage extends Component {
  template() {
    return `
      <div class="app-container">
        <div data-component="background-container">
        </div>
        <div data-component="add-page-container"></div>
      </div>
    `;
  }

  mounted() {
    const $back = this.$target.querySelector(
      '[data-component="background-container"]'
    );
    this.aiGame = new AiGame($back);
  }

  unmount() {
    if (this.aiGame && typeof this.aiGame.cleanup === 'function') {
      console.log('Cleaning up AiGame');
      this.aiGame.cleanup();
    }
    super.unmounted();
  }
}
