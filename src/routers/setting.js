/**
 * @flow
 */
import React from 'react'; // eslint-disable-line no-unused-vars
import RouteBase from './base';
import SettingsScene from '../containers/SettingScene';


export class RouteSettings extends RouteBase {
  static PATTERN = '/settings/:?query:';

  renderScene(navigator: Object, query: Object) {
    return (
      <SettingsScene
        navigator={navigator} />
    );
  }
}
