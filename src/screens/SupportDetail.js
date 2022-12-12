import React, { Component } from 'react'
import { View, StyleSheet, Image, Dimensions, TouchableOpacity, Platform, TextInput, Text, Alert, ScrollView, ActivityIndicator, Modal, Keyboard } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import { theme } from '../core/theme'
import REQUEST_DB from '../api/requestDB'
import USER_DB from '../api/userDB'
import moment from 'moment'
import {firebase} from "@react-native-firebase/auth"
import firestore from '@react-native-firebase/firestore'
import { Rating } from 'react-native-ratings'

const DEVICE_WIDTH = Dimensions.get('window').width
const DEVICE_HEIGHT = Dimensions.get('window').height;

export default class SupportDetail extends Component {
  constructor(props) {
    super(props)
    USER_DB.getRating( this.props.route.params.request.receiver.userid, this.onUserRating)

    this.state = { 
      isLoading: false,
      request: this.props.route.params.request,
      star: 0.1,
      review: '',

      modalVisible: false,
      stars: 0,
      comment: '',
      keyboardHeight: 0,
    }     
  }

  onEdit = (visible) => {
    this.setState({ modalVisible: visible });             
  }

  componentDidMount() {   
    if ( this.props.route.params.receiver == '' ){
      this.setState({receiver: null})      
    } else {
      this.setState({receiver: this.props.route.params.receiver})   
    }   

    Keyboard.addListener(
        'keyboardWillShow',
        this._keyboardDidShow,
    );
  
    Keyboard.addListener(
        'keyboardWillHide',
        this._keyboardDidHide,
    );
  }

_keyboardDidShow = (event)=> {
    if(Platform.OS === 'ios') {
      this.setState({
        keyboardHeight: event.endCoordinates.height
      })
    }
}

_keyboardDidHide = (event)=> {
    if(Platform.OS === 'ios') {
      this.setState({
        keyboardHeight: 0
      })
    }
}  

onUserRating = (rating) => {
    var star = 0
    var review = ''

    if (rating && rating.rating && rating.rating.length > 0){
      const index = rating.rating.findIndex(item => item.requestId === this.state.request.requestid)
      console.log("Rating Index", index)
      if (index > -1){
        star = rating.rating[index].star  
        review = rating.rating[index].review
      }             
    }
    this.setState({
      star: star,
      review: review
    })
} 

onUserCancel = () => {
    global.isFromCall = false
    this.props.navigation.navigate('Dashboard')
}

onReviewRequest = () => {
  this.setState({
    modalVisible: true,
    comment: '',
    stars: 0,
  })
}

ratingCompleted = (rating) => {
    this.setState({
      stars: rating
    });
}

onRatingDone = () => {
    this.setState({
      isLoading: true,
    })    

    const userID = firebase.auth().currentUser.uid;

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/writeRating', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userid: userID,
        receiverid: this.state.request.receiver.userid,
        comment: this.state.comment,
        rating: this.state.stars,
        requestid: this.state.request.requestid
      }),
    })
    .then((response) => response.json())
    .then((responseJson) => {
      

      this.setState({
        isLoading: false,
        modalVisible: false,
        star: this.state.stars,
        review: this.state.comment        
      }) 

      if (responseJson.statusCode !== 200) {
        return;
      }      
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
      });
      Alert.alert('Network Error', 'Please check your network connection and try again.')
    });
  }


