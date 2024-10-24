import Component from './core/Component.js';
import HomePage from './pages/HomePage.js';
import InGamePage from './pages/InGamePage.js';
import AiBattlePage from './pages/AiBattlePage.js';
import TournamentPage from './pages/TournamentPage.js';
import TourStandBy from './pages/TourStandBy.js';
import TourStandByFour from './pages/TourStandByFour.js';
import TourStandByEight from './pages/TourStandByEight.js';
import WaitingRoom from './pages/WaitingRoom.js';
import AiGame from './game/AiGame.js';
import AiPage from './game/AiPage.js';
import PlayerGame from './game/PlayerGame.js';
export default class App extends Component {
  setup() {
    this.$state = {
      routes: [
        { path: '', component: HomePage },
        { path: 'ingame-1', component: InGamePage },
        { path: 'ai-battle', component: AiBattlePage },
        { path: 'tournament', component: TournamentPage },
        { path: 'standby-2', component: TourStandBy },
        { path: 'standby-4', component: TourStandByFour },
        { path: 'standby-8', component: TourStandByEight },
        { path: 'waiting-room', component: WaitingRoom },
        { path: 'ai-game', component: AiGame },
        { path: 'tour-game', component: PlayerGame },
      ],
    };
    this.currentComponent = null;
    this.route = this.route.bind(this);
  }

  template() {
    return `
    <main data-component="container">
      </main>
    `;
  }

  setEvent() {
    window.addEventListener('hashchange', this.route);
  }

  mounted() {
    this.route();
  }

  handleHashChange() {
    const hash = window.location.hash.replace('#', '') || '';
    console.log('Hash changed to:', hash);
    this.route(hash);
  }

  updateHash(hash) {
    if (window.location.hash !== `#${hash}`) {
      history.pushState(null, '', `#${hash}`);
    }
  }
  route(hash) {
    const routeInfo =
      this.$state.routes.find((route) => route.path === hash) ||
      this.$state.routes[0];
    const $main = this.$target.querySelector('main');

    if (this.currentComponent) {
      if (typeof this.currentComponent.unmount === 'function') {
        console.log('Unmounting previous component');
        this.currentComponent.unmount();
      } else if (typeof this.currentComponent.cleanup === 'function') {
        console.log('Cleaning up previous component');
        this.currentComponent.cleanup();
      }
      this.currentComponent = null;
    }

    console.log('Mounting new component:', routeInfo.component.name);
    this.currentComponent = new routeInfo.component($main);

    this.updateHash(routeInfo.path);

    console.log('Route info:', routeInfo);
  }
  // route(hash) {
  //   const routeInfo =
  //     this.$state.routes.find((route) => route.path === hash) ||
  //     this.$state.routes[0];
  //   const $main = this.$target.querySelector('main');

  //   if (
  //     this.currentComponent &&
  //     typeof this.currentComponent.unmount === 'function'
  //   ) {
  //     console.log('Unmounting previous component');
  //     this.currentComponent.unmount();
  //   }

  //   console.log('Mounting new component:', routeInfo.component.name);
  //   this.currentComponent = new routeInfo.component($main);

  //   this.updateHash(routeInfo.path);

  //   console.log('Route info:', routeInfo);
  // }

  setEvent() {
    window.addEventListener('hashchange', this.handleHashChange.bind(this));
  }

  cleanup() {
    window.removeEventListener('hashchange', this.handleHashChange.bind(this));
    if (
      this.currentComponent &&
      typeof this.currentComponent.unmount === 'function'
    ) {
      this.currentComponent.unmount();
    }
  }

  //----route Page
  // route() {
  //   const hash = window.location.hash.replace('#', '') || '';
  //   const routeInfo =
  //     this.$state.routes.find((route) => route.path === hash) ||
  //     this.$state.routes[0];

  //   const $main = this.$target.querySelector('main');
  //   if (
  //     this.currentComponent &&
  //     typeof this.currentComponent.cleanup === 'function'
  //   ) {
  //     this.currentComponent.cleanup();
  //   }
  //   this.currentComponent = new routeInfo.component($main);

  //   // new routeInfo.component($main);
  //   console.log('hash------', hash);
  //   console.log('route info: ', routeInfo);
  // }

  cleanup() {
    console.log('clean up hash : ', hash);
    window.removeEventListener('hashchange', this.route);
    if (
      this.currentComponent &&
      typeof this.currentComponent.cleanup === 'function'
    ) {
      this.currentComponent.cleanup();
    }
  }
}
