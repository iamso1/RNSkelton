import React, { PropTypes } from 'react';
import {
   View,
   Text,
   ListView,
   Image,
   InteractionManager,
   TouchableHighlight,
   TouchableWithoutFeedback,
   RefreshControl,
   Dimensions,
 } from 'react-native';
import {connect} from 'react-redux';
import {
    getPostList
} from '../actions/posts';

import NavBar from '../components/NavBar';



class PostListScene extends React.Component{
    static propTypes = {
      navigator: PropTypes.object.isRequired,
      name: PropTypes.string,
      path: PropTypes.string,
      csServer: PropTypes.string,
    };

    constructor(props){
        super(props);
        /*
        let dataSource = new ListView.DataSource({
          rowHasChanged: (r1, r2) => !Immutable.is(r1, r2),
          getRowData: (dataBlob, sectionID, rowID) => { return dataBlob[sectionID].get(rowID); }
        });

        this.state = {
            dataSource: dataSource.cloneWithRows(Immutable.List(), []),
            canLoadMore: true,
            isRefreshing: false,
            posts: {},
            act: '',
            as: '',
            comments: {},
        };
        */
    }

    componentDidMount(){
        InteractionManager.runAfterInteractions(() => {
            console.log(this.props.dispatch);
            const { path, csServer } = this.props;
            console.log(csServer, path);
            this.props.dispatch(getPostList(csServer, path, '', '', null, 20));
        });
    }

    render(){
        return(
            <View>
                <NavBar
                  navigator={this.props.navigator}
                  title={this.props.name}/>
                <Text></Text>
            </View>
        );
    }
}

function mapStateToProps(state) {
  const { posts } = state;
  return {
    posts,
  };
}

export default connect(mapStateToProps, null, null, { withRef: true })(PostListScene);
