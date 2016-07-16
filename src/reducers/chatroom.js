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
        let sortData = sortMessages(action.detail);
        const messages = Immutable.fromJS(sortData);
        return state.set("detail", messages);
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
