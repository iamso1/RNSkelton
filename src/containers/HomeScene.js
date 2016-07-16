/**
 * @flow
 */
import React,{ PropTypes } from 'react';
import {
    View,
    StyleSheet,
    Text,
    ScrollView,
    InteractionManager,
} from 'react-native';

import { connect } from 'react-redux';
import _ from 'lodash';
import Icon from 'react-native-vector-icons/FontAwesome';
import TabViewContainer from './TabViewContainer';
import TabIcon from '../components/TabIcon';
import ScrollableTabView from 'react-native-scrollable-tab-view';

export default class HomeScene extends React.Component {
      constructor(props) {
        super(props);
        this.state = {
          page: 'files',
          csServer: '',
        };
      }

    static propTypes = {
        tabIndex: PropTypes.number,
    };

    static defaultProps = {
        tabIndex: 0,
    };

    componentWillReceiveProps(nextProps){
        const { settings } = nextProps;
        if(_.isEmpty(this.state.csServer) && settings.get('permision')){
            this.setState({
                csServer: settings.get('permision').get('csServer')
            });
        }
    }

    render() {
        return (
          <View style={styles.container}>
            <ScrollableTabView
                initialPage={0}
                tabBarPosition='bottom'
                renderTabBar= {() => <TabIcon />}>
                <View tabLabel={{
                        icon: 'files-o',
                        name: '我的檔案'
                    }} style={styles.card}>
                    <TabViewContainer
                        navKey="files"
                        initialRouteUrl="/files/"
                        navigator={this.props.navigator}
                        ref="tab_0"/>
                </View>
                <View tabLabel={{
                        icon: 'th-list',
                        name: '檔案列表',
                    }} style={styles.card}>
                    <TabViewContainer
                        navKey="group"
                        initialRouteUrl="/fileGroups/"
                        navigator={this.props.navigator}
                        ref="tab_1"/>
                </View>
                <View tabLabel={{
                        icon: 'comments-o',
                        name: '聊天室',
                    }} style={styles.card}>
                    <TabViewContainer
                        navKey="chatbox"
                        initialRouteUrl={`/chatroom?csServer=${this.state.csServer}`}
                        navigator={this.props.navigator}
                        ref="tab_2"/>
                </View>
                <View tabLabel={{
                        icon: 'bell-o',
                        name: '通知',
                    }} style={styles.card}>
                    <TabViewContainer
                        navKey="notifications"
                        initialRouteUrl="/notifications/"
                        navigator={this.props.navigator}
                        ref="tab_3"/>
                </View>
                <View tabLabel={{
                        icon: 'feed',
                        name: '動態',
                    }} style={styles.card}>
                    <TabViewContainer
                        navKey="feed"
                        initialRouteUrl="/files/"
                        navigator={this.props.navigator}
                        ref="tab_4"/>
                </View>
            </ScrollableTabView>
          </View>
        );
    }
}

const styles = StyleSheet.create({
  container: {
    flex:1,
    flexDirection: 'column',
    backgroundColor: '#eee',
  },
  card: {
    borderWidth: 1,
    backgroundColor: '#fff',
    borderColor: 'rgba(0,0,0,0.1)',

    flex: 1,
  },
});


function mapStateToProps(state) {
    const {
        settings,
    } = state;

    return {
        settings,
    };
}

export default connect(mapStateToProps, null, null, { withRef: true })(HomeScene);
