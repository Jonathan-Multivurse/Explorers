import { connect } from 'react-redux'

import React from 'react'
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ActionSheetIOS
} from 'react-native'

import MessagesList from './List'
import MessageInput from './MessageInput'
import MoreMenu from './MoreMenu'
import { theme } from '../../core/theme'
import { showError } from '../../NotificationService'

import { dialogLeave, dialogEdit } from '../../actionCreators'
import firestore from '@react-native-firebase/firestore'
import REQUEST_DB from '../../api/requestDB'
import NavigationService from '../../NavigationService'

// taken from https://github.com/ptelad/react-native-iphone-x-helper/blob/master/index.js
const isIphoneX = () => {
  const { height, width } = Dimensions.get('window')
  return (
    Platform.OS === 'ios' &&
    !Platform.isPad &&
    !Platform.isTVOS &&
    ((height === 812 || width === 812) || (height === 844 || width === 844) || (height === 896 || width === 896) || (height === 926 || width === 926))
  )
}

const keyboardViewProps = Platform.select({
  ios: {
    behavior: 'padding',
    keyboardVerticalOffset: isIphoneX() ? 20 : 0
  }
})

class Messages extends React.Component {

  constructor(props) {
    super(props)
    this._observer = null;

    this.state = { 
      isLoading: false,
      selectedRequest: global.selectedRequest, 
      groups: []
    }
  }

  // static navigationOptions = ({route, navigation }) => {
  //   // const dialog = navigation.getParam('dialog', {})
  //   // const leaveDialog = navigation.getParam('leaveDialog')

  //   const dialog = route.params.dialog
  //   const leaveDialog = route.params.leaveDialog

  //   const circleText = dialog.name
  //     .split(',')
  //     .filter((str, i) => i < 2 ? str : undefined)
  //     .reduce((res, val) => res + val.trim().charAt(0).toUpperCase(), '')
  //   return {
  //     headerTitle: (
  //       <View style={styles.titleView}>
  //         {dialog.photo ? (
  //           <Image
  //             resizeMode="center"
  //             source={{ uri: dialog.photo }}
  //             style={styles.dialogCircle}
  //             borderRadius={80}
  //           />
  //         ) : (
  //           <View style={[styles.dialogCircle, { backgroundColor: dialog.color }]}>
  //             <Text style={styles.titleText}>{circleText}</Text>
  //           </View>
  //         )}
  //         <Text numberOfLines={1} style={styles.titleText}>
  //           {dialog.name}
  //         </Text>
  //       </View>
  //     ),
  //     headerRight: dialog.type === QB.chat.DIALOG_TYPE.PUBLIC_CHAT ? (
  //       <View style={{ width: 55 }} />
  //     ) : (
  //       <MoreMenu
  //         dialogType={dialog.type}
  //         onInfoPress={() => navigation.navigate('DialogInfo', { dialog })}
  //         onLeavePress={leaveDialog}
  //       />
  //     )
  //   }
  // }

  componentDidMount() {
    const { dialog, navigation } = this.props

    // const { dialog, navigation } = this.props
    // const navParamDialog = navigation.getParam('dialog', {})
    // const navParams = { leaveDialog: this.leaveDialog }

    // const navParamDialog = this.props.route.params.dialog
    // const navParams = {leavedialog: this.leaveDialog}

    // if (dialog && !this.dialogsEqual(dialog, navParamDialog)) {
    //   navParams.dialog = dialog
    // }
    // navigation.setParams(navParams)

    const firstGroups =  [global.selectedRequest.sender.QBId]
    this.setState({groups : firstGroups})
    console.log("occupansIds ===> ", firstGroups)

    this._observer = firestore().collection('request').doc(global.selectedRequest.requestid)
    .onSnapshot({
      error: (e) => console.error(e),
      next: (documentSnapshot) => {
        if ( documentSnapshot.data() !== undefined ) {

          var curGroups = this.state.groups
          console.log("curGroups ===>", )
          var newGroups = []
          if (documentSnapshot.data().sender.QBId ) {
            newGroups.push(documentSnapshot.data().sender.QBId)
          }
          if (documentSnapshot.data().receiver.QBId ) {
            newGroups.push(documentSnapshot.data().receiver.QBId)
          }

          if (documentSnapshot.data().otherReceivers && documentSnapshot.data().otherReceivers.length > 0 ){
            documentSnapshot.data().otherReceivers.forEach(user => {
              newGroups.push(user.QBId)
            })
          }

          // var _curGroups = Object.values(curGroups);
          var deleted = []
          var added = []
          if (curGroups){
            var deleted = curGroups.filter((item)=>(!newGroups.includes(item)));
            var added = newGroups.filter((item)=>(!curGroups.includes(item)));
          }          
          
          console.log("Existing groups ==>", curGroups)
          console.log("New groups ==>", newGroups)
          console.log("Deleted groups ==>", deleted)
          console.log("Added groups ==>", added)

          if (deleted.length > 0 || added.length > 0) {
            this.onEidtDialogHandler(deleted, added) 
          }          

          if ( documentSnapshot.data().status === 'accepted') {            
            const updatedData = documentSnapshot.data()
            global.selectedRequest = updatedData
            this.setState({selectedRequest: updatedData})
          } else if (documentSnapshot.data().status === 'addedColleague') {
            const updatedData = documentSnapshot.data()
            global.selectedRequest = updatedData
            this.setState({selectedRequest: updatedData})
          } 
        }        
      }
    })  
  }

