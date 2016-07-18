/**
 * @flow
 */
 import * as ActionTypes from '../constants/ActionTypes';
import createReducer from '../utils/createReducer';

const Immutable = require('immutable');

let initialState = Immutable.Map();


export default createReducer(initialState, {
    [ActionTypes.CHATROOM_GET_LIST_REQUEST](state, action){
        const roomsData =  Immutable.fromJS(action.rooms);
        return state.set("rooms", roomsData);
    },
    [ActionTypes.CHATROOM_GET_DETAIL_REQUEST](state, action){
        if(state.get(action.cid)){
            return state.update(action.cid, messageData => {
                let newData = messageData.update('messages', messages => {
                    let newmsgs = Immutable.fromJS(sortMessages(action.detail));
                    return newmsgs.concat(messages);
                });
                return newData.set('hasNextPaging', action.hasNextPaging);
            });
        }else{
            let sortData = sortMessages(action.detail);
            const messages = {
                messages: sortData,
                hasNextPaging: action.hasNextPaging,
            }

            return state.set(action.cid, Immutable.fromJS(messages));
        }

    },
    [ActionTypes.CHATROOM_REFRESH_DETAIL_REQUEST](state, action){
        const newState = state.update('detail', detail => {
            return detail.push(Immutable.Map(action.newMsg));
        });
        return newState;
    },
});

function sortMessages(msgs){
    let sortData = [];
    msgs.map(msg => {
        sortData.unshift(msg);
    });
    return sortData;
}
