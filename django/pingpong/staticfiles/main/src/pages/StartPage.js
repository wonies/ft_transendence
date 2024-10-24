import Component from '../core/Component.js';
import * as Utils from '../Utils.js';
import { requestOAuth, setup2FA, verify2FA } from './Account.js';

export default class StartPage extends Component {
  constructor($target, props) {
    super($target);
    this.props = props;
  }

  setup() {
    this.state = {
      isLoggedIn: Utils.isAuthenticated(),
      is2FAEnabled: false,
      is2FAVerified: false,
      qrUrl: '',
      language: this.getLanguage()
    };
  }

  template() {
    const { isLoggedIn, is2FAEnabled, is2FAVerified, language } = this.state;
    return `
      <div class="start-page-wrapper">
        <div class="trans-box">
          <span class="badge ${language === 'en' ? 'text-bg-primary' : 'text-bg-secondary'}" data-lang="en">English</span>
          <span class="badge ${language === 'ko' ? 'text-bg-primary' : 'text-bg-secondary'}" data-lang="ko">한국어</span>
          <span class="badge ${language === 'ja' ? 'text-bg-primary' : 'text-bg-secondary'}" data-lang="ja">日本語</span>
        </div>
        <div class="start-page">
          <h1 class="welcome">${this.getWelcomeMessage(language)}</h1>
          <button type="button" class="btn btn-light game-start">${this.getStartButtonText(language)}</button>
          ${isLoggedIn && !is2FAEnabled ? `<button type="button" class="btn btn-primary setup-2fa">${this.getSetup2FAText(language)}</button>` : ''}
          ${isLoggedIn && is2FAEnabled && !is2FAVerified ? `<button type="button" class="btn btn-warning verify-2fa">${this.getVerify2FAText(language)}</button>` : ''}
          <div id="twofa-content"></div>
        </div>
      </div>
    `;
  }

  setEvent() {
    const { $target } = this;
    $target.addEventListener('click', ({ target }) => {
      if (target.classList.contains('game-start')) {
        this.handleGameStart();
      } else if (target.classList.contains('setup-2fa')) {
        this.props.onSetup2FA();
      } else if (target.classList.contains('verify-2fa')) {
        this.props.onVerify2FA();
      } else if (target.classList.contains('badge')) {
        const lang = target.dataset.lang;
        if (lang) {
          this.setLanguage(lang);
          sessionStorage.setItem('language', lang);
          this.setState({ language: lang });
        }
      }
    });
  }

  handleGameStart() {
    if (this.state.isLoggedIn) {
      if (this.state.is2FAVerified) {
        console.log('Game started!');
        this.routeToGame();
      } else {
        console.log('2FA verification required');
        alert(this.get2FARequiredMessage(this.state.language));
        this.props.onVerify2FA();
      }
    } else {
      console.log('Login required to start the game');
      requestOAuth();
    }
  }

  routeToGame() {
    window.location.hash = '#ingame-1';
  }

  showTwoFAVerification() {
    const twofaContent = this.$target.querySelector('#twofa-content');
    if (twofaContent) {
      twofaContent.innerHTML = `
        <h2>${this.get2FAVerificationTitle(this.state.language)}</h2>
        <p>${this.get2FAVerificationMessage(this.state.language)}</p>
        <input type="text" id="login-2fa-code" placeholder="${this.get2FACodePlaceholder(this.state.language)}" />
        <button id="verify-login-2fa-button">${this.getVerifyButtonText(this.state.language)}</button>
      `;
      document.getElementById('verify-login-2fa-button')?.addEventListener('click', () => this.handleLoginVerify2FA());
    }
  }

  updateTwoFAUI() {
    const twofaContent = this.$target.querySelector('#twofa-content');
    if (!twofaContent) return;

    if (this.state.isLoggedIn) {
      if (!this.state.is2FAEnabled && this.state.qrUrl) {
        console.log("2FA setup UI is being rendered");
        twofaContent.innerHTML = `
          <h2>${this.get2FASetupTitle(this.state.language)}</h2>
          <p>${this.get2FASetupMessage(this.state.language)}</p>
          <img id="qr-code" src="${this.state.qrUrl}" alt="2FA QR Code" />
          <input type="text" id="verification-code" placeholder="${this.get2FACodePlaceholder(this.state.language)}" />
          <button id="verify-2fa-button">${this.getVerifyAndEnableButtonText(this.state.language)}</button>
        `;
        document.getElementById('verify-2fa-button')?.addEventListener('click', () => this.handleVerify2FA());
      } else if (!this.state.is2FAVerified) {
        this.showTwoFAVerification();
      } else {
        twofaContent.innerHTML = `<p>${this.get2FAEnabledMessage(this.state.language)}</p>`;
      }
    } else {
      twofaContent.innerHTML = '';
    }
  }

  async handleVerify2FA() {
    const verificationCode = document.getElementById('verification-code')?.value;
    if (!verificationCode) {
      alert(this.getEnterVerificationCodeMessage(this.state.language));
      return;
    }
    const result = await verify2FA(verificationCode);
    if (result.success) {
      this.setState({ is2FAEnabled: true, is2FAVerified: true });
      Utils.set2FAToken(result.temp_token);
      alert(this.get2FASuccessMessage(this.state.language));
      this.updateTwoFAUI();
    } else {
      alert(result.message || this.get2FAFailureMessage(this.state.language));
    }
  }

