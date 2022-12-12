import React from 'react'
import { Text, View, StyleSheet, Image, TouchableWithoutFeedback, Dimensions } from 'react-native'
import { theme } from '../core/theme'
import moment from 'moment'

const DEVICE_WIDTH = Dimensions.get('window').width

export default class SupportItem extends React.PureComponent {
  constructor(props) {
    super(props)   
  }

  render() {
    const {support, status} = this.props

    return (
      <TouchableWithoutFeedback style={styles.cellView} onPress={() => this.props.onSelectRow(support)}>
        <View style={styles.cellContentView}>
          <View style = {styles.imageView}>
            { support.receiver.image == null
              ?<Image source={require('../assets/images/notification/iconUser.png')} style={styles.profileImage} />
              :<Image source={{uri : support.receiver.image}} style={styles.profileImage}/> 
            } 
            { status == 2 || support.receiver.image == null
             ? null 
             : <Image source= { support.receiver.status == 'offline' ? require('../assets/images/support/status_offline.png') : require('../assets/images/support/status_online.png')} style={styles.iconImage} /> 
            }    
          </View>

          <View style={styles.contentView}>
            <View style={styles.nameView}>
              <Text style={styles.nameText}>{support.status == 'pending' ? 'Pending' : support.receiver.firstname + " " + support.receiver.lastname}</Text>
              <View  style={{flex: 1}}/>
              <Text style={styles.timeText}>{support.isSchedule === true ? '' : support.status == 'completed' ? moment(support.time).format('MMM D, YYYY') : moment(support.time).format('h:mm A')}</Text>
            </View>

            <View style={styles.sessionView}>
              <Image style={styles.callImage} source={ support.type == 'Call' 
                ? require('../assets/images/request/icon_call.png') 
                : support.type == 'Video' 
                ? require('../assets/images/request/icon_video.png') 
                : require('../assets/images/request/icon_chat.png')}  
              />
              <Text style={styles.contentText}>{support.isSchedule === true ? 'At ' + moment(support.scheduleTime).format('h:mm A on MMM D, YYYY.') : support.status == 'completed' ? 'Session closed' : 'Active' }</Text>
            </View>
            
            <View style={{flex:1}} />

          </View>
        </View>
      </TouchableWithoutFeedback> 
    )
  }

}

const styles = StyleSheet.create({
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
    flexDirection: 'row',
    marginTop: 4,
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
})  