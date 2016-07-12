import {
  AppState
} from 'react-native';
import Deferred from 'fbjs/lib/Deferred';
import SessionManager from './sessionManager';
import {
  WS_HOST,
  WS_IMAGE_HOST
} from './buildVar';


const RECONNECT_RETRY_THESHOLD = 5;
const RECONNECT_INTERVAL = 5000; // in ms


class WebsocketManager {
  constructor() {
    AppState.addEventListener('change', this._handleAppStateChange.bind(this));
    this._toConnect = false;
  }

  connect() {
    this._toConnect = true;
    this._deferMap = new Map();
    this._logonDefer = new Deferred();
    this._newMsgCallbackMap = new Map();
    this._appState = AppState.currentState;

    this._ws = new WebSocket(WS_HOST, 'nuweb-notice');
    this._ws.onopen = () => {
      this._reconnectRetryCount = 0;
      this.login();
    };
    this._ws.onmessage = this._onMessage.bind(this);
    this._ws.onerror = (e) => {
      console.warn('WebsocketManager websocket error - ' + e.message);
      this._reconnect();
    };
    this._ws.onclose = (e) => {
      if (this._toConnect && this._appState === 'active') {
        this._reconnect();
      } else {
        this._ws = null;
      }
    };
  }

  _reconnect() {
    ++this._reconnectRetryCount;
    if (this._reconnectRetryCount < RECONNECT_RETRY_THESHOLD) {
      setTimeout(() => {
        if (this._appState === 'active') {
          this.connect();
        }
      }, RECONNECT_INTERVAL);
    } else {
      console.error('Websocket reconnect abort');
    }
  }

  _createTimeoutDefer(mode, timeout = 300000) {
    const defer = new Deferred();
    // FIXME: Add msgId in server instead of mode as deferId
    const deferId = mode;

    // Simple timestamp as defer ID
    // const deferId = new Date().valueOf() + '';
    // defer._deferId = deferId;

    defer._deferId = mode;
    this._deferMap.set(deferId, defer);
    setTimeout(() => {
      defer.reject(new Error(`Defer timeout - deferId[${deferId}]`));
      this._deferMap.delete(deferId);
    }, timeout);
    return defer;
  }

  _handleAppStateChange(currentAppState) {
    this._appState = currentAppState;
    if (currentAppState !== 'active' && this._ws != null) {
      this._ws.close();
    } else {
      if (this._toConnect && this._ws == null) {
        this.connect();
      }
    }
  }

  send(mode, params = {}) {
    const _params = Object.assign({}, params, {
      mode: mode,
    });
    if (mode === 'login') {
      const data = JSON.stringify(_params);
      this._ws.send(data);
      return this._logonDefer.getPromise();
    } else {
      const defer = this._createTimeoutDefer(mode);
      // _params.cid = defer._deferId;
      const data = JSON.stringify(_params);
      this._logonDefer.getPromise().then(() => {
        this._ws.send(data);
      });
      return defer.getPromise();
    }
  }

  close() {
    this._toConnect = false;
    this._ws.close();
    return Promise.resolve();
  }

  login() {
    const params = {
      nu_code: SessionManager.sessionToken,
      acn: SessionManager.acn,
      sun: SessionManager.sun,
      fun_cb: true,
    };
    return this.send('login', params);
  }

  addNewMessageCallback(name, callback) {
    this._newMsgCallbackMap.set(name, callback);
  }

  removeNewMessageCallback(name) {
    this._newMsgCallbackMap.delete(name);
  }

  _onMessage(e) {
    const data = JSON.parse(e.data);
    // console.log('onMessage', data);
    const {
      mode,
      result
    } = data;
    if (mode === 'login') {
      if (result === 'ok') {
        this._logonDefer.resolve();
      } else {
        this._logonDefer.reject();
      }
    } else {
      const defer = this._deferMap.get(mode);
      if (defer != null) {
        defer.resolve(data);
      }
    }

    /*
    if (mode === 'recv' && code === 0) {
      this._newMsgCallbackMap.forEach((callback, _) => {
        callback(result);
        });
        */
  }
}

export function getWSImage(url) {
  return `${WS_IMAGE_HOST}/${url}`;
}

export function getWSServer(){
    return WS_IMAGE_HOST;
}

export function getWSFile(url) {
  return `${WS_IMAGE_HOST}${url}`;
}

export function getWSVideo(url) {
  return `${WS_IMAGE_HOST}/cb_view_file?url=${url}&type=Video`;
}

export default new WebsocketManager();
