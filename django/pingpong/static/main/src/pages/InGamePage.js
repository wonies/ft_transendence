import Component from "../core/Component.js";

export default class InGame extends Component {
  constructor(props) {
    console.log("In game Constructor");

    super(props);

    // console.log(this.$target);
  }

  setup() {
    this.$state = {
      image: "/static/main/public/pongs.png",
      opt: "토 너 먼 트",
      opt2: "AI 대전",
    };
  }

  template() {
    const { image } = this.$state;
    const language = sessionStorage.getItem("language");
    console.log("lan:", language);
    return `
      <div class="ingame-container">
        <div class="account-image">
          <img src="${image}" alt="pong">
        </div>
        <div class="pick-option">
          <div class="option" data-option="opt1">
            <span>${this.getOptionText("tournament", language)}</span>
          </div>
          <div class="option" data-option="opt2">
            <span>${this.getOptionText("ai", language)}</span>
          </div>
        </div>
      </div>
    `;
  }

  getOptionText(option, lang) {
    const texts = {
      tournament: {
        en: "Tournament",
        ko: "토너먼트",
        ja: "トーナメント",
      },
      ai: {
        en: "AI Battle",
        ko: "AI 대전",
        ja: "AI対戦",
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
    const { $target } = this;

    this.clickHandler = ({ target }) => {
      const option = target.closest(".option");
      if (target.closest(".account-image img")) {
        this.goToHome();
        this.removeEvent();
      }
      if (option) {
        const optType = option.dataset.option;
        if (optType === "opt1") {
          this.handleTournament();
          this.removeEvent();
        } else if (optType === "opt2") {
          this.handleAi();
          this.removeEvent();
        }
      }
    };
    $target.addEventListener("click", this.clickHandler);
  }

  handleTournament() {
    console.log("Tour!");
    window.location.hash = "#tournament";
  }

  handleAi() {
    console.log("ai");
    window.location.hash = "#ai-battle";
  }

  goToHome() {
    window.location.hash = "";
  }

  destroy() {
    this.removeEvent();
    super.destroy();
  }
}