  componentWillUnmount() {
    this._observer();
  }

  // shouldComponentUpdate(nextProps) {
  //   const { dialog } = this.props
  //   if (dialog && nextProps.dialog) {
  //     if (!this.dialogsEqual(dialog, nextProps.dialog)) {
  //       nextProps.navigation.setParams({ dialog: nextProps.dialog })
  //       return true
  //     }
  //   }
  //   return false
  // }

  onEidtDialogHandler = (deleted, added) => {
    const { dialog, editDialog } = this.props
    
    new Promise((resolve, reject) => {
      editDialog({ dialogId: dialog.id, addUsers: added, removeUsers: deleted, resolve, reject })
    })
    .then(action => {
      console.log("Updated Dialog Successfullly =====>", action.payload.occupantsIds)
      const newGroups = action.payload.occupantsIds
      this.setState({groups: newGroups})
    })
    .catch(action => console.log('Failed to join dialog', action.error))
    // .catch(action => showError('Failed to join dialog', action.error))
  }

  dialogsEqual = (dialog1, dialog2) => {
    if ((dialog1 && !dialog2) || (!dialog1 && dialog2)) {
      return false
    }
    const idsEqual = dialog1.id === dialog2.id
    let occupantsEqual = true
    if (dialog1.occupantsIds && dialog2.occupantsIds) {
        if (dialog1.occupantsIds.length === dialog2.occupantsIds.length) {
          occupantsEqual = dialog1.occupantsIds.every(userId =>
            dialog2.occupantsIds.indexOf(userId) > -1
          )
        } else {
          occupantsEqual = false
        }
    }
    const nameEqual = dialog1.name === dialog2.name
    const lastMessageEqual = dialog1.lastMessage === dialog2.lastMessage
    return idsEqual && nameEqual && lastMessageEqual && occupantsEqual
  }

  leaveDialog = () => {
    const { dialog, navigation, leaveDialog } = this.props
    new Promise((resolve, reject) => {
      leaveDialog({ dialogId: dialog.id, resolve, reject })
    })
    .then(() => {
      if (this.state.selectedRequest.status == 'pending'){
        global.isFromCall = false
        REQUEST_DB.cancelRequest(this.state.selectedRequest.requestid, this.onComplete)
      } else {
        global.isFromCall = true
        REQUEST_DB.completeRequest(this.state.selectedRequest.requestid, this.onComplete)
      }

      this._observer();
      NavigationService.navigate('Dashboard', {})
     })
    .catch(action => showError('Failed to leave dialog', action.error))
  }

  leaveDialogWithout = () => {
    global.isFromCall = false
    this._observer();
    if ( this.state.selectedRequest.status === 'accepted' || this.state.selectedRequest.status === 'addedColleague') {
      NavigationService.navigate('Dashboard', {})
    } else {
      REQUEST_DB.cancelRequest(this.state.selectedRequest.requestid, this.onComplete)
      NavigationService.navigate('Dashboard', {})
    }    
  }

  onComplete = async () => {
  }

  showActionSheet = () => {
    Alert.alert(
      "End support session",
      "Are you sure for ending this support session?",
      [
        {
          text: "Cancel",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel"
        },
        { 
          text: "End", 
          onPress: () => this.leaveDialog() 
        }
      ],
      {cancelable: false},
    )
  }

