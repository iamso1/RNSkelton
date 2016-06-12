/**
 * @flow
 */
import React,{ PropTypes } from 'react';
import {
    View,
    TabBarIOS,
    StyleSheet,
} from 'react-native';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';
import TabViewContainer from './TabViewContainer';


export default class HomeScene extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tabIndex: props.tabIndex,
    };
  }

  static propTypes = {
    tabIndex: PropTypes.number,
  };

  static defaultProps = {
    tabIndex: 0,
  };

  handleSelectTab(tabIndex) {
    this.setState({
      tabIndex: tabIndex,
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <TabBarIOS tintColor="#00a5e6">

          <Icon.TabBarItemIOS
            title="我的檔案"
            iconName="files-o"
            iconSize={20}
            selected={this.state.tabIndex === 0}
            onPress={() => this.handleSelectTab(0)}>
            <TabViewContainer
              navKey="files"
              initialRouteUrl="/files/"
              navigator={this.props.navigator}
              ref="tab_0"
            />
          </Icon.TabBarItemIOS>

          <Icon.TabBarItemIOS
            title="檔案分類"
            iconName="th-list"
            iconSize={20}
            selected={this.state.tabIndex === 1}
            onPress={() => this.handleSelectTab(1)}>

            <TabViewContainer
              navKey="fileGroups"
              initialRouteUrl="/fileGroups/"
              navigator={this.props.navigator}
              ref="tab_1"
            />
          </Icon.TabBarItemIOS>

          <Icon.TabBarItemIOS
            title="訊息"
            iconName="comments-o"
            iconSize={20}
            selected={this.state.tabIndex === 2}
            onPress={() => this.handleSelectTab(2)}>

            <TabViewContainer
              navKey="timeline"
              initialRouteUrl="/stubText?text=TODO timeline view"
              navigator={this.props.navigator}
              ref="tab_2"
            />
          </Icon.TabBarItemIOS>

          <Icon.TabBarItemIOS
            title="通知"
            iconName="bell-o"
            iconSize={20}
            selected={this.state.tabIndex === 3}
            onPress={() => this.handleSelectTab(3)}>

            <TabViewContainer
              navKey="groups"
              initialRouteUrl="/notifications/"
              navigator={this.props.navigator}
              ref="tab_3"
            />
          </Icon.TabBarItemIOS>

          <Icon.TabBarItemIOS
            title="動態"
            iconName="feed"
            iconSize={20}
            selected={this.state.tabIndex === 4}
            onPress={() => this.handleSelectTab(4)}>

            <TabViewContainer
              navKey="feed"
              initialRouteUrl="/postlist/?name=動態"
              navigator={this.props.navigator}
              ref="tab_4"
            />
          </Icon.TabBarItemIOS>

        </TabBarIOS>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#eee',
  },
});


function mapStateToProps(state) {
  return {};
}

export default connect(mapStateToProps, null, null, { withRef: true })(HomeScene);
