/**
 * @flow
 */
import React, { PropTypes } from 'react';
import {
    StyleSheet,
    View,
    Image,
    Text,
    ListView,
    InteractionManager,
    TouchableWithoutFeedback,
} from 'react-native';
import { connect } from 'react-redux';
import Immutable from 'immutable';
import striptags from 'striptags';
import NavBar from '../components/NavBar';
import { getNotificationList } from '../actions/notifications';
import { changeRoute } from '../actions/route';


export default class NotificationsScene extends React.Component {
  constructor(props) {
    super(props);
    this._reUrlSplitter = new RegExp(/^(https?:\/\/[^/]*)(\/.*\/)[^/]*$/);
    this.renderItem = this.renderItem.bind(this);
    const dataSource = new ListView.DataSource({
      rowHasChanged: (r1, r2) => !Immutable.is(r1, r2),
      getRowData: (dataBlob, sectionID, rowID) => { return dataBlob[sectionID].get(rowID); }
    });
    this.state = {
      dataSource: dataSource.cloneWithRows(Immutable.List(), []),
    };
  }

  static propTypes = {
    navigator: PropTypes.object.isRequired,
  };

  componentDidMount() {
    InteractionManager.runAfterInteractions(() => {
      this.props.dispatch(getNotificationList());
    });
  }

  componentWillReceiveProps(nextProps) {
    const { notifications } = nextProps;
    if (this.props.notifications !== notifications) {
      const totalCount = notifications.size;
      const rowIds = (count => [...Array(count)].map((val, i) => i))(totalCount);
      this.setState({
        dataSource: this.state.dataSource.cloneWithRows(notifications, rowIds),
      });
    }
  }

  renderItem(item) {
    const matches = item.get('url').match(this._reUrlSplitter);
    if (!matches) {
      throw new Error('Invalid url - ' + item.get('url'));
    }
    const csServer = matches[1];
    const path = matches[2];
    const imageUri = `${csServer}/UserProfile/user_image.php?acn=${item.get('owner')}`;
    const content = striptags(item.get('title'));
    const isUnread = !(item.get('MyView'));
    return (
      <TouchableWithoutFeedback
        onPress={() => this.props.dispatch(changeRoute(
          `/files/?csServer=${csServer}&path=${path}`,
          this.props.navigator.props.navKey
        ))}>
        <View style={[styles.item, isUnread && styles.itemUnread]}>
          <Image
            source={{ uri: imageUri }}
            style={styles.avatar}
          />
          <Text style={styles.content}>{content}</Text>
        </View>
      </TouchableWithoutFeedback>
    );
  }

  render() {
    return (
      <View style={styles.container}>
        <NavBar
          navigator={this.props.navigator}
          title="通知"
        />

        <ListView
          enableEmptySections={true}
          dataSource={this.state.dataSource}
          pageSize={30}
          renderRow={this.renderItem}
          renderSeparator={(sectionID, rowID, adjacentRowHighlighted) => <View key={rowID} style={styles.separator} />}
          renderFooter={() => <View style={styles.footerMargin} />}
        />

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
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingTop: 5,
    paddingBottom: 5,
  },
  itemUnread: {
    backgroundColor: '#f8f8f8',
  },
  avatar: {
    width: 50,
    height: 50,
  },
  content: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  separator: {
    backgroundColor: '#fff',
    height: 1,
    marginLeft: 10,
    marginRight: 10,
    marginTop: 2,
    marginBottom: 2,
  },
  footerMargin: {
    marginBottom: 10,
  },

});


function mapStateToProps(state) {
  const { notifications } = state;
  return {
    notifications,
  };
}

export default connect(mapStateToProps, null, null, { withRef: true })(NotificationsScene);
