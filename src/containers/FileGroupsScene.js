/**
 * @flow
 */
import React, { PropTypes } from 'react';
import {
  View,
  Text,
  TouchableWithoutFeedback,
  StyleSheet,
} from 'react-native';
import { connect } from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome';
import NavBar from '../components/NavBar';
import { changeRoute } from '../actions/route';


export default class FileGroupsScene extends React.Component {
  constructor(props) {
    super(props);
  }

  static propTypes = {
    navigator: PropTypes.object.isRequired,
  };

  static defaultProps = {
  };

  renderItem(name, iconName, touchedRoute) {
    return (
      <TouchableWithoutFeedback
        onPress={() => this.props.dispatch(changeRoute(touchedRoute, this.props.navigator.props.navKey))}>
        <View style={styles.item}>
          <Icon
            name={iconName}
            size={30}
            color="#62c4ff"
            style={styles.itemIcon}
          />
          <Text style={styles.itemName}>{name}</Text>
          <Icon
            name="chevron-right"
            size={15}
            color="#ccc"
            style={styles.itemRightIcon}
          />
        </View>
      </TouchableWithoutFeedback>
    );
  }

  render() {
    return (
      <View>
        <NavBar
          navigator={this.props.navigator}
          title="檔案分類"
        />

        <View style={styles.container}>
          {this.renderItem('所有圖片', 'file-image-o', '/grids/image')}
          {this.renderItem('所有影片', 'file-video-o', '/grids/video')}
          {this.renderItem('所有音樂', 'file-audio-o', '/files/?name=所有音樂&type=Audio')}
          {this.renderItem('所有文章', 'file-text-o', '/files/?name=所有文章&type=Html')}
          {this.renderItem('所有文件', 'file-text-o', '/files/?name=所有文件&type=Document,Text')}
          {this.renderItem('所有連結', 'link', '/files/?name=所有連結&type=Link')}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
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
  itemRightIcon: {
    width: 20,
  },
});


function mapStateToProps(state) {
  return {};
}

export default connect(mapStateToProps, null, null, { withRef: true })(FileGroupsScene);
