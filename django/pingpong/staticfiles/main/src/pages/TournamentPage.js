import InGamePage from "./InGamePage.js";

export default class TournamentPage extends InGamePage {
  setup() {
    super.setup();
    this.$state = {
      ...this.$state,
      image: "/static/main/public/doublepong.png",
      opt: "2명",
      opt2: "4명",
      opt3: "8명",
    };
  }

  template() {
    const { image } = this.$state;
    const language = sessionStorage.getItem("language");
    return `
        <div class="ingame-container">
            <div class="account-image">
                <img src="${image}" alt="tournament">
            </div>
            <div class="pick-option">
                <div class="option" data-option="select1">
                    <span>${this.getOptionText("two", language)}</span>
                </div>
                <div class="option" data-option="select2">
                    <span>${this.getOptionText("four", language)}</span>
                </div>
                <div class="option" data-option="select3">
                    <span>${this.getOptionText("eight", language)}</span>
                </div>
            </div>
        </div>
        `;
  }

  getOptionText(option, lang) {
    const texts = {
      two: {
        en: "2 Players",
        ko: "2명",
        ja: "2人",
      },
      four: {
        en: "4 Players",
        ko: "4명",
        ja: "4人",
      },
      eight: {
        en: "8 Players",
        ko: "8명",
        ja: "8人",
      },
    };
    return texts[option][lang] || texts[option].en;
  }

  removeEvent() {
    if (this.$target && this.clickHandler) {
      this.$target.removeEventListener("click", this.clickHandler);
      this.clickHandler = null;
    }
  }

  setEvent() {
    this.removeEvent();

    this.clickHandler = function ({ target }) {
      const option = target.closest(".option");
      if (target.closest(".account-image img")) {
        this.goToHome();
      }
      if (option) {
        const optType = option.dataset.option;
        if (optType === "select1") {
          console.log(`selected option: ${this.$state.opt}`);
          this.handleTwoBattle();
          this.removeEvent();
        } else if (optType === "select2") {
          console.log(`selected option: ${this.$state.opt2}`);
          this.handleFourBattle();
          this.removeEvent();
        } else if (optType === "select3") {
          console.log(`selected option: ${this.$state.opt3}`);
          this.handleEightBattle();
          this.removeEvent();
        }
      }
    }.bind(this);

    if (this.$target) {
      this.$target.addEventListener("click", this.clickHandler);
    }
  }

  goToHome() {
    window.location.hash = "ingame-1";
  }

  handleTwoBattle() {
    window.location.hash = "#standby-2";
  }

  handleFourBattle() {
    window.location.hash = "#standby-4";
  }

  handleEightBattle() {
    window.location.hash = "#standby-8";
  }

  destroy() {
    this.removeEvent();
    super.destroy();
  }
}