  async handleLoginVerify2FA() {
    const code = document.getElementById('login-2fa-code')?.value;
    if (!code) {
      alert(this.getEnter2FACodeMessage(this.state.language));
      return;
    }
    const result = await verify2FA(code);
    if (result.success) {
      Utils.set2FAToken(result.temp_token);
      this.setState({ is2FAVerified: true });
      this.updateTwoFAUI();
    } else {
      alert(this.get2FAVerificationFailedMessage(this.state.language));
    }
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
    this.updateTwoFAUI();
  }

  getLanguage() {
    return sessionStorage.getItem('language') || 'en';
  }

  setLanguage(lang) {
    this.setState({ language: lang });
  }

  getWelcomeMessage(lang) {
    const messages = {
      en: 'Welcome to the Game',
      ko: '게임에 오신 것을 환영합니다',
      ja: 'ゲームへようこそ',
    };
    return messages[lang] || messages.en;
  }

  getStartButtonText(lang) {
    const texts = {
      en: 'GAME START',
      ko: '게임 시작',
      ja: 'ゲーム開始',
    };
    return texts[lang] || texts.en;
  }

  getSetup2FAText(lang) {
    const texts = {
      en: 'Setup 2FA',
      ko: '2단계 인증 설정',
      ja: '二段階認証設定',
    };
    return texts[lang] || texts.en;
  }

  getVerify2FAText(lang) {
    const texts = {
      en: 'Verify 2FA',
      ko: '2단계 인증 확인',
      ja: '二段階認証確認',
    };
    return texts[lang] || texts.en;
  }

  get2FARequiredMessage(lang) {
    const messages = {
      en: 'Please set up Two-Factor Authentication before starting the game.',
      ko: '게임을 시작하기 전에 2단계 인증을 설정해 주세요.',
      ja: 'ゲームを開始する前に、二段階認証を設定してください。',
    };
    return messages[lang] || messages.en;
  }

  get2FAVerificationTitle(lang) {
    const titles = {
      en: '2FA Verification Required',
      ko: '2단계 인증 확인 필요',
      ja: '二段階認証が必要です',
    };
    return titles[lang] || titles.en;
  }

  get2FAVerificationMessage(lang) {
    const messages = {
      en: 'Please enter your 2FA code to complete login:',
      ko: '로그인을 완료하려면 2단계 인증 코드를 입력하세요:',
      ja: 'ログインを完了するには、二段階認証コードを入力してください:',
    };
    return messages[lang] || messages.en;
  }

  get2FACodePlaceholder(lang) {
    const placeholders = {
      en: 'Enter 2FA code',
      ko: '2단계 인증 코드 입력',
      ja: '二段階認証コードを入力',
    };
    return placeholders[lang] || placeholders.en;
  }

  getVerifyButtonText(lang) {
    const texts = {
      en: 'Verify',
      ko: '확인',
      ja: '確認',
    };
    return texts[lang] || texts.en;
  }

  get2FASetupTitle(lang) {
    const titles = {
      en: 'Set up Two-Factor Authentication',
      ko: '2단계 인증 설정',
      ja: '二段階認証の設定',
    };
    return titles[lang] || titles.en;
  }

  get2FASetupMessage(lang) {
    const messages = {
      en: 'Scan the QR code with your authenticator app:',
      ko: '인증 앱으로 QR 코드를 스캔하세요:',
      ja: '認証アプリでQRコードをスキャンしてください:',
    };
    return messages[lang] || messages.en;
  }

  getVerifyAndEnableButtonText(lang) {
    const texts = {
      en: 'Verify and Enable 2FA',
      ko: '확인 및 2단계 인증 활성화',
      ja: '確認して二段階認証を有効化',
    };
    return texts[lang] || texts.en;
  }

  get2FAEnabledMessage(lang) {
    const messages = {
      en: '2FA is enabled and verified for your account.',
      ko: '계정에 2단계 인증이 활성화되고 확인되었습니다.',
      ja: 'アカウントの二段階認証が有効化され、確認されました。',
    };
    return messages[lang] || messages.en;
  }

  getEnterVerificationCodeMessage(lang) {
    const messages = {
      en: 'Please enter a verification code.',
      ko: '인증 코드를 입력해 주세요.',
      ja: '認証コードを入力してください。',
    };
    return messages[lang] || messages.en;
  }

  get2FASuccessMessage(lang) {
    const messages = {
      en: '2FA verification successful and enabled.',
      ko: '2단계 인증이 성공적으로 확인되고 활성화되었습니다.',
      ja: '二段階認証の確認に成功し、有効化されました。',
    };
    return messages[lang] || messages.en;
  }

  get2FAFailureMessage(lang) {
    const messages = {
      en: 'Verification failed. Please try again.',
      ko: '인증에 실패했습니다. 다시 시도해 주세요.',
      ja: '認証に失敗しました。もう一度お試しください。',
    };
    return messages[lang] || messages.en;
  }

  getEnter2FACodeMessage(lang) {
    const messages = {
      en: 'Please enter a 2FA code.',
      ko: '2단계 인증 코드를 입력해 주세요.',
      ja: '二段階認証コードを入力してください。',
    };
    return messages[lang] || messages.en;
  }

  get2FAVerificationFailedMessage(lang) {
    const messages = {
      en: '2FA verification failed. Please try again.',
      ko: '2단계 인증에 실패했습니다. 다시 시도해 주세요.',
      ja: '二段階認証に失敗しました。もう一度お試しください。',
    };
    return messages[lang] || messages.en;
  }
}