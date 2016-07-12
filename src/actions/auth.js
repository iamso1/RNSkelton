/**
 * @flow
 */
import * as ActionTypes from '../constants/ActionTypes';
import AppSessionState from '../constants/AppSessionState';
import {request} from '../utils/apiWrapper';
import X2JS from 'x2js';
import SessionManager from '../utils/sessionManager';

export function login(account: string, password: string): Function {
    return (dispatch, getState) => {
      let params = {
        mode: 'ssn_get2',
        acn: account,
        pwd: password,
      };

      dispatch({type: ActionTypes.LOGIN_REQUEST});
      return request('/tools/api_tools.php', 'GET', params)
        .then(resp => resp.text())
        .then(resp => {
          let reMatch = resp.match(/^Error: (.+)/);
          if (reMatch) {
            dispatch({type: ActionTypes.LOGIN_RECEIVED, success: false, errorText: reMatch[1]});
            return false;
          } else {
            let data = new X2JS().xml2js(resp);
            let {ssn, sca, sun, acn, mail, wns_ip, wns_port, nu_code} = data;
            let accountData = {
              ssn,
              sca,
              sun,
              acn,
              mail,
              wns_ip,
              wns_port,
            };
            SessionManager.update(accountData, nu_code);
            dispatch({type: ActionTypes.LOGIN_RECEIVED, success: true, errorText: null});
            return true;
          }
        })
        .catch(error => {
          console.error('login() error - ' + error);
          dispatch({type: ActionTypes.LOGIN_RECEIVED, success: false, errorText: '內部錯誤'});
        });
    };
}

export function checkAppSessionState(): Function {
  return (dispatch, getState) => {

    let initialState = null;

    let promise = SessionManager.init()
      .then(() => SessionManager.sessionToken == null ? AppSessionState.NoSessionToken : initialState)
      .then(state => {
        if (state == null) {
          let params = {
            acn: SessionManager.acn,
          };

          return request('/API/chk_user_lock.php', 'GET', params, {})
            .then(resp => resp.text())
            .then(resp => {
              return resp === 'Y' ? AppSessionState.InvalidSessionToken : AppSessionState.Logon;
            })
            .catch(error => {
              throw error;
            });
        } else {
          return state;
        }
      })
      .then(state => {
        dispatch({type: ActionTypes.CHECK_APP_SESSION_STATE, state: state});
        return state;
      })
      .catch(error => {
        console.error('checkAppSessionState() error - ' + error);
        dispatch({type: ActionTypes.CHECK_APP_SESSION_STATE, state: AppSessionState.NoSessionToken});
      });

      return promise;
  };
}

export function logout(): Function {
  return (dispatch, getState) => {
    dispatch({type: ActionTypes.LOGOUT_REQUEST});
    // logout success
    dispatch({type: ActionTypes.LOGOUT_RECEIVED, success: true});
  };
}
