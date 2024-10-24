import StartPage from './StartPage.js';
import { BackGround } from '../threejs/BackGround.js';
import Component from '../core/Component.js';
import * as Utils from '../Utils.js';
import { extractToken, initialToken, check2FAStatus, setup2FA, verify2FA } from './Account.js';

export default class HomePage extends Component {
  setup() {
    this.state = {
      is2FAEnabled: false,
      is2FAVerified: false,
      qrUrl: null,
    };
  }

  template() {
    return `
      <div class="app-container">
        <div data-component="background-container"></div>
        <div data-component="start-page-container"></div>
        <div id="twofa-content"></div>
      </div>
    `;
  }

  async mounted() {
    const $back = this.$target.querySelector('[data-component="background-container"]');
    const $start = this.$target.querySelector('[data-component="start-page-container"]');

    new BackGround($back);
    this.startPage = new StartPage($start, {
      onSetup2FA: () => this.showTwoFASetup(),
      onVerify2FA: () => this.showTwoFAVerification()
    });

    await this.checkLoginStatus();  // await 추가
    console.log("Mounted completed, state:", this.state);
  }

  async checkLoginStatus() {
    if (Utils.isAuthenticated()) {
      const status = await check2FAStatus();
      await this.setState({ 
        is2FAEnabled: status.is_enabled, 
        is2FAVerified: status.is_verified 
      });
      if (!status.is_enabled) {
        console.log("2FA not set up, showing QR code");
        await this.showTwoFASetup();  // await 추가
      } else if (!status.is_verified) {
        console.log("2FA required");
        this.showTwoFAVerification();
      } else {
        console.log("User authenticated and 2FA verified");
      }
    } else {
      const code = await extractToken();
      if (code) {
        const loginResult = await initialToken(code);
        if (loginResult.requires2FA) {
          this.showTwoFAVerification();
        } else {
          const status = await check2FAStatus();
          await this.setState({ 
            is2FAEnabled: status.is_enabled, 
            is2FAVerified: status.is_verified 
          });
          if (!status.is_enabled) {
            await this.showTwoFASetup();  // await 추가
          }
        }
      }
    }
    
    // 모든 비동기 작업이 완료된 후 StartPage 상태 업데이트
    this.startPage.setState({ 
      isLoggedIn: Utils.isAuthenticated(),
      is2FAEnabled: this.state.is2FAEnabled,
      is2FAVerified: this.state.is2FAVerified,
      qrUrl: this.state.qrUrl
    });
    console.log("StartPage state set:", this.state);
  }

  async showTwoFASetup() {
    try {
      const response = await setup2FA();
      console.log("setup2FA response:", response);
      if (response && response.qr_url) {
        await this.setState({ qrUrl: response.qr_url, is2FAEnabled: false });
        this.updateTwoFAUI();
        // StartPage 상태 업데이트는 여기서 하지 않습니다.
      } else {
        console.error("Invalid 2FA setup response:", response);
        alert("Failed to set up 2FA. Please try again or contact support.");
      }
    } catch (error) {
      console.error("Error setting up 2FA:", error);
      alert("An error occurred while setting up 2FA. Please try again later.");
    }
  }
  
  showTwoFAVerification() {
    const twofaContent = document.getElementById('twofa-content');
    twofaContent.innerHTML = `
      <h2>2FA Verification Required</h2>
      <p>Please enter your 2FA code to complete login:</p>
      <input type="text" id="login-2fa-code" placeholder="Enter 2FA code" />
      <button id="verify-login-2fa-button">Verify</button>
    `;
    document.getElementById('verify-login-2fa-button').addEventListener('click', () => this.handleLoginVerify2FA());
  }

  updateTwoFAUI() {
    console.log("UpdateTwoFAUI called, state:", this.state);
    const twofaContent = document.getElementById('twofa-content');
    if (Utils.isAuthenticated()) {
      if (!this.state.is2FAEnabled && this.state.qrUrl) {
        console.log("Showing 2FA setup UI");
        twofaContent.innerHTML = `
          <h2>Set up Two-Factor Authentication</h2>
          <p>Scan the QR code with your authenticator app:</p>
          <img id="qr-code" src="${this.state.qrUrl}" alt="2FA QR Code" />
          <input type="text" id="verification-code" placeholder="Enter verification code" />
          <button id="verify-2fa-button">Verify and Enable 2FA</button>
        `;
        document.getElementById('verify-2fa-button').addEventListener('click', () => this.handleVerify2FA());
      } else if (!this.state.is2FAVerified) {
        this.showTwoFAVerification();
      } else {
        twofaContent.innerHTML = '<p>2FA is enabled and verified for your account.</p>';
      }
    } else {
      twofaContent.innerHTML = '';
    }
  }

  async handleVerify2FA() {
    const verificationCode = document.getElementById('verification-code').value;
    const result = await verify2FA(verificationCode);
    if (result.success) {
      await this.setState({ is2FAEnabled: true, is2FAVerified: true });
      Utils.set2FAToken(result.temp_token);
      alert('2FA verification successful and enabled.');
      this.updateTwoFAUI();
      this.startPage.setState({ is2FAEnabled: true, is2FAVerified: true });
    } else {
      alert(result.message || 'Verification failed. Please try again.');
    }
  }

  async handleLoginVerify2FA() {
    const code = document.getElementById('login-2fa-code').value;
    const result = await verify2FA(code);
    if (result.success) {
      Utils.set2FAToken(result.temp_token);
      await this.setState({ is2FAVerified: true });
      this.startPage.setState({ is2FAVerified: true });
      this.updateTwoFAUI();
    } else {
      alert('2FA verification failed. Please try again.');
    }
  }

  async setState(newState) {
    this.state = { ...this.state, ...newState };
    await new Promise(resolve => setTimeout(resolve, 0));
    this.updateTwoFAUI();
  }
  async reset2FA() {
    try {
      const response = await fetch('/api/reset_2fa', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Utils.getAccessToken()}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        alert('2FA has been reset. Please set up 2FA again.');
        await this.showTwoFASetup();
      } else {
        alert(data.message || 'Failed to reset 2FA');
      }
    } catch (error) {
      console.error('Error resetting 2FA:', error);
      alert('An error occurred while resetting 2FA');
    }
  }
}


