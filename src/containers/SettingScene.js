/**
 * @flow
 */
import React, { PropTypes } from 'react';
import {
  View,
  ScrollView,
  Text,
  Switch,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
} from 'react-native';

import _ from 'lodash';
import Icon from 'react-native-vector-icons/FontAwesome';
import Accordion from 'react-native-accordion';
import ItemCheckbox from 'react-native-item-checkbox';
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

const { width } = Dimensions.get('window');

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

    renderPermisionRow(name: string, checked: bool): Function{
        return(
            <View style={styles.accordionRow}>
                <View style={{marginRight: 30, marginTop: 15,flex:5}}>
                    <Text style={styles.accordionText}>{name}</Text>
                </View>
                <View style={{flex : 1}}>
                <ItemCheckbox
                  checked={true}
                  color="#32cd32"
                  icon="check"
                  iconSize="normal"
                  size={35}/>
                  </View>
            </View>
        );
    }

    renderPermisionSetting(permision): ?Function{

        if(_.isUndefined(permision)) return null;

        var header = (
          <View style={styles.accordionHeader}>
            <Text style={styles.accordionText}>權限設定</Text>
          </View>
        );

        var content = (
          <ScrollView style={styles.accordionContent}>
              {this.renderPermisionRow('行事曆', permision.get('calendar'))}
              {this.renderPermisionRow('聊天室', permision.get('chatbox'))}
              {this.renderPermisionRow('Mail Check', permision.get('mail_chk'))}
              {this.renderPermisionRow('通知', permision.get('notice'))}
              {this.renderPermisionRow('已註冊', permision.get('register'))}
              {this.renderPermisionRow('全站搜尋', permision.get('global_site_search'))}
              {this.renderPermisionRow('Site List', permision.get('site_list'))}
              {this.renderPermisionRow('NuMail', permision.get('numail'))}
              {this.renderPermisionRow('Share Mail', permision.get('nuweb'))}
          </ScrollView>
        );

        return <View style={styles.item}>
            <Accordion
                style={{width: width}}
                expanded={true}
                underlayColor='#CCC'
                header={header}
                content={content}
                easing="easeOutCubic"/>
        </View>;
    }

    render() {
        const { settings } = this.props;
        return (
            <View>
                <NavBar
                  navigator={this.props.navigator}
                  title="設定"
                />
            <View style={styles.container}>

                    {this.renderPermisionSetting(settings.get('permision'))}

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
        marginBottom: 40,
    },
    item: {
        marginLeft: 10,
        marginRight: 10,
        paddingTop: 20,
        paddingBottom: 20,
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#ccc',
    },
    itemIcon: {
        marginLeft: 20,
    },
    itemName: {
        flex: 1,
        marginLeft: 20,
        fontSize: 18,
    },
    accordionContent: {
        marginTop: 10,
        marginLeft: 30,
    },
    accordionText: {
        fontSize: 18,
    },
    accordionRow: {
        flexDirection: 'row',
        paddingTop: 10,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderColor: '#ccc',
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
