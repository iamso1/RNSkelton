/*
 * @flow
 */
import React, { PropTypes } from 'react';
import _ from 'lodash';
import {
    StyleSheet,
    Text,
    View,
    ListView,
    Image,
    InteractionManager,
    RefreshControl,
} from 'react-native';

import Immutable from 'immutable';
import S from 'string';
import InfiniteScrollView from 'react-native-infinite-scroll-view';
import NavBar from '../components/NavBar';
import Icon from 'react-native-vector-icons/FontAwesome';
import moment from 'moment';
import Button from 'react-native-button';
import { changeRoute } from '../actions/route';
import { getRoomsList } from '../actions/chatroom';
import { connect } from 'react-redux';

class ChatRoomsScene extends React.Component{
    constructor(props){
        super(props);
        this.renderRoomEntityView = this.renderRoomEntityView.bind(this);
        let dataSource = new ListView.DataSource({
          rowHasChanged: (r1, r2) => !Immutable.is(r1, r2),
          getRowData: (dataBlob, sectionID, rowID) => { return dataBlob[sectionID].get(rowID); }
        });

        this.state = {
            dataSource: dataSource.cloneWithRows(Immutable.List(), []),
            canLoadMore: false,
            isRefreshing: false,
            csServer: '',
        };
    }

    static propTypes = {
        navigator: PropTypes.object.isRequired,
    };

    componentDidMount(){
        InteractionManager.runAfterInteractions(() => {
          this.props.dispatch(getRoomsList());

        });
    }

    componentWillReceiveProps(nextProps) {
          const { chatroom } = nextProps;

          let roomsData = chatroom.get('rooms');
          let roomCount = roomsData.size;
          let canLoadMore = chatroom.get('hasNextPaging');
          let rowIds = (count => [...Array(count)].map((val, i) => i))(roomCount);
          this.setState({
              dataSource: this.state.dataSource.cloneWithRows(roomsData, rowIds),
              canLoadMore: canLoadMore,
              isRefreshing: false
          });
    }

    getDetail(cid){
        const { csServer } = this.props;
        this.props.dispatch(changeRoute(`/msgDetail/?cid=${cid}&csServer=${csServer}`, this.props.navigator.props.navKey));
    }

    renderRoomEntityView(room){
        const owner = room.get('owner');
        let nu_code =_.find(room.get('allow').toArray(), u => {
            return u !== owner;
        });

        if(nu_code === 'undefined') nu_code = owner;

        const lastMsg = room.get('msg_rec');

        let Title = room.get('title') || room.get('allow').get('1');
        return (
            <Button onPress={() => this.getDetail(room.get('_id'))}>
                <View style={styles.msg}>
            <View style={styles.msgTitle}>
                <Image
                    style={styles.userLogo}
                    source={{uri: `${this.props.csServer}/UserProfile/user_image.php?acn=${nu_code}`}}/>
                <Text style={styles.msgTitleText}> {Title} </Text>
                <Text style={styles.msgDate}>{
                    (lastMsg)
                        ? moment(lastMsg.get('time')).format('LLL')
                        : 'Empty'}
                </Text>
            </View>

            <View style={styles.msgContent}>
                <Text style={styles.msgContentText}> {
                        (lastMsg)
                            ? S(lastMsg.get('content')).lines()[0]
                            : ''
                        }</Text>
                    <Icon
                      name="chevron-right"
                      size={15}
                      color="#ccc"
                      style={styles.itemRightIcon}
                    />
            </View>
        </View>
    </Button>);
    }

    loadMore(){
        console.log('loadMore');
    }

    render(){
        return(
            <View style={styles.container}>
                <NavBar
                  navigator={this.props.navigator}
                  title={this.props.name} />
                <ListView
                    renderScrollComponent= {props => <InfiniteScrollView
                        refreshControl={
                            <RefreshControl
                            onRefresh= {this.refresh}
                            refreshing={this.state.isRefreshing}
                            />}
                            {...props}
                        />}
                        enableEmptySections={true}
                        style={styles.listView}
                        onLoadMoreAsync={this.loadMore}
                        canLoadMore={this.state.canLoadMore}
                        dataSource={this.state.dataSource}
                        pageSize={30}
                        style={styles.listView}
                        renderRow={this.renderRoomEntityView}
                    />
            </View>
        );
    }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listView: {
   margin: 10,
  },
  msg: {
      marginTop: 5,
      marginBottom: 5,
      borderBottomWidth: 1,
      borderColor: '#808080',
  },
  msgTitle: {
      flexDirection: 'row',
  },
  msgTitleText: {
      fontSize: 22,
      flex: 1,
      marginBottom: 5,
  },
  msgDate: {
      color: '#d3d3d3',
      fontSize: 18,
  },
  mutedText: {
      fontSize: 18,
      color: '#d3d3d3'
  },
  msgContent: {
      flexDirection: 'row',
      marginTop: 5,
      marginBottom: 5,
  },
  msgContentText: {
      flex: 1,
      fontSize: 18,
      color: '#d3d3d3'
  },
  itemRightIcon: {
    width: 20,
  },
  userLogo: {
      height: 40,
      width: 40,
      marginLeft: 5,
      borderRadius: 20,
  },
});

function mapStateToProps(state) {
  const { chatroom } = state;

  return {
    chatroom,
  };
}

export default connect(mapStateToProps, null, null, { withRef: true })(ChatRoomsScene);
