import React, { Component } from 'react'
import { StyleSheet, View, Platform, TouchableOpacity, Text, SectionList, Dimensions, ActivityIndicator, Alert } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import PageTitle from '../components/PageTitle'
import { theme } from '../core/theme'
import {firebase} from "@react-native-firebase/auth"

const DEVICE_WIDTH = Dimensions.get('window').width;
const DEVICE_HEIGHT = Dimensions.get('window').height;

export default class Facility extends Component {
  constructor(props) {
    super(props)
    this._unsubscribeFocus = null;  
    
    this.state = { 
      isLoading: false,  
      facilityIds: [],  
      currentfacilities: [],
      requestFacilities: [],      
    }
  }

  componentDidMount() {      
    this._unsubscribeFocus = this.props.navigation.addListener('focus', () => {
      this.onGetUserFacility();      
    });
  }

  componentWillUnmount() {    
    this._unsubscribeFocus();
  } 

  onGetUserFacility = () => {
    const userID = firebase.auth().currentUser.uid;

    this.setState({
      isLoading: true,
    });

    fetch('https://us-central1-melisa-app-81da5.cloudfunctions.net/getFacilities', {
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

      this.setState({
        isLoading: false,
        facilityIds: responseJson.facilityIds,  
        currentfacilities: responseJson.facilities,
        requestFacilities: responseJson.requestFacilities, 
      });     
    })
    .catch((err) => {        
      this.setState({
        isLoading: false,
      });
      Alert.alert('Network Error', 'Please check your network connection and try again.')
    });
  }

  getFacilties = (items) => {
    this.setState({
      isLoading: false,
      facilities: items
    })
  }

  onChangePressed = () => {
    // this.props.navigation.navigate('FacilityCode', {
    //   isFromRegister: false,
    //   onGoBackFromOptions: (item) => this._onGoBackFromOptions(item)
    // })  

    this.props.navigation.navigate('FacilityScreen', {
      isFromRegister: false,
      currentFacilityIds: this.state.facilityIds
    }) 
  }

  _onGoBackFromOptions = (item) => {
    this.setState({
      facilityId: item.facilityid,
      facilityName: item.title,    
    })
}

  sentDone = () => {
    this.setState({
      isLoading: false,
      email: '', 
      emailError: '',
    })
    this.props.navigation.goBack()
  }
  
  render() {

    var facilityData = [];
    if (this.state.currentfacilities.length > 0 ) {
      this.state.currentfacilities.forEach(facilityItem =>
        {
          const facilityID = facilityItem.facility.facilityid

          var tmpIndex = -1
          facilityData.forEach((element, index) => {
            const elementFId = element.facility.facilityid
            if(elementFId == facilityID) {
              tmpIndex = index
            }            
          })

          if (tmpIndex > -1) {
            var tmpFacility = facilityData[tmpIndex]
            var tmpFacilityData = tmpFacility.data
            tmpFacilityData.push({branch: facilityItem.branch, requestFlag: false})
            tmpFacility.data = tmpFacilityData

            facilityData.splice(tmpIndex, 1)
            facilityData.splice(tmpIndex, 0, tmpFacility);

          } else {
            const branchData = []
            branchData.push({branch: facilityItem.branch, requestFlag: false})
            facilityData.push({
              facility: facilityItem.facility,
              data: branchData,
            })
          }
        }
      )
    }  

    if (this.state.requestFacilities.length > 0 ) {
      this.state.requestFacilities.forEach(facilityItem =>
        {
          const facilityID = facilityItem.facility.facilityid

          var tmpIndex = -1
          facilityData.forEach((element, index) => {
            const elementFId = element.facility.facilityid
            if(elementFId == facilityID) {
              tmpIndex = index
            }            
          })

          if (tmpIndex > -1) {
            var tmpFacility = facilityData[tmpIndex]
            var tmpFacilityData = tmpFacility.data
            tmpFacilityData.push({branch: facilityItem.branch, requestFlag: true})
            tmpFacility.data = tmpFacilityData

            facilityData.splice(tmpIndex, 1)
            facilityData.splice(tmpIndex, 0, tmpFacility)
          } else {
            const branchData = []
            branchData.push({branch: facilityItem.branch, requestFlag: true})
            facilityData.push({
              facility: facilityItem.facility,
              data: branchData,
            })
          }
        }
      )
    }  

    return (
      <Background>

        <View style = {styles.navigationView}>
          <BackButton goBack={() => this.props.navigation.goBack()} />
          <PageTitle>Facilities</PageTitle>
        </View>

        <View style = {styles.contentView}> 
          {/* <FlatList
            data={facilities}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item, index}) => (              
              
              <View style={styles.cellView}>         
                <Text style={styles.facilityText}>{item.facility.title}</Text>   

                {index < this.state.currentfacilities.length ?
                  <View style={styles.branchView}>         
                    <Text style={styles.branchText}>{item.branch}</Text>   
                  </View>  
                :<View style={styles.branchView}>         
                  <Text style={styles.branchText}>{item.branch}</Text>  
                  <View style={{flex: 1}}/>
                  <Text style={styles.requestText}>Request sent</Text>   
                </View> 
               }
              </View>    
   
            )}
          />  */}
         <SectionList
            sections={facilityData}
            keyExtractor={(item, index) => item + index}
            renderSectionHeader={({ section: {facility} }) => (
              <View style = {styles.sectionView}>
                <Text style={styles.facilityText}>{facility.title}</Text>
              </View>
            )}
            renderItem={({item, section}) => (
              <View style={styles.branchView}>         
                <Text style={styles.branchText}>{item.branch}</Text>  
                <View style={{flex: 1}}/>
                {item.requestFlag && <Text style={styles.requestText}>Request sent</Text>}   
              </View> 
            )}  
          /> 

          <View style={{flex: 1}} />
          <TouchableOpacity style={styles.loginButton} onPress={() => this.onChangePressed()}>
            <Text style={styles.loginText}>Change Selection</Text>
          </TouchableOpacity>
        </View>

        {this.state.isLoading ? 
        (<ActivityIndicator
          color={theme.colors.primary}
          size="large"
          style={styles.preloader}
          />
        ) : null }
        
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

  contentView: {
    width: DEVICE_WIDTH,
    flex: 1,
    alignSelf: 'center',
    justifyContent: 'flex-start',
    alignItems: 'center',    
  },

  cellView: {
    height: 72,
    width: DEVICE_WIDTH - 32,
    marginTop: 8,
  },

  sectionView: {
    width: DEVICE_WIDTH,
    height: 36,
    backgroundColor: 'white',
  },

  facilityText: {
    marginTop: 8,
    marginLeft: 16,
    fontSize: 16,
    lineHeight: 25,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.darkGray,
  },

  branchView: {
    height: 40,
    width: DEVICE_WIDTH - 32,
    marginTop: 4,
    marginLeft: 16,
    borderRadius: 12,
    borderColor: theme.colors.lightGray,
    borderWidth: 0.7,
    flexDirection: 'row'
  },

  branchText: {
    marginLeft: 12,
    marginTop: 7,
    fontSize: 15,
    lineHeight: 25,
    fontFamily: 'Poppins-Regular',
  },

  requestText: {
    marginRight: 8,
    marginTop: 7,
    fontSize: 14,
    lineHeight: 25,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.lightGray
  },

  loginButton: { 
    width: DEVICE_WIDTH - 48,
    height: 57,
    marginBottom: 63,
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
  }, 
})