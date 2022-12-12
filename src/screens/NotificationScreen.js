import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View, StyleSheet, Platform, Image, Dimensions, TouchableOpacity, Text, SectionList, ActivityIndicator, Alert } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import Notification from '../components/Notification'
import { theme } from '../core/theme'
import AsyncStorage from '@react-native-async-storage/async-storage'
import firestore from '@react-native-firebase/firestore'
import {firebase} from '@react-native-firebase/auth'

import { showError } from '../NotificationService'
import { 
  usersGet,
  usersChatSelect,
  dialogCreate, 
  dialogJoin,
  dialogCreateCancel, 
  messageSend } from '../actionCreators'

const DEVICE_WIDTH = Dimensions.get('window').width

class NotificationScreen extends Component {
  constructor(props) {
    super(props)

    this._unsubscribeFocus = null;
    this._observer = null;

    this.state = {
      isLoading: false,
      notifications: [],
      newNotifications: [],
      oldNotificaitons: [],  
      
      isSelect: false,
      arySelected: [],
      isSelectAll: false
    };
  }

  componentDidMount() {
    this._unsubscribeFocus = this.props.navigation.addListener('foucs', () => {
      this.getNotifications();
    });

    const userID = firebase.auth().currentUser.uid;
    this._observer = firestore().collection('notification').where('receivers', 'array-contains', userID)
    .onSnapshot(querySnapshot => {
      if (querySnapshot.docChanges().length > 0){
        this.getNotifications();
      }      
    });
  }

  componentWillUnmount() {
    var arrayIds = []
    const notifications = this.state.notifications
    notifications.forEach(item => {
      const tmpNotification = item.notification;
      arrayIds.push(tmpNotification.notificationId);
    });
    this.storeNotficationData(arrayIds)
    this.storeNotficationFlag('false');

    this._unsubscribeFocus();
    this._observer();
  }

  getNotifications = () => {
    const userID = firebase.auth().currentUser.uid;

    this.setState({
      isLoading: true,
    });

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/getNotifications', {
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
        return;
      }

      this.setState({
        isLoading: false,
        notifications: responseJson.notifications,
      });     
      
