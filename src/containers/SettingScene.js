/**
 * @flow
 */
import React, { PropTypes } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome';
import NavBar from '../components/NavBar';

import { logout } from '../actions/auth';
import {
  loadSetting,
  saveSetting,
} from '../actions/settings';
import {
    connect
} from 'react-redux';
import {
    replaceRoute
} from '../actions/route';

export default class SettingsScene extends React.Component {
  constructor(props) {
    super(props);
    this.handleLogout = this.handleLogout.bind(this);
    this.handleSwitchChange = this.handleSwitchChange.bind(this);
    this.state = {
      enableAutoSync: false,
    };
  }

  static propTypes = {
    navigator: PropTypes.object.isRequired,
  };

  componentDidMount() {
    //this.props.dispatch(loadSetting('autoSync'));
  }

  componentWillReceiveProps(nextProps) {
    const { auth, settings } = nextProps;
    if (this.props.auth !== auth && auth.action === 'logout' && auth.success) {
      this.props.dispatch(replaceRoute('/', 'root'));
    }

    if (this.props.settings !== settings) {
      this.setState({
        enableAutoSync: settings.autoSync === 'true',
      });
    }
  }

  handleLogout() {
    this.props.dispatch(logout());
  }

  handleSwitchChange() {
    const newState = !this.state.enableAutoSync;
/*
    if (newState) {
      AutoSyncManager.enable();
    } else {
      AutoSyncManager.disable();
    }
*/
    const value = newState ? 'true' : 'false';
    this.props.dispatch(saveSetting('autoSync', value));

  }

  render() {
    return (
      <View>
        <NavBar
          navigator={this.props.navigator}
          title="設定"
        />

        <View style={styles.container}>

          <TouchableWithoutFeedback onPress={this.handleLogout}>
            <View style={styles.item}>
              <Icon
                name="sign-out"
                size={30}
                color="#c0c0c0"
                style={styles.itemIcon}
              />
              <Text style={styles.itemName}>登出</Text>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
  },
  item: {
    marginLeft: 10,
    marginRight: 10,
    paddingTop: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  itemIcon: {
    width: 30,
    marginLeft: 20,
  },
  itemName: {
    flex: 1,
    marginLeft: 20,
    fontSize: 18,
  },
});


function mapStateToProps(state) {
  const { auth, settings } = state;
  return {
    auth,
    settings,
  };
}

export default connect(mapStateToProps, null, null, { withRef: true })(SettingsScene);
