import Component from "../core/Component.js";
import TourStandBy from "./TourStandBy.js";

export default class TourStandByFour extends TourStandBy {
  setup() {
    super.setup();
    this.$state = {
      image: "/static/main/public/doublepong.png",
      optCount: 4,
      optArray: Array(4).fill(""),
    };
  }

  template() {
    const { image, optCount, optArray } = this.$state;
    const language = sessionStorage.getItem("language");

    const inputs = Array(optCount)
      .fill(0)
      .map(
        (_, index) => `
            <input type="text" class="match-opt" data-option="opt${
              index + 1
            }" value="${
          optArray[index]
        }" placeholder="${this.getPlaceholderText(language, index + 1)}">
        `
      )
      .join("");

    return `
        <div class="ingame-container">
            <div class="account-image">
                <img src="${image}" alt="pong">
            </div>
                <div class="pick-option">
                    ${inputs}
                    <button class="match-btn">${this.getButtonText(
                      language
                    )}</button>
                </div>
        </div>
      `;
  }

  getPlaceholderText(lang, playerNumber) {
    const texts = {
      en: `Enter Player ${playerNumber} name`,
      ko: `플레이어 ${playerNumber} 이름 입력`,
      ja: `プレイヤー${playerNumber}の名前を入力`,
    };
    return texts[lang] || texts.en;
  }

  getButtonText(lang) {
    const texts = {
      en: "MATCH",
      ko: "시이작",
      ja: "マッチ",
    };
    return texts[lang] || texts.en;
  }
  removeEvent() {
    if (this.$target && this.clickHandler) {
      this.$target.removeEventListener("click", this.clickHandler);
      this.clickHandler = null;
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
      if (target.closest(".account-image img")) {
        this.goToHome();
        this.removeEvent();
      }
      if (target.matches(".match-btn")) {
        this.handleMatchButtonClick();
        this.goMatchRoom();
        this.removeEvent();
      }
    }.bind(this);

    if (this.$target) {
      this.$target.addEventListener("click", this.clickHandler);
    }
  }

  handleMatchButtonClick() {
    console.log("Match button clicked");

    const optValues = {};
    let anonymousCount = 1;

    for (let i = 1; i <= 4; i++) {
      let value = this.$target
        .querySelector(`.match-opt[data-option="opt${i}"]`)
        .value.trim();

      if (value === "" || value == null) {
        value = `anonymous${anonymousCount}`;
        anonymousCount++;
      }

      optValues[`opt${i}`] = value;
      console.log(`Option ${i}:`, value);
    }
    sessionStorage.setItem("players", JSON.stringify(optValues));
    console.log("Values saved to sessionStorage");
  }

  goToHome() {
    window.location.hash = "#ingame-1";
  }

  goMatchRoom() {
    window.location.hash = "#waiting-room";
  }

  destroy() {
    this.removeEvent();
    super.destroy();
  }
}