      this.getTarget(responseJson.notifications);
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
      });
      Alert.alert('Network Error', 'Please check your network connection and try again.')
    });
  }

  getTarget = async (notifications) => {
    var tmpOld = [];
    var tmpNew = [];

    var savedData = await this.getSavedNotficationData();

    notifications.forEach(item => {
      const tmpNotification = item.notification;
      if (savedData){
        if(savedData.includes(tmpNotification.notificationId)) {
          tmpOld.push(item)
        } else {
          tmpNew.push(item)
        }        
      } else {
        tmpNew.push(item)
      }
    });

    this.setState({
      oldNotificaitons: tmpOld,
      newNotifications: tmpNew,      
    })
  }

  getSavedNotficationData = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem('read_notification')
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch(e) {
      console.log('Reading Error');
    }
  }

  storeNotficationData = async (value) => {
    try {
      const jsonValue = JSON.stringify(value)
      await AsyncStorage.setItem('read_notification', jsonValue)
    } catch (e) {
      console.log('Saving Error');
    }
  }

  storeNotficationFlag = async (value) => {
    try {
      console.log(value)
      await AsyncStorage.setItem('new_alert', value)
    } catch (e) {
      console.log('Saving Error');
    }
  }

  goBackScreen = () => {
    this.props.route.params.onGoBackFromOptions('false')
    this.props.navigation.goBack()
  }

  selectRow = item => {
    if (item.notification.type == 'survey'){
      var surveyId = item.notification.survey
      var notificationId = item.notification.notificationId
      console.log("Survey ID ===>", surveyId)
      this.props.navigation.navigate('SurveyScreen', {
        surveyId: surveyId,
        notificationId: notificationId
      })
    } else {
      return
    }
  }

  joinRow = item => {
     if (item.notification.type == 'initiated') {
      const request = item.request
      if (request.type == 'Chat' && !(request.status == 'completed' || request.status == 'cancelled') ){
        this.joinHandler(request) 
      } else {
        return
      }
    } else {
      return
    }
  }

  joinHandler = (item) => {   
    const { createDialog, navigation, selected } = this.props

    global.selectedRequest = item
    const dialog = item.dialog   
    global.curUser = item.sender 
    navigation.navigate('Messages', {dialog})
  }

  select = async() => {
    const tmpSelect = !this.state.isSelect
    this.setState({
      isSelect: tmpSelect,
      arySelected: [],
      isSelectAll: false
    })
  }

  selectAll = () => {
    const tmpSelectAll = !this.state.isSelectAll
    var arraySelected = []

    if (tmpSelectAll){
      this.state.notifications.forEach((item) => {
        const notificationId = item.notification.notificationId
        arraySelected.push(notificationId)
      })
    } else {
      arraySelected = []
    }

    this.setState({
      isSelectAll: tmpSelectAll,
      arySelected: arraySelected
    })
  }

  selectedItem = item => {
    const notificationID = item.notification.notificationId
    
    var arraySelected = this.state.arySelected
    if (arraySelected.includes(notificationID)) {
      const index = arraySelected.indexOf(notificationID)
      arraySelected.splice(index, 1);
    } else {
      arraySelected.push(notificationID)
    }
    
    this.setState({arySelected: arraySelected})
  }

  deleteConfirm = async() => {
    const iCount = this.state.arySelected.length
    if (iCount > 0) {
      const title = iCount == 1 ? 'Delete 1 Notification' : 'Delete ' + String(iCount) + ' Notifications' 
      Alert.alert(
        title,
        `You can not redrive the notification once deleted.`,
        [
          {
            text: "Cancel",
            onPress: () => {},
          },
          {
            text: "Delete",
            onPress: () => {
              this.setState({
                isLoading: true
              })

              this.deleteNotifications()              
            },
          },
          
        ],
        { cancelable: false }
      );
    } else {      
      Alert.alert(
        'Warning',
        `Please select notification to delete.`,
        [
          {
            text: "Ok",
            onPress: () => {
            },
          },
        ],
        { cancelable: false }
      );
    }    
  }

  deleteNotifications = async() => {
    const userID = firebase.auth().currentUser.uid;

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/deleteNotifications', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userid: userID,
        notifications: this.state.arySelected,
      }),
    })
    .then((response) => response.json())
    .then((responseJson) => {

      if (responseJson.statusCode !== 200) {
        this.setState({
          isLoading: false,
          isSelect: false
        });
        //alert(responseJson.error);
        return;
      }

      this.setState({
        isLoading: false,
        isSelect: false
      });

      this.getNotifications()
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
        isSelect: false
      });
      Alert.alert('Network Error', 'Please check your network connection and try again.')
    });    
  }

  renderSectionHeader = ({ section }) => (      
    <View style = {styles.sectionView}>
      <Text style={styles.sectionText}>{section.title}</Text>
    </View>
  )

  renderItem = ({item}) => (
    <Notification
      isSelect={this.state.isSelect}
      isInclude={this.state.arySelected.includes(item.notification.notificationId)}
      notification={item}
      onSelected={this.selectedItem}
      onSelectRow={this.selectRow}
      onJoinRow={this.joinRow}
    />
  ) 
  
  render() {
    var NotificationData = [];
    if (this.state.newNotifications.length > 0 ) {
      NotificationData.push({
        title: "New",
        data: this.state.newNotifications,
      })
    }

    if (this.state.oldNotificaitons.length > 0 ) {
      NotificationData.push({
        title: "Earlier",
        data: this.state.oldNotificaitons,
      })
    }

    return (
      <Background>
        <View style = {styles.navigationView}>
          {this.state.isSelect ? 
          <TouchableOpacity onPress={this.deleteConfirm} style={styles.deletecontainer}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity> 
          : <BackButton goBack={this.goBackScreen} />}  

          <PageTitle>Notifications</PageTitle>

          <TouchableOpacity onPress={this.select} style={styles.selectContainer}>
            <Text style={styles.selectText}>{this.state.isSelect ? 'Done' : 'Select'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listView}>
          { this.state.isSelect && this.state.notifications.length > 0 &&
            <View style={styles.selectAllView}>
              <TouchableOpacity onPress={this.selectAll} style={styles.selectAllContainer}>
                <Text style={styles.selectAllText}>{this.state.isSelectAll ? 'Deselect All' : 'Select All'}</Text>
              </TouchableOpacity>
            </View>
          }

          <SectionList
            sections={NotificationData}
            keyExtractor={(item, index) => item + index} 
            renderSectionHeader={this.renderSectionHeader}
            renderItem={this.renderItem}
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
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  deletecontainer: {
    width: 80,
    height: 50,
    position: 'absolute',
    bottom: 0,
    left: 0,  
  },

  selectContainer: {
    width: 80,
    height: 50,
    position: 'absolute',
    bottom: 0,
    right: 16,  
  },

  listView: {
    flex: 1,
    marginTop: 8,    
  },

  selectAllView: {
    width: DEVICE_WIDTH,
    height: 32,
  },

  selectAllContainer: {
    width: 120,
    height: 32,
  },

  selectAllText: {  
    marginLeft: 16,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'left',
    fontFamily: 'Poppins-Medium', 
    color: theme.colors.primary, 
  },

  sectionView: {
    width: DEVICE_WIDTH,
    height: 24,
    backgroundColor: 'white',
  },

  sectionText: {    
    paddingLeft: 16,
    paddingTop: 4,    
    fontSize: 15,
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',      
    color: theme.colors.sectionHeader
  },

  cellView: {
    width: DEVICE_WIDTH,
    minHeight: 102,
    flexDirection: 'row',
    alignItems: 'center',
  },

  cellContentView: {   
    width: DEVICE_WIDTH - 24,
    minHeight: 84,
    marginLeft: 12,
    borderRadius: 14,
    backgroundColor: theme.colors.inputBar,
    flexDirection: 'row',
  },

  imageView: {
    width: 52,
    height: 52,
    marginLeft: 12,
    marginTop:13,
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
    width: 24,
    height: 24,
    borderRadius: 12,
    position: 'absolute',
    right: 0,
    bottom: -2,
  },

  contentView: {
    flex: 1,
    marginLeft: 12,
    marginTop: 14,
    justifyContent: 'flex-start',
  },

  nameText: {
    marginRight: 12,
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium',  
  },

  timeText: {
    marginTop: 3,
    marginBottom: 8,
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'Poppins-Regular', 
    color: theme.colors.sectionHeader, 
  },

  deleteText: {
    marginTop: 19, 
    marginLeft: 16,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'left',
    fontFamily: 'Poppins-Medium', 
    color: theme.colors.redColor, 
  },

  selectText: {
    marginTop: 19,   
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'right',
    fontFamily: 'Poppins-Medium', 
    color: theme.colors.primary, 
  },

  optionView: {
    width: 40,   
    height: 50,
    paddingLeft: 16,     
    alignItems: 'center',
    flexDirection: 'row',
  },

  optionImage:{
    width: 22,
    height: 22,
  },

  iconView: {
    width: 22,
    height: 22,
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
    borderRadius: 11,
  },

  viewMore: {
    width: DEVICE_WIDTH/3,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,

    backgroundColor: theme.colors.primary
  },

  moreText: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'Poppins-Medium', 
    color: 'white', 
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
  selectUser: usersChatSelect,
  cancel: dialogCreateCancel,
  createDialog: dialogCreate,
  sendMessage: messageSend,
  joingDialog: dialogJoin,
}

export default connect(mapStateToProps, mapDispatchToProps)(NotificationScreen)