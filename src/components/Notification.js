import React from 'react'
import { Text, View, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native'
import { isEnabled } from 'react-native/Libraries/Performance/Systrace'
import { theme } from '../core/theme'

const DEVICE_WIDTH = Dimensions.get('window').width

GetTypeIcon = ({type}) => {
    var activeurl = ''
  
    if (type == 'submitting'){
      activeurl = require('../assets/images/notification/iconSubmitting.png')
    } else if (type == 'submitted'){
      activeurl = require('../assets/images/notification/iconSubmitted.png')
    } else if (type == 'accepted' || type == 'allowedFacility' ){
      activeurl = require('../assets/images/notification/iconAccepted.png')
    } else if ((type == 'end') || (type == 'endedCall')){
      activeurl = require('../assets/images/notification/iconEnd.png')
    } else if (type == 'endedChat'){
      activeurl = require('../assets/images/notification/iconMessage.png')
    } else if (type == 'reminder'){
      activeurl = require('../assets/images/notification/iconReminder.png')
    } else if (type == 'cancelled' || type == 'declinedFacility') {
      activeurl = require('../assets/images/notification/iconCancel.png')
    } else if (type == 'survey') {
      activeurl = require('../assets/images/notification/iconSurvey.png')
    } else if (type == 'ratingAsked' || type == 'initiated' ) {
      activeurl = require('../assets/images/notification/iconNReceived.png')
    } else {
      activeurl = require('../assets/images/notification/iconEnd.png')
    }
  
    return (
      <Image source={activeurl} style={styles.iconImage} />
    )
}
  
getTimeagao = (mSeconds) =>{
    var deffTime = '';
    const diff = new Date().getTime() - mSeconds;
    if (diff < 60*60*1000) {
      deffTime = Math.floor( diff/(60*1000) ) + " mins ago";
    } else if (diff < 2*60*60*1000 ){
      deffTime = "1 hour ago";
    } else if(diff < 24*60*60*1000) {
      deffTime = Math.floor( diff/(60 * 60 * 1000) ) + " hours ago";
    } else if (diff < 2*24*60*60*1000 ){
      deffTime = "1 day ago";
    } else {
      deffTime = Math.floor( diff/(24 * 60 * 60 * 1000) ) + " days ago";
    }
    return deffTime;
}

export default class Notification extends React.PureComponent {
  constructor(props) {
    super(props)   
  }

  render() {
    const {isSelect, isInclude, notification} = this.props

    return (
      <View style={styles.cellView}>
        {isSelect
          ? <TouchableOpacity onPress={() => this.props.onSelected(notification)} style={styles.optionView} >
            {isInclude
              ? (<Image source={require('../assets/images/request/icon_option.png')} style={styles.optionImage}/>)
              : (<View style={styles.iconView} />)
            }
            </TouchableOpacity> 
          : <View/>
        }

        <TouchableOpacity onPress={() => this.props.onSelectRow(notification)} style={styles.cellContentView}>
          <View style={styles.imageView}>
            {notification.sender.image
            ? <Image source={{uri : notification.sender.image}} style={styles.profileImage}/> 
            : <Image source={require('../assets/images/notification/iconUser.png')} style={styles.profileImage}/>
            }
            <GetTypeIcon type={notification.notification.type} />  
          </View>

          <View style={styles.contentView}>
              <Text style={styles.nameText}>{notification.notification.message}</Text>  
              <View style={{flex: 1}} />                  
              <Text style={styles.timeText}>{getTimeagao(notification.notification.time)}</Text>

              {notification.notification.type === 'initiated' && !(notification.request.status === 'cancelled' || notification.request.status === 'completed')
                ? <TouchableOpacity onPress={() => this.props.onJoinRow(notification)} style={styles.viewMore}>
                    <Text style={styles.moreText}>Join</Text>
                  </TouchableOpacity> 
                : <View/>
              }
          </View>                  
        </TouchableOpacity>
      </View>
    )
  }

}

const styles = StyleSheet.create({

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