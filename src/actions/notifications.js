/**
 * @flow
 */
import * as ActionTypes from '../constants/ActionTypes';
import WebsocketManager from '../utils/websocketManager';


export function getNotificationList(): Function {
  return (dispatch, getState) => {
    return WebsocketManager.send('nt_getList')
      .then(resp => {
        const data = [];
        for (const rec of resp.recs) {
          const { title, url, owner, MyView } = rec;
          data.push({
            title,
            url,
            owner,
            MyView,
          });
        }
        dispatch({
          type: ActionTypes.NOTIFICATION_GET_LIST_RECEIVED,
          data,
        });
        return data;
      })
      .catch(error => {
        console.error('getNotificationList() error - ' + error);
      });
  };
}
