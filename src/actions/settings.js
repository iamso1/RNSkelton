/**
 * @flow
 */

import {
    getMyCsServer,
} from '../utils/apiWrapper';

import {
    request
} from '../utils/apiWrapper';

import * as ActionTypes from '../constants/ActionTypes';
import * as StorageKeys from '../constants/StorageKeys';
import SessionManager from '../utils/sessionManager';

function keyMapper(key: string): string {
  let storageKey = null;
  switch (key) {
    case 'autoSync':
      storageKey = StorageKeys.SETTINGS_AUTO_SYNC;
      break;
    default:
      break;
  }
  if (storageKey != null) {
    return storageKey;
  }
  throw new Error('Invalid key - ' + key);
}

export function loadSetting(key: string): Function {
  return (dispatch, getState) => {

    return AsyncStorage.getItem(keyMapper(key))
      .then(value => {
        dispatch({
          type: ActionTypes.SETTINGS_RECEIVED,
          key,
          value,
        });
        return value;
      })
      .catch(error => {
        console.error(`load settings error - key[${key}] error[${error}]`);
      });
  };
}

export function getRemoteSetting(csServer: string): Function {
    return (dispatch, getState) =>{
        return Promise.resolve(csServer)
        .then(csServer => csServer || getMyCsServer())
        .then(csServer => {
            return request('/API/chk_fun_set.php', 'GET', {}, SessionManager.sessionToken, csServer)
            .then(resp => {
                return resp.json().then(respJson => [csServer, respJson]);
            });
        }).then(([csServer, respJson]) => {
            respJson.csServer = csServer;
            dispatch({
                type: ActionTypes.SETTINGS_RECEIVED,
                settings: respJson,
                key: 'permision',
            });
        }).catch(error => console.warn(`getRemoteSetting Error: ${error.message}`));
    };
}

export function clearSetting(){

}

export function saveSetting(key: string, value: string): Function {
  return (dispatch, getState) => {

    return AsyncStorage.setItem(keyMapper(key), value)
      .then(data => {
        dispatch({
          type: ActionTypes.SETTINGS_RECEIVED,
          key,
          value,
        });
        return value;
      })
      .catch(error => {
        console.error(`save settings error - key[${key}] error[${error}]`);
      });
  };
}
