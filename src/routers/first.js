/**
 * @flow
 */
import React from 'react'; // eslint-disable-line no-unused-vars
import RouteBase from './base';
import FirstScene from '../containers/FirstScene';

export class FirstRoute extends RouteBase {
  static PATTERN = '/first/:?query:';

  renderScene(navigator, query) {
    let { name, csServer, path, type } = query || {};
    console.log(query);
    return (
      <FirstScene
        navigator={navigator}
        name={name}
        csServer={csServer}
        path={path}
        type={type}/>
    );
  }
}
