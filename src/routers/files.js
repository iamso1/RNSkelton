/**
 * @flow
 */
import React from 'react'; // eslint-disable-line no-unused-vars
import RouteBase from './base';
import FilesScene from '../containers/FilesScene';

export class FilesRoute extends RouteBase {
  static PATTERN = '/first/:?query:';

  renderScene(navigator:Object, query: Object) {
    let { name, csServer, path, type } = query || {};

    return (
      <FilesScene
        navigator={navigator}
        name={name}
        csServer={csServer}
        path={path}
        type={type}/>
    );
  }
}
