
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, StyleSheet, Image, Dimensions, Text, FlatList, Platform, TouchableOpacity, TouchableWithoutFeedback, ActivityIndicator, Alert} from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import SupportItem from '../components/SupportItem'
import { theme } from '../core/theme'
import firestore from '@react-native-firebase/firestore'
import {firebase} from '@react-native-firebase/auth'
import moment from 'moment'
import SegmentedControl from '@react-native-segmented-control/segmented-control';

import { showError } from '../NotificationService'
import { 
  usersGet,
  usersChatSelect,
  dialogCreate, 
  dialogJoin,
  dialogCreateCancel, 
  messageSend,
  usersSelect,
  webrtcCall
 } from '../actionCreators'
  import QB from 'quickblox-react-native-sdk'

const DEVICE_WIDTH = Dimensions.get('window').width;

class SupportScreen extends Component {
  constructor(props) {
    super(props)

    this._unsubscribeFocus = null;
    this._observer = null;

    this.state = { 
      isLoading: false,
      segementIndex: 0,

      supports: [],
      scheduledSupports: [],
      activeSupports: [],
      closedSupports: [], 
    }
  }

  componentDidMount() {
    // this.massDeleteDocs()

    this._unsubscribeFocus = this.props.navigation.addListener('focus', () => {
      this.getSupports();
    });

    const userID = firebase.auth().currentUser.uid;
    this._observer = firestore().collection('notification').where('receivers', 'array-contains', userID)
    .onSnapshot(querySnapshot => {
      if (querySnapshot.docChanges().length > 0){
        this.getSupports();
      }      
    });
  }

  componentWillUnmount() {
    this._unsubscribeFocus();
    this._observer();
  }

  massDeleteDocs = async() => {
    const notificationQuerySnapshot = 
    await firestore()
    .collection('users')
    .where('type', '==', 'customer')
    .get();

    const batch = firestore().batch();

    notificationQuerySnapshot.forEach(documentSnapshot => {      
      batch.update(documentSnapshot.ref, 'facility', [{'branch' : 'ATL', 'facility': 'YO7rs25rZ4InCTwFv4HK', 'access': 'single'}]);
      // batch.delete(documentSnapshot.ref)
    });
  
    return batch.commit();
  }

  getSupports = () => {
    const userID = firebase.auth().currentUser.uid;

    this.setState({
      isLoading: true,
    });

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/getSupports', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userid: userID,
      }),
    })
    .then((response) => response.json())
    .then((responseJson) => {
      if (responseJson.statusCode !== 200) {
        this.setState({
          isLoading: false,
        });
        //alert(responseJson.error);
        return;
      }

      console.log(responseJson.request.length)

      this.setState({
        isLoading: false,
        supports: responseJson.request,        
        activeSupports: responseJson.active,
        scheduledSupports: responseJson.scheduled,
        closedSupports: responseJson.closed, 
      });     
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
      });
      Alert.alert('Network Error', 'Please check your network connection and try again.')
    });
  }

  selectRow = item => {
    if (item.status === 'accepted' || item.status === 'addedColleague'){
      if (item.type == 'Chat') {
        this.joinHandler(item) 
      } else {
        this.sendReconnectNotification(item)  

        setTimeout(() => {
          this.joinCallHandler(item) 
        }, 200)               
      }
    } else if (item.status === 'completed'){
      this.props.navigation.push('SupportDetail', {
        request: item,     
      }) 
    } else {
      if ( (item.isSchedule == true) && (item.status == 'pending' || item.status == 'scheduled') ) {
        this.props.navigation.push('ScheduleSupportWaiting', {
          request: item,
          isFromScheduleSupport: false,        
        }) 
      }
    } 
  }

  joinHandler = (item) => {   
    const { createDialog, navigation, selected } = this.props

    global.selectedRequest = item
    const dialog = item.dialog   
    global.curUser = item.sender 
    navigation.navigate('Messages', {dialog})
  }

  sendReconnectNotification = (request) => {
    this.setState({
      isLoading: true,
    });

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/sendReconnectNotification', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        request: request,
        issender: true
      }),
    })
    .then((response) => response.json())
    .then((responseJson) => {
      if (responseJson.statusCode !== 200) {
        this.setState({
          isLoading: false,
        });
        return;
      }          
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
      });
    });
  }

  joinCallHandler = (request) => {   
    this.setState({
      isLoading: false,
    });
    
    const { selectUser, selected = [] } = this.props

    const user = request.receiver
    const index = selected.findIndex(item => item.id === user.QBId)    

    if (index > -1 || selected.length < 3) {
      const username = (user.firstname +  " " + user.lastname) || user.email
      selectUser({ id: user.QBId, name: username })
    } else {
      showError(
        'Failed to select user',
        'You can select no more than 3 users'
      )
    }

    setTimeout(() => {
      this.initCall(request) 
    }, 200); 
  }

  initCall = (request) => {
    const { call, selected } = this.props
    const opponentsIds = selected.map(user => user.id)
    global.selectedRequest = request

    try {
      if (request.type === 'Call') {
        call({ opponentsIds, type: QB.webrtc.RTC_SESSION_TYPE.AUDIO })
      } else {
        call({ opponentsIds, type: QB.webrtc.RTC_SESSION_TYPE.VIDEO })
      }
    } catch (e) {
      showError('Audo Error', e.message)
    }
  }

  renderSupportItem = ({item}) => (
    <SupportItem
      support={item}
      status={this.state.segementIndex}
      onSelectRow={this.selectRow}
    />
  )
  
  render() {
    var supportData = [];
    if (this.state.scheduledSupports.length > 0 ) {
      supportData.push({
        title: "Scheduled",
        data: this.state.scheduledSupports,
      })
    }

    if (this.state.activeSupports.length > 0 ) {
      supportData.push({
        title: "Active",
        data: this.state.activeSupports,
      })
    }

    if (this.state.closedSupports.length > 0 ) {
      supportData.push({
        title: "Earlier",
        data: this.state.closedSupports,
      })
    }  

    console.log("supports length ===>", this.state.supports.length)

    return (
      <Background>

        <View style = {styles.navigationView}>
          <Text style={styles.pageTitle}>Support History</Text>
          <View style={{flex: 1}} />
          <TouchableOpacity style={styles.rightButton}>
            <Image
              style={styles.alertImage}
              source={require('../assets/images/home/alert.png')}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.listView}>
          <SegmentedControl
            style={styles.segementContainer}
            values={[
              'Active',
              'Scheduled',
              'Closed',
            ]}
            selectedIndex={this.state.segementIndex}
            onChange={(event) => {
              this.setState({segementIndex: event.nativeEvent.selectedSegmentIndex});
            }}
            fontStyle={{fontSize: 14, fontFamily: 'Poppins-SemiBold'}}
          />

          <FlatList
            data={this.state.segementIndex == 0 
              ? this.state.activeSupports
              : this.state.segementIndex == 1
              ? this.state.scheduledSupports
              : this.state.closedSupports
            }
            style={{marginTop: 0, flex: 1}}
            keyExtractor={(item, index) => item + index}
            renderItem={this.renderSupportItem}          
          />

        </View>
        {this.state.isLoading ? 
        (<ActivityIndicator
          color={theme.colors.primary}
          size="large"
          style={styles.preloader}
          />
        ) : null}
                              
      </Background>
    )
  }
}

