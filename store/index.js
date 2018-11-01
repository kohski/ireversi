const USER_KEY_NAME = 'iReversiUserId';
const GRID_MIN = 6;
const GRID_MAX = 40;
const DEFAULT_GRID_X = 10;

export const state = () => ({
  userId: null,
  token: null,
  pieces: null,
  candidates: null,
  standbys: null,
  size: null,
  score: 0,
  gridX: DEFAULT_GRID_X, // Expect: Integer
  moveDist: { x: 0, y: 0 }, // 原点の移動量
  swipeInit: { x: 0, y: 0 }, // swipe基準点
  dragInit: { x: 0, y: 0 }, // drag基準点
  pinchInit: 0, // pinch基準距離
  touchTime: 0, // ダブルタッチ無効判定に使用
  dragFlg: false,
});

export const plugins = [
  (store) => {
    if (process.env.NODE_ENV === 'test') return;
    const localData = localStorage.getItem(USER_KEY_NAME);
    if (localData) {
      store.commit('setAccessToken', JSON.parse(localData));
    }

    store.subscribe((mutation) => {
      if (mutation.type !== 'setAccessToken') return; // setAccessTokenの発火時のみ起動
      localStorage.setItem(USER_KEY_NAME, JSON.stringify(mutation.payload));
    });
  },
];

export const mutations = {
  setBoard(state, {
    pieces,
    candidates,
    standbys,
    size,
    score,
  }) {
    state.pieces = pieces;
    state.candidates = candidates;
    state.standbys = standbys;
    state.size = size;
    state.score = score;
  },
  zoomout(state) {
    state.gridX = Math.max(GRID_MIN, Math.min(GRID_MAX, state.gridX + 2));
  },
  zoomin(state) {
    state.gridX = Math.max(GRID_MIN, Math.min(GRID_MAX, state.gridX - 2));
  },
  setInitPos(state, position) {
    // 基準地点設定
    state.dragFlg = true;
    state.dragInit = position;
  },
  pinchStart(state, distance) {
    // 基準距離設定
    state.dragFlg = false;
    state.pinchInit = distance;
  },
  gridMove(state, position) {
    if (state.dragFlg) {
      const requestXHalf = state.swipeInit.x - (position.x - state.dragInit.x);
      const requestYHalf = state.swipeInit.y + (position.y - state.dragInit.y);
      state.moveDist.x = requestXHalf;
      state.moveDist.y = requestYHalf;

      // const arryX = [];
      // state.pieces.map(el => arryX.push(el.x));
      // const swipeMaxNumX = Math.max(...arryX) + 2;
      // if (state.moveDist.x >= swipeMaxNumX) {
      //   state.moveDist.x = swipeMaxNumX;
      // }

      // const swipeMinNumX = Math.min(...arryX) - 1;
      // if (state.moveDist.x <= swipeMinNumX) {
      //   state.moveDist.x = swipeMinNumX;
      // }
    }
  },
  pinchMove(state, distance) {
    const cellWidth = window.innerWidth / state.gridX;
    if (Math.abs(distance - state.pinchInit) > cellWidth) {
      if ((distance - state.pinchInit) > 0) {
        state.gridX = Math.max(GRID_MIN, Math.min(GRID_MAX, state.gridX - 1));
      } else if ((distance - state.pinchInit) < 0) {
        state.gridX = Math.max(GRID_MIN, Math.min(GRID_MAX, state.gridX + 1));
      }
    }
  },
  resetInitPos(state) { // touchend
    state.pinchInit = 0;
    state.dragFlg = false;
    // 次の起点場所情報の保存
    state.swipeInit.x = state.moveDist.x;
    state.swipeInit.y = state.moveDist.y;
    state.touchTime = new Date().getTime();
  },
  setAccessToken(state, { accessToken, userId }) {
    state.token = accessToken;
    state.userId = userId;
    // state.userName = userName:
  },
};

export const actions = {
  async getAccessToken({ commit, state }) {
    if (!state.token) {
      const userData = await this.$axios.$post('/user_id_generate');
      commit('setAccessToken', userData);
    }
  },
  async getBoard({ commit }) {
    commit('setBoard', await this.$axios.$get('/board'));
  },
  async putPiece({ dispatch }, params) {
    await this.$axios.$post('/piece', params);
    await dispatch('getBoard');
  },
  async resetGame({ dispatch }, keyword) {
    await this.$axios.$delete('/piece', { keyword });
    await dispatch('getBoard');
  },
};