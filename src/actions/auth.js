/**
 * @flow
 */
import * as ActionTypes from '../constants/ActionTypes';
import AppSessionState from '../constants/AppSessionState';
import SessionManager from '../utils/sessionManager';



export function login(account: string, password: string): Function {
  return (dispatch, getState) => {
    let params = {
      acn: account,
      pwd: password,
    };
    dispatch({type: ActionTypes.LOGIN_REQUEST});
    setTimeout(function(){
        dispatch({
        type: ActionTypes.LOGIN_RECEIVED,
        success: true,
        errorText: '',
    })
    }, 3000);

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
    let success = null;
    // NUCloud does not invalidated sessionToken in server side, here to cleanup stored sessionToken only.
    return SessionManager.cleanup()
      .then(() => {
        dispatch({type: ActionTypes.LOGOUT_RECEIVED, success: true});
        return success;
      })
      .catch(error => console.log('Unable to logout - error: ' + error));
  };
}