  render() {
    const { dialog, navigation } = this.props
    const { id } = dialog ? dialog : this.props.route.params.dialog
    return (
      <KeyboardAvoidingView
        {...keyboardViewProps}
        style={{ flex: 1, backgroundColor: 'white' }}
      >
        <SafeAreaView
          forceInset={{ top: 'always', bottom: 'always' }}
          style={styles.safeArea}
        >
          <View style = {styles.navigationView}>
            {/* <TouchableOpacity style={styles.backButton} onPress={this.showActionSheet} > */}
            <TouchableOpacity style={styles.backButton} onPress={this.leaveDialogWithout} >
              <Image
                style={styles.backImage}
                source={require('../../assets/images/login/arrow_back.png')}
              />
            </TouchableOpacity>
            <Text style={styles.nameText}>{ this.state.selectedRequest.receiver === '' ? "Chat Support" : this.state.selectedRequest.receiver.firstname + " " + this.state.selectedRequest.receiver.lastname }</Text>
            <View style={{flex: 1}}/>
            <TouchableOpacity style={styles.rightButton} onPress={this.showActionSheet} >
              <Image
                style={styles.rightImage}
                source={require('../../assets/images/message/icon_red_close.png')}
              />
            </TouchableOpacity>
          </View>
          <MessagesList dialogId={id} />
          <MessageInput dialogId={id} />
          {/* <ActionSheet
            ref={o => this.ActionSheet = o}
            options={['End support session', 'Cancel']}
            cancelButtonIndex={1}
            destructiveButtonIndex={1}
            onPress={(index) => {   
              if (index == 0){
                this.leaveDialog()
              }          
            }}
          /> */}
        </SafeAreaView>

        {this.state.isLoading ? (
            <ActivityIndicator
            color={theme.colors.primary}
            size="large"
            style={styles.preloader}
            />
        ) : null}
        
      </KeyboardAvoidingView>
    )
  }
}

const styles = StyleSheet.create({
  navigationView: {
    width: '100%',
    height: 73,
    alignSelf: 'center',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    backgroundColor: 'white',

    shadowColor: theme.colors.shadow,
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 8, 
  },  

  preloader: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    position: 'absolute',
  },

  backButton: {
    width: 50,
    height: 50,
    marginLeft: 0,
    marginBottom: 13,
    paddingBottom: 8,
    paddingLeft: 16,
    justifyContent: 'flex-end',
  },
  
  backImage: {
    width: 12,
    height: 20.5,
  },

  nameText: {
    marginBottom: 17,
    fontSize: 17,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',  
    fontWeight: '600'
  },

  rightButton: {
    width: 40,
    height: 40,
    marginRight: 8,
    marginBottom: 8,
    paddingBottom: 6,
    paddingLeft: 6,
    justifyContent: 'flex-end',
  },
  
  rightImage: {
    width: 28,
    height: 28,
  },

  titleView: {
    alignItems: 'center',
    alignSelf: 'center',
    justifyContent: 'center',
    width: '100%',
    flexDirection: 'row',
    paddingHorizontal: 25,
  },

  titleText: {
    color: theme.colors.white,
    fontSize: 17,
    fontWeight: 'bold',
    lineHeight: 20,
    fontSize: 16,
    fontWeight: 'normal',
  },

  dialogCircle: {
    alignItems: 'center',
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    marginRight: 10,
    width: 28,
  },

  safeArea: {
    backgroundColor: 'white',
    flex: 1,
    width: '100%',
  },

  titleSmallText: {
    color: theme.colors.white,
    fontSize: 13,
    lineHeight: 15,
    opacity: 0.6,
  },

  headerButton: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },

  headerButtonText: {
    color: theme.colors.white,
    fontSize: 17,
    lineHeight: 20,
  },
})

const mapStateToProps = ({ dialogs: { dialogs = [] } }, {route, navigation }) => {
  const navParamDialog =  route.params.dialog
  const dialog = navParamDialog ?
    dialogs.find(d => d.id === navParamDialog.id) :
    undefined
  return { dialog }
}

const mapDispatchToProps = { leaveDialog: dialogLeave, editDialog: dialogEdit }

export default connect(mapStateToProps, mapDispatchToProps)(Messages)