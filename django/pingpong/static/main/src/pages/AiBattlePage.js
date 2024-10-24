import InGamePage from "./InGamePage.js";

export default class AiBattlePage extends InGamePage {
  constructor(props) {
    console.log("Ai Battle Constructor");
    super(props);
    this.typingInterval = null;
    this.gamePage = null;
    // console.log(this.$target);
  }

  setup() {
    super.setup();

    this.$state = {
      ...this.$state,
      image: "/static/main/public/aiphoto.png",
      // opt: '나랑 진짜 게임할거야? 쉽지않을걸..',
    };
    setTimeout(() => this.startTypingEffect(), 0);
  }

  template() {
    const { image } = this.$state;
    const language = sessionStorage.getItem("language");

    return `
        <div class="ingame-container">
        <div class="account-image">
            <img src="${image}" alt="pong">
        </div>
        <div class="pick-option">
            <div class="option" data-option="hon">
            <span id="typing-text"></span>
             <button id="hon" class="hon" style="display: none;">${this.getButtonText(
               language
             )}</button>
            </div>
        </div>
        </div>
      `;
  }

  getTypingText(lang) {
    const texts = {
      en: "Are you really going to play with me? It won't be easy...",
      ko: "나랑 진짜 게임할거야? 쉽지않을걸..",
      ja: "本当に私とゲームするの？簡単じゃないよ...",
    };
    return texts[lang] || texts.en;
  }

  getButtonText(lang) {
    const texts = {
      en: "Let's teach a lesson",
      ko: "혼내주러가기",
      ja: "お仕置きしに行く",
    };
    return texts[lang] || texts.en;
  }

  startTypingEffect() {
    const textElement = document.getElementById("typing-text");
    const button = document.getElementById("hon");
    if (!textElement || !button) return;

    const language = sessionStorage.getItem("language");
    const text = this.getTypingText(language);
    let index = 0;

    textElement.textContent = "";

    this.typingInterval = setInterval(() => {
      if (index < text.length) {
        textElement.textContent += text.charAt(index);
        index++;
      } else {
        clearInterval(this.typingInterval);
        this.showButton();
      }
    }, 100);
  }

  showButton() {
    const button = document.getElementById("hon");
    if (button) {
      button.style.display = "inline-block";
    }
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
      if (target.classList.contains("hon")) {
        this.routeToGame();
        this.removeEvent();
      } else if (target.closest(".account-image img")) {
        this.goToHome();
        this.removeEvent();
      }
    }.bind(this);

    if (this.$target) {
      this.$target.addEventListener("click", this.clickHandler);
    }
  }

  destroy() {
    if (this.typingInterval) {
      clearInterval(this.typingInterval);
    }
    if (this.gamePage) {
      this.gamePage.destroy();
    }
    super.destroy();
  }

  goToHome() {
    window.location.hash = "ingame-1";
  }

  routeToGame() {
    console.log("Routing to game page");
    window.location.hash = "#ai-game";
  }
}