render() {
    return (
      <Background>
          <Modal
          animationType="fade"
          transparent={true}
          visible={this.state.modalVisible}
          onRequestClose={() => {
            this.onEdit(false)
          }}
        >
          <View style={styles.centeredView}>   
            
            <View style={{flex: 1}}/>
            <View style = {styles.modalView}>
              <ScrollView>                           
                <View style={styles.titleView}>
                  <View style={{flex: 1}}/>
                  <Text style={styles.editPText}>Rating {"&"} Review</Text>
                  <View style={{flex: 1}}/>
                  <TouchableOpacity onPress={() => this.onEdit(false) } style={styles.closeButton} >
                    <Image  style={styles.coloseImage} source={require('../assets/images/account/icon_close.png')} />
                  </TouchableOpacity>
                </View>   

                <View style={styles.profileImageView1} >
                    <Image style={styles.profileImage1} source={{uri: this.state.request.receiver.image}}/>                 
                </View>

                <Text style={styles.helpText}>Help {this.state.request.receiver.firstname} improve!</Text> 
                <Text style={styles.overallText}>Overall Experience</Text> 
                <Rating
                  type='custom'
                  startingValue={0}
                  showRating={false}
                  onFinishRating={this.ratingCompleted}
                  imageSize={44}
                  style={{ paddingVertical: 5 }}
                />
                <Text style={styles.commentText}>Comment</Text>
                <TextInput
                  style={styles.emailInput}
                  multiline={true}
                  value={this.state.comment}
                  onChangeText={ (text) => this.setState({comment: text}) }
                  autoCapitalize="none"
                  autoCompleteType="name"
                  textContentType="name"
                />                        

                <TouchableOpacity style={{...styles.loginButton, marginBottom: this.state.keyboardHeight + 57}} onPress={() => this.onRatingDone()}>
                  <Text style={styles.loginText}>Done</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View> 
        </Modal>


        <View style = {styles.navigationView}>
          <TouchableOpacity onPress={() => this.onUserCancel()} style={styles.backButton}>
            <Image
              style={styles.backImage}
              source={require('../assets/images/login/arrow_back.png')}
            />
          </TouchableOpacity>
          <Text style={styles.titleText}>{this.state.request.receiver.firstname + " " + this.state.request.receiver.lastname}</Text>
        </View>

        <ScrollView 
        style={{...styles.contentView2, marginBottom: this.state.star == 0 ? 120 : 0}} 
        showsVerticalScrollIndicator={false} >

            <View style = {styles.logoView}>
                <View style={{flex: 3}} />
                <View style={styles.profileImageView} >
                    <Image style={styles.profileImage} source={{uri: this.state.request.receiver.image}}/>
                    <View style={{...styles.statusView, backgroundColor: this.state.request.receiver.status == 'offline' ? theme.colors.lightGray : theme.colors.greenColor }}/>
                </View>
                <Text style={styles.melisaText}>{this.state.request.receiver.firstname + " " + this.state.request.receiver.lastname}</Text>
                <View style={{flex: 1}} />
                <View style={styles.borderLine} />
            </View> 

            <View style={styles.contentView}>
                <Text style={styles.selectText}>Description</Text>
                <Text style={styles.contentText}>{this.state.request.description}</Text> 

                <Text style={styles.selectText}>Simulator</Text>
                <Text style={styles.contentText}>{this.state.request.simulator}</Text>

                <Text style={styles.selectText}>Support type</Text>            
                <View style={styles.cellSelectedContentView}>
                    <Image style={styles.callImage} source={ this.state.request.type == 'Call' ? require('../assets/images/request/icon_call.png') : this.state.request.type == 'Video' ? require('../assets/images/request/icon_video.png') : require('../assets/images/request/icon_chat.png')}  />
                    <Text style={styles.callText}>{this.state.request.type}</Text>               
                </View>

                <Text style={styles.selectText}>{"Rating & Review"}</Text>  

                <View style={styles.ratingView}>
                  <View style={styles.starView}>
                    <Image style={styles.starImage} source={this.state.star >= 0.5 ? require('../assets/images/account/icon_star.png') : require('../assets/images/account/icon_star_0.png')}/>
                  </View>            
                  <View style={styles.starView}>
                    <Image style={styles.starImage} source={this.state.star >= 1.5 ? require('../assets/images/account/icon_star.png') : require('../assets/images/account/icon_star_0.png')}/>
                  </View> 
                  <View style={styles.starView}>
                    <Image style={styles.starImage} source={this.state.star >= 2.5 ? require('../assets/images/account/icon_star.png') : require('../assets/images/account/icon_star_0.png')}/>
                  </View>
                  <View style={styles.starView}>
                    <Image style={styles.starImage} source={this.state.star >= 3.5 ? require('../assets/images/account/icon_star.png') : require('../assets/images/account/icon_star_0.png')}/>
                  </View>
                  <View style={styles.starView}>
                    <Image style={styles.starImage} source={this.state.star >= 4.5 ? require('../assets/images/account/icon_star.png') : require('../assets/images/account/icon_star_0.png')}/>
                  </View>
                </View>

                <Text style={{...styles.contentText, marginTop: -20, marginBottom: 44}}>{this.state.review}</Text>
            </View>
        </ScrollView>

        <View style ={this.state.star == 0 ? styles.bottomView1 : styles.bottomView2}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => this.onReviewRequest()} >
            <Text style={styles.cancelText}>{"Rating & Review"}</Text>
          </TouchableOpacity>
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
    height: 60 + getStatusBarHeight(),
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    marginBottom: 8,    

    shadowColor: theme.colors.shadow,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
  },     

  contentView1: {
    width: '100%',
    flex: 1,
    marginBottom: 190,    
    backgroundColor: theme.colors.inputBar
  }, 

  contentView2: {
    width: '100%',
    flex: 1,    
    backgroundColor: theme.colors.inputBar
  }, 

  logoView: {
    width: DEVICE_WIDTH,
    height: DEVICE_HEIGHT * 0.4,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: theme.colors.inputBar
  },

  logoImage: {
    width: DEVICE_WIDTH - 160,
    height: DEVICE_WIDTH - 160,
    resizeMode: 'contain',
  },

  profileImageView :{
    width: DEVICE_WIDTH - 180,
    width: DEVICE_WIDTH - 180,

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  profileImage: {
    width: DEVICE_WIDTH - 180,
    height: DEVICE_WIDTH - 180,
    borderRadius: (DEVICE_WIDTH - 180) / 2,
    borderWidth: 4,
    borderColor: '#fff',
  },

  nameText: {
    height: 33,
    marginTop: 15,
    fontSize: 20,
    lineHeight: 30,
    fontFamily: 'Poppins-SemiBold',
  },

  melisaText: {    
    marginHorizontal: 24,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 20,
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'Poppins-SemiBold',      
  },

  contentView: {
    width: '100%',
    flex: 1,
    alignSelf: 'center',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },

  meetingText: {
    marginTop: 16,
    marginLeft: 16,
    fontSize: 15,
    lineHeight: 23,
    fontFamily: 'Poppins-Regular',   
    color: theme.colors.lightGray,       
  },

  rightButton: {
    position: 'absolute',
    height: 40,
    top: 17,
    right: 32,
  },

  rightText: {
    fontSize: 15,
    lineHeight: 23,
    fontFamily: 'Poppins-Medium',  
    textAlign: 'right',
    color: theme.colors.primary,
  },

  supportView: {
    height: 42,
    marginTop: 16,
    marginLeft: 16,
    alignItems: 'center',
    flexDirection: 'row',
  },

  iconView: {
    height: 42,
    width: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: theme.colors.supportBorder,   
    alignItems: 'center',
    justifyContent: 'center', 
  },

  iconImage: {
    height: 26,
    width: 26,      
  },

  statusView: {
    width: 40,
    height: 40,
    position: 'absolute',
    right: 14,
    bottom: 12,
    borderColor: 'white',
    borderRadius: 20,
    borderWidth: 3,
    backgroundColor: 'red'    
  },

  iconHomeImage: {
    height: 24,
    width: 24,   
    marginRight: 10   
  },

  borderLine: {
    width: DEVICE_WIDTH - 32,
    marginTop: 12,
    borderBottomColor: theme.colors.inputBorder, 
    borderBottomWidth: 1, 
  },

  cellText: {
    marginTop: 3.5,
    marginLeft: 12,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',  
  },

  contentText: {
    width: DEVICE_WIDTH - 32,
    marginTop: 8,
    marginRight: 16,
    marginLeft: 16,
    textAlign: 'left',
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Poppins-Regular',  
  },

  cancelButton: {
    width: DEVICE_WIDTH - 64,
    height: 57, 
    marginLeft: 32,
    marginTop: 16, 
    marginBottom: 47,   
    borderRadius: 28.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: theme.colors.primary,
    borderWidth: 2,    
  }, 

  cancelText: {    
    fontSize: 18,
    lineHeight: 25,    
    fontFamily: 'Poppins-Medium',
    color: theme.colors.primary,
  },

  scheduleButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginTop: 16,    
    borderRadius: 28.5,
    backgroundColor: theme.colors.lightYellow,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    flexDirection: 'row',

    shadowColor: theme.colors.shadow,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 11 },
    shadowOpacity: 1,
  },

  scheduleButtonText: {
      fontSize: 18,
      lineHeight: 25,    
      fontFamily: 'Poppins-Medium',
      color: 'white',
  },

  bottomView2: {
    position: 'absolute', 
    width: DEVICE_WIDTH, 
    height: 0, 
    bottom: 0, 
    backgroundColor: 'white',
    borderTopColor: theme.colors.inputBar,
    borderTopWidth: 2,
  },

  bottomView1: {
    position: 'absolute', 
    width: DEVICE_WIDTH, 
    height: 120, 
    bottom: 0, 
    backgroundColor: 'white',
    borderTopColor: theme.colors.inputBar,
    borderTopWidth: 2,
  },

  backButton: {
    position: 'absolute',
    width: 50,
    height: 50,
    bottom: 8,
    left: 0,
    paddingBottom: 8,
    paddingLeft: 16,
    justifyContent: 'flex-end',
  },
  
  backImage: {
    width: 12,
    height: 20.5,
  },

  titleText: {
    height: 28,
    position: 'absolute',
    left: 54,    
    bottom: 8,
    fontSize: 20,
    lineHeight: 22,
    fontFamily: 'Poppins-Medium',    
    fontWeight: '500'
  },

    selectText:{
        marginTop: 24,
        paddingLeft: 16,
        fontSize: 17,
        lineHeight: 26,
        fontFamily: 'Poppins-Medium', 
        alignSelf: 'flex-start',
    },

    cellSelectedContentView: {
        height: 42,
        width: (DEVICE_WIDTH - 24 - 24)/3,
        marginLeft: 16,
        marginRight: 4,
        marginVertical: 8,
        paddingTop: 2,
        borderRadius: 21,    
        alignSelf: 'flex-start', 

        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        flexDirection: 'row',

        shadowColor: theme.colors.shadow,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
    },

    callImage: {
        width: 24,
        height: 24,        
        resizeMode: 'stretch'
    },

    callText: {
        marginLeft: 4,
        fontSize: 16,
        lineHeight: 22,
        fontFamily: 'Poppins-Regular', 
    },

    ratingView: {
        height: 29,
        marginTop: 12,
        marginBottom: 32,
        marginLeft: 12,    
        flexDirection: 'row',
    },
    
    starView : {
        width: 29,
        height: 29,    
        marginRight: 4,
    },
    
    starImage: {
        position: 'absolute',
        left: -30,
        top: -16,
        width: 89,
        height: 88,
    },

    centeredView: {
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
        backgroundColor: theme.colors.shadow
    },
    
    modalView: {    
        width: DEVICE_WIDTH,
        borderTopRightRadius: 10,
        borderTopLeftRadius: 10,
        alignItems: "center",   
        backgroundColor: "white", 
    
        marginBottom: 0,
    },
    
    titleView : {    
        flexDirection: 'row',
    },
      
    editPText: {
        marginTop: 24,
        fontSize: 17,
        lineHeight: 22,
        fontFamily: 'Poppins-Medium',
    },
    
    coloseImage: {
        position: 'absolute',
        top: 8,
        right: 9,
        width: 44,
        height: 44,
    },  
    
    profileImageView1 :{
        marginTop: 32,
        width: DEVICE_WIDTH - 200,
        width: DEVICE_WIDTH - 200,
        alignSelf: 'center',
    
        shadowColor: theme.colors.shadow,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 11 },
        shadowOpacity: 1,
    },
    
    profileImage1: {
        width: DEVICE_WIDTH - 200,
        height: DEVICE_WIDTH - 200,
        borderRadius: (DEVICE_WIDTH - 200) / 2,
        borderWidth: 3,
        borderColor: '#fff', 
    },
    
    helpText: {
        width: DEVICE_WIDTH,
        marginTop: 9,
        marginBottom: 16,
        alignSelf: 'center',
        textAlign: 'center',
        fontSize: 24,
        lineHeight: 35,
        fontFamily: 'Poppins-SemiBold',
    },
    
    emailInput: {
        width: DEVICE_WIDTH - 32,
        marginLeft: 16,
        height: 88,
        borderRadius: 10,
        backgroundColor: '#F2F2F2',
        paddingLeft: 12,
        paddingTop: 12,
    
        fontSize: 14,
        lineHeight: 21,
        fontFamily: 'Poppins-Regular',
    },
    
    overallText: {
        width: DEVICE_WIDTH,
        marginBottom: 7,
        alignSelf: 'center',
        textAlign: 'center',
        fontSize: 17,
        lineHeight: 22,
        fontFamily: 'Poppins-Medium',
        color: theme.colors.lightGray
    },
    
    commentText: {
        marginLeft: 16,
        marginTop: 16,
        marginBottom: 7,
        alignSelf: 'flex-start',
        fontSize: 14,
        lineHeight: 21,
        fontFamily: 'Poppins-Medium',
    },

    closeButton: {
        width: 60, 
        height: 60, 
        position: 'absolute',
        right: 10,
        top: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },

    loginButton: { 
        width: DEVICE_WIDTH - 48,
        marginLeft: 24,
        height: 57,
        marginTop: 20,
        marginBottom: 57,
        borderRadius: 28.5,
        backgroundColor: theme.colors.lightYellow,
        alignItems: 'center',
        justifyContent: 'center',
    
        shadowColor: theme.colors.shadow,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 11 },
        shadowOpacity: 1,
    },
    
    loginText: {
        fontSize: 18,
        lineHeight: 25,
        color: 'white',
        fontFamily: 'Poppins-Medium',
    }
})