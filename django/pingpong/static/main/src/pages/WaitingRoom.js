import InGamePage from "./InGamePage.js";

export default class WaitingRoom extends InGamePage {
  setup() {
    super.setup();

    const players = JSON.parse(sessionStorage.getItem("players") || "{}");

    const playerNames = Object.entries(players)
      .filter(([key]) => key.startsWith("opt"))
      .map(([_, value]) => value || "Anonymous")
      .filter((name) => name.trim() !== "");

    this.$state = {
      ...this.$state,
      image: "/static/main/public/winner.png",
      playerNames: playerNames || [],
    };
  }

  template() {
    const { image, playerNames } = this.$state;
    const language = sessionStorage.getItem("language");

    const playerList = playerNames
      .map(
        (name, index) => `
            <div>${this.getPlayerText(language, index + 1)}: ${name}</div>
        `
      )
      .join("");

    return `
        <div class="ingame-container">
            <div class="account-image">
                <img src="${image}" alt="pong">
            </div>
            <div class="pick-option">
                <h1>${this.getChallengeText(language)}</h1>
                <div>${this.getReadyText(language)}</div>
                ${playerList}
                ${this.getGameStartButton(language)}
            </div>
        </div>
        `;
  }

  getGameStartButton(language) {
    const playerCount = this.$state.playerNames.length;
    if (playerCount < 2) {
      return `<div>${this.getWaitingText(language)}</div>`;
    } else if (playerCount === 2) {
      return `<button class="start-game">${this.getStartGameText(
        language,
        "1v1"
      )}</button>`;
    } else {
      return `<button class="start-tournament">${this.getStartGameText(
        language,
        "tournament"
      )}</button>`;
    }
  }

  getChallengeText(lang) {
    const texts = {
      en: "New Challenge!",
      ko: "새로운 도전!",
      ja: "新しいチャレンジ！",
    };
    return texts[lang] || texts.en;
  }

  getReadyText(lang) {
    const texts = {
      en: "Are you ready?",
      ko: "준비되셨나요?",
      ja: "準備はできましたか？",
    };
    return texts[lang] || texts.en;
  }

  getPlayerText(lang, number) {
    const texts = {
      en: `Player ${number}`,
      ko: `플레이어 ${number}`,
      ja: `プレイヤー${number}`,
    };
    return texts[lang] || texts.en;
  }

  getWaitingText(lang) {
    const texts = {
      en: "Waiting for more players...",
      ko: "더 많은 플레이어를 기다리는 중...",
      ja: "プレイヤーを待っています...",
    };
    return texts[lang] || texts.en;
  }

  getStartGameText(lang, mode) {
    const texts = {
      en: {
        "1v1": "Start 1v1 Game",
        tournament: "Start Tournament",
      },
      ko: {
        "1v1": "1대1 게임 시작",
        tournament: "토너먼트 시작",
      },
      ja: {
        "1v1": "1対1ゲーム開始",
        tournament: "トーナメント開始",
      },
    };
    return texts[lang]?.[mode] || texts.en[mode];
  }

  getAnonymousText() {
    const lang = this.getLanguage();
    const texts = {
      en: "Anonymous",
      ko: "익명",
      ja: "匿名",
    };
    return texts[lang] || texts.en;
  }

  handleGameStart() {
    if (this.$state.playerNames != null) {
      const playerCount = this.$state.playerNames.length;
      if (playerCount === 2) {
        console.log("1v1 게임 시작!");
        window.location.hash = "#tour-game";
      } else {
        console.log("토너먼트 시작!");
        window.location.hash = "#tour-game";
      }
    }
  }

  goToHome() {
    window.location.hash = "ingame-1";
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
      if (
        target.matches(".start-game") ||
        target.matches(".start-tournament")
      ) {
        this.handleGameStart();
        this.removeEvent();
      } else if (target.closest(".go-home")) {
        this.goToHome();
        this.removeEvent();
      }
    }.bind(this);

    if (this.$target) {
      this.$target.addEventListener("click", this.clickHandler);
    }
  }

  destroy() {
    this.removeEvent();
    super.destroy();
  }
}