const styles = StyleSheet.create({
  preloader: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    position: 'absolute',
  },

  navigationView: {
    width: '100%',
    height: Platform.OS === 'ios' ? 54 + getStatusBarHeight() : 60,
    alignSelf: 'center',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    flexDirection: 'row',
  },

  pageTitle: {
    height: 28,
    marginLeft: 20,
    marginBottom: 10,
    fontSize: 20,
    lineHeight: 30,
    fontFamily: 'Poppins-SemiBold',        
  },

  rightButton: {
    width: 50,
    height: 50,
    paddingLeft: 14,
    paddingTop: 14,
  },

  alertImage: {
    width: 22,
    height: 22,
  },

  listView: {
    flex: 1,
    width: DEVICE_WIDTH,
    marginTop: 3,  
  },

  sectionView: {
    width: DEVICE_WIDTH,
    marginTop: 6,
    height: 22,
  },

  sectionText: {    
    paddingLeft: 16,
    paddingTop: 6,    
    fontSize: 15,
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',      
    color: theme.colors.sectionHeader
  },

  cellView: {
    width: DEVICE_WIDTH,
    height: 90,
  },

  cellContentView: {    
    flex: 1,
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 14,
    backgroundColor: theme.colors.inputBar,
    flexDirection: 'row',
  },

  imageView: {
    width: 52,
    height: 52,
    marginLeft: 12,
    marginTop:13,
    marginBottom: 12,
    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  profileImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderColor: '#fff',
    borderWidth: 2,
  },

  iconImage: {
    width: 20,
    height: 20,
    position: 'absolute',
    right: 0,
    bottom: -2,
  },

  contentView: {
    flex: 1,
    marginLeft: 12,
    marginTop: 18,
    justifyContent: 'flex-start',
  },

  nameView: {
    marginLeft: 1,
    flexDirection: 'row',
  },

  nameText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',     
  },

  timeText: {
    marginRight: 12,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    color: theme.colors.sectionHeader,    
  },

  sessionView: {
    flexDirection: 'row'
  },

  callImage: {
    width: 26,
    height: 26,        
    resizeMode: 'stretch',
    marginRight: 8,
  },

  contentText: {
    marginTop: 2,
    marginRight: 12,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    textAlign: 'left',
    color: theme.colors.sectionHeader,    
  },

  segementContainer: {
    height: 32,
    width: DEVICE_WIDTH - 32,
    marginLeft: 16,
    marginTop: 16,
    marginBottom: 8,
  },
})     


const mapStateToProps = ({ auth, users, chat }, { exclude = [] }) => ({
  data: users
    .users
    .filter(user => auth.user ? user.id !== auth.user.id : true)
    .filter(user => exclude.indexOf(user.id) === -1),
  currentUser: auth.user,
  selected: users.selected,
  connected: chat.connected,  
  loading: chat.loading,
  users: users.users,
})

const mapDispatchToProps = {
  getUsers: usersGet,
  selectUser: usersSelect,
  call: webrtcCall,
  selectCUser: usersChatSelect,
  cancel: dialogCreateCancel,
  createDialog: dialogCreate,
  sendMessage: messageSend,
  joingDialog: dialogJoin,
}

export default connect(mapStateToProps, mapDispatchToProps)(SupportScreen)