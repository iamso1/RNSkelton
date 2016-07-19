require('es6-promise').polyfill();
require('isomorphic-fetch');
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import * as actions from '../../src/actions/auth'
import * as types from '../../src/constants/ActionTypes'
import nock from 'nock'
import {request} from '../../src/utils/apiWrapper';
import expect from 'expect' // You can use any testing library
import { API_URL_BASE } from '../../src/utils/buildVar';

const middlewares = [ thunk ];
const mockStore = configureMockStore(middlewares);

describe('Login', () => {
  afterEach(() => {
    nock.cleanAll()
  })

  it('creates FETCH_TODOS_SUCCESS when fetching todos has been done', () => {
      let params = {
        mode: 'ssn_get2',
        acn: 'horsekit1982@gmail.com',
        pwd: 'xup6jo3fup6',
      };
      return request('/tools/api_tools.php', 'GET', params)
        .then(resp => resp.text())
        .then(resp => {
            console.log(resp);
        })
  })
});
