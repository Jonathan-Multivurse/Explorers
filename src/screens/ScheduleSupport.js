import React, { Component } from 'react'
import { View, StyleSheet, Image, Dimensions, Platform, TouchableOpacity, Text, TextInput, Modal, TouchableWithoutFeedback, ActivityIndicator, Alert, SectionList, ScrollView } from 'react-native'
import { getStatusBarHeight } from 'react-native-status-bar-height'
import Background from '../components/Background'
import BackButton from '../components/BackButton'
import { theme } from '../core/theme'
import moment from 'moment'
import * as RNLocalize from 'react-native-localize'
import USER_DB from '../api/userDB'
import REQUEST_DB from '../api/requestDB'
import FACILITY_DB from '../api/facilityDB'
import { LogBox } from 'react-native';
import {Calendar, CalendarList, Agenda} from 'react-native-calendars';
import DateTimePicker from '@react-native-community/datetimepicker';
import SwitchSelector from "react-native-switch-selector";

const DEVICE_WIDTH = Dimensions.get('window').width
const DEVICE_HEIGHT = Dimensions.get('window').height;

const new_timezones = [
{"label": "Azores Standard Time (GMT-01:00)", "name": "(GMT-01:00) Azores", "tzCode": "Atlantic/Azores", "utc": "-01:00"},
{"label": "Cape Verde Standard Time (GMT-01:00)", "name": "(GMT-01:00) Cape Verde Islands", "tzCode": "Atlantic/Cape_Verde", "utc": "-01:00"},
{"label": "Mid-Atlantic Standard Time (GMT-02:00)", "name": "(GMT-02:00) Mid-Atlantic", "tzCode": "Atlantic/South_Georgia", "utc": "-02:00"},
{"label": "E. South America Standard Time (GMT-03:00)", "name": "(GMT-03:00) Brasilia", "tzCode": "America/Sao_Paulo", "utc": "-03:00"},
{"label": "SA Eastern Standard Time (GMT-03:00)", "name": "(GMT-03:00) Buenos Aires, Georgetown", "tzCode": "America/Argentina/Buenos_Aires", "utc": "-03:00"},
{"label": "Greenland Standard Time (GMT-03:00)", "name": "(GMT-03:00) Greenland", "tzCode": "America/Godthab", "utc": "-03:00"},
{"label": "Newfoundland Standard Time (GMT-03:30)", "name": "(GMT-03:30) Newfoundland and Labrador", "tzCode": "America/St_Johns", "utc": "-03:30"},
{"label": "Atlantic Standard Time (GMT-04:00)", "name": "(GMT-04:00) Atlantic Time (Canada)", "tzCode": "America/Halifax", "utc": "-04:00"},
{"label": "SA Western Standard Time (GMT-04:00)", "name": "(GMT-04:00) Caracas, La Paz", "tzCode": "America/La_Paz", "utc": "-04:00"},
{"label": "Central Brazilian Standard Time (GMT-04:00)", "name": "(GMT-04:00) Manaus", "tzCode": "America/Cuiaba", "utc": "-04:00"},
{"label": "Pacific SA Standard Time (GMT-04:00)", "name": "(GMT-04:00) Santiago", "tzCode": "America/Santiago", "utc": "-04:00"},
{"label": "SA Pacific Standard Time (GMT-05:00)", "name": "(GMT-05:00) Bogota, Lima, Quito", "tzCode": "America/Bogota", "utc": "-05:00"},
{"label": "Eastern Standard Time (GMT-05:00)", "name": "(GMT-05:00) Eastern Time (US and Canada)", "tzCode": "America/New_York", "utc": "-05:00"},
{"label": "US Eastern Standard Time (GMT-05:00)", "name": "(GMT-05:00) Indiana (East)", "tzCode": "America/Indiana/Indianapolis", "utc": "-05:00"},
{"label": "Central America Standard Time (GMT-06:00)", "name": "(GMT-06:00) Central America", "tzCode": "America/Costa_Rica", "utc": "-06:00"},
{"label": "Central Standard Time (GMT-06:00)", "name": "(GMT-06:00) Central Time (US and Canada)", "tzCode": "America/Chicago", "utc": "-06:00"},
{"label": "Central Standard Time (Mexico) (GMT-06:00)", "name": "(GMT-06:00) Guadalajara, Mexico City, Monterrey", "tzCode": "America/Monterrey", "utc": "-06:00"},
{"label": "Canada Central Standard Time (GMT-06:00)", "name": "(GMT-06:00) Saskatchewan", "tzCode": "America/Edmonton", "utc": "-06:00"},
{"label": "US Mountain Standard Time (GMT-07:00)", "name": "(GMT-07:00) Arizona", "tzCode": "America/Phoenix", "utc": "-07:00"},
{"label": "Mountain Standard Time (Mexico) (GMT-07:00)", "name": "(GMT-07:00) Chihuahua, La Paz, Mazatlan", "tzCode": "America/Chihuahua", "utc": "-07:00"},
{"label": "Mountain Standard Time (GMT-07:00)", "name": "(GMT-07:00) Mountain Time (US and Canada)", "tzCode": "America/Denver", "utc": "-07:00"},
{"label": "Pacific Standard Time (GMT-08:00)", "name": "(GMT-08:00) Pacific Time (US and Canada); Tijuana", "tzCode": "America/Tijuana", "utc": "-08:00"},
{"label": "Alaskan Standard Time (GMT-09:00)", "name": "(GMT-09:00) Alaska", "tzCode": "America/Anchorage", "utc": "-09:00"},
{"label": "Hawaiian Standard Time (GMT-10:00)", "name": "(GMT-10:00) Hawaii", "tzCode": "Pacific/Honolulu", "utc": "-10:00"},
{"label": "Samoa Standard Time (GMT-11:00)", "name": "(GMT-11:00) Midway Island, Samoa", "tzCode": "Pacific/Apia", "utc": "-11:00"},
{"label": "Greenwich Standard Time (GMT)", "name": "(GMT) Casablanca, Monrovia", "tzCode": "Africa/Monrovia", "utc": "+00:00"},
{"label": "GMT Standard Time (GMT)", "name": "(GMT) Greenwich Mean Time : Dublin, Edinburgh, Lisbon, London", "tzCode": "Europe/London", "utc": "+00:00"},
{"label": "W. Europe Standard Time (GMT+01:00)", "name": "(GMT+01:00) Amsterdam, Berlin, Bern, Rome, Stockholm, Vienna", "tzCode": "Europe/Berlin", "utc": "+01:00"},
{"label": "Central Europe Standard Time (GMT+01:00)", "name": "(GMT+01:00) Belgrade, Bratislava, Budapest, Ljubljana, Prague", "tzCode": "Europe/Belgrade", "utc": "+01:00"},
{"label": "Romance Standard Time (GMT+01:00)", "name": "(GMT+01:00) Brussels, Copenhagen, Madrid, Paris", "tzCode": "Europe/Paris", "utc": "+01:00"},
{"label": "Central European Standard Time (GMT+01:00)", "name": "(GMT+01:00) Sarajevo, Skopje, Warsaw, Zagreb", "tzCode": "Europe/Belgrade", "utc": "+01:00"},
{"label": "W. Central Africa Standard Time (GMT+01:00)", "name": "(GMT+01:00) West Central Africa", "tzCode": "Africa/Lagos", "utc": "+01:00"},
{"label": "GTB Standard Time (GMT+02:00)", "name": "(GMT+02:00) Athens, Bucharest, Istanbul", "tzCode": "Europe/Istanbul", "utc": "+02:00"},
{"label": "Egypt Standard Time (GMT+02:00)", "name": "(GMT+02:00) Cairo", "tzCode": "Africa/Cairo", "utc": "+02:00"},
{"label": "South Africa Standard Time (GMT+02:00)", "name": "(GMT+02:00) Harare, Pretoria", "tzCode": "Africa/Harare", "utc": "+02:00"},
{"label": "FLE Standard Time (GMT+02:00)", "name": "(GMT+02:00) Helsinki, Kiev, Riga, Sofia, Tallinn, Vilnius", "tzCode": "Europe/Riga", "utc": "+02:00"},
{"label": "Israel Standard Time (GMT+02:00)", "name": "(GMT+02:00) Jerusalem", "tzCode": "Asia/Jerusalem", "utc": "+02:00"},
{"label": "E. Europe Standard Time (GMT+02:00)", "name": "(GMT+02:00) Minsk", "tzCode": "Europe/Minsk", "utc": "+02:00"},
{"label": "Namibia Standard Time (GMT+02:00)", "name": "(GMT+02:00) Windhoek", "tzCode": "Africa/Windhoek", "utc": "+02:00"},
{"label": "Arabic Standard Time (GMT+03:00)", "name": "(GMT+03:00) Baghdad", "tzCode": "Asia/Baghdad", "utc": "+03:00"},
{"label": "Arab Standard Time (GMT+03:00)", "name": "(GMT+03:00) Kuwait, Riyadh", "tzCode": "Asia/Kuwait", "utc": "+03:00"},
{"label": "Russian Standard Time (GMT+03:00)", "name": "(GMT+03:00) Moscow, St. Petersburg, Volgograd", "tzCode": "Europe/Moscow", "utc": "+03:00"},
{"label": "E. Africa Standard Time (GMT+03:00)", "name": "(GMT+03:00) Nairobi", "tzCode": "Africa/Nairobi", "utc": "+03:00"},
{"label": "Iran Standard Time (GMT+03:30)", "name": "(GMT+03:30) Tehran", "tzCode": "Asia/Tehran", "utc": "+03:30"},
{"label": "Arabian Standard Time (GMT+04:00)", "name": "(GMT+04:00) Abu Dhabi, Muscat", "tzCode": "Asia/Muscat", "utc": "+04:00"},
{"label": "Azerbaijan Standard Time (GMT+04:00)", "name": "(GMT+04:00) Baku", "tzCode": "Asia/Baku", "utc": "+04:00"},
{"label": "Georgian Standard Time (GMT+04:00)", "name": "(GMT+04:00) Tblisi", "tzCode": "Asia/Tbilisi", "utc": "+04:00"},
{"label": "Caucasus Standard Time (GMT+04:00)", "name": "(GMT+04:00) Yerevan", "tzCode": "Asia/Yerevan", "utc": "+04:00"},
{"label": "Afghanistan Standard Time (GMT+04:30)", "name": "(GMT+04:30) Kabul", "tzCode": "Asia/Kabul", "utc": "+04:30"},
{"label": "Ekaterinburg Standard Time (GMT+05:00)", "name": "(GMT+05:00) Ekaterinburg", "tzCode": "Asia/Yekaterinburg", "utc": "+05:00"},
{"label": "West Asia Standard Time (GMT+05:00)", "name": "(GMT+05:00) Islamabad, Karachi, Tashkent", "tzCode": "Asia/Tashkent", "utc": "+05:00"},
{"label": "India Standard Time (GMT+05:30)", "name": "(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi", "tzCode": "Asia/Calcutta", "utc": "+05:30"},
{"label": "Nepal Standard Time (GMT+05:45)", "name": "(GMT+05:45) Kathmandu", "tzCode": "Asia/Kathmandu", "utc": "+05:45"},
{"label": "N. Central Asia Standard Time (GMT+06:00)", "name": "(GMT+06:00) Almaty, Novosibirsk", "tzCode": "Asia/Novosibirsk", "utc": "+06:00"},
{"label": "Central Asia Standard Time (GMT+06:00)", "name": "(GMT+06:00) Astana, Dhaka", "tzCode": "Asia/Almaty", "utc": "+06:00"},
{"label": "Sri Lanka Standard Time (GMT+06:00)", "name": "(GMT+06:00) Sri Jayawardenepura", "tzCode": "Asia/Colombo", "utc": "+06:00"},
{"label": "Myanmar Standard Time (GMT+06:30)", "name": "(GMT+06:30) Yangon (Rangoon)", "tzCode": "Asia/Rangoon", "utc": "+06:30"},
{"label": "SE Asia Standard Time (GMT+07:00)", "name": "(GMT+07:00) Bangkok, Hanoi, Jakarta", "tzCode": "Asia/Bangkok", "utc": "+07:00"},
{"label": "North Asia Standard Time (GMT+07:00)", "name": "(GMT+07:00) Krasnoyarsk", "tzCode": "Asia/Krasnoyarsk", "utc": "+07:00"},
{"label": "China Standard Time (GMT+08:00)", "name": "(GMT+08:00) Beijing, Chongqing, Hong Kong SAR, Urumqi", "tzCode": "Asia/Shanghai", "utc": "+08:00"},
{"label": "North Asia East Standard Time (GMT+08:00)", "name": "(GMT+08:00) Irkutsk, Ulaanbaatar", "tzCode": "Asia/Irkutsk", "utc": "+08:00"},
{"label": "Singapore Standard Time (GMT+08:00)", "name": "(GMT+08:00) Kuala Lumpur, Singapore", "tzCode": "Asia/Singapore", "utc": "+08:00"},
{"label": "W. Australia Standard Time (GMT+08:00)", "name": "(GMT+08:00) Perth", "tzCode": "Australia/Perth", "utc": "+08:00"},
{"label": "Taipei Standard Time (GMT+08:00)", "name": "(GMT+08:00) Taipei", "tzCode": "Asia/Taipei", "utc": "+08:00"},
{"label": "Tokyo Standard Time (GMT+09:00)", "name": "(GMT+09:00) Osaka, Sapporo, Tokyo", "tzCode": "Asia/Tokyo", "utc": "+09:00"},
{"label": "Korea Standard Time (GMT+09:00)", "name": "(GMT+09:00) Seoul", "tzCode": "Asia/Seoul", "utc": "+09:00"},
{"label": "Yakutsk Standard Time (GMT+09:00)", "name": "(GMT+09:00) Yakutsk", "tzCode": "Asia/Yakutsk", "utc": "+09:00"},
{"label": "Cen. Australia Standard Time (GMT+09:30)", "name": "(GMT+09:30) Adelaide", "tzCode": "Australia/Adelaide", "utc": "+09:30"},
{"label": "AUS Central Standard Time (GMT+09:30)", "name": "(GMT+09:30) Darwin", "tzCode": "Australia/Darwin", "utc": "+09:30"},
{"label": "E. Australia Standard Time (GMT+10:00)", "name": "(GMT+10:00) Brisbane", "tzCode": "Australia/Brisbane", "utc": "+10:00"},
{"label": "AUS Eastern Standard Time (GMT+10:00)", "name": "(GMT+10:00) Canberra, Melbourne, Sydney", "tzCode": "Australia/Sydney", "utc": "+10:00"},
{"label": "West Pacific Standard Time (GMT+10:00)", "name": "(GMT+10:00) Guam, Port Moresby", "tzCode": "Pacific/Guam", "utc": "+10:00"},
{"label": "Tasmania Standard Time (GMT+10:00)", "name": "(GMT+10:00) Hobart", "tzCode": "Australia/Hobart", "utc": "+10:00"},
{"label": "Vladivostok Standard Time (GMT+10:00)", "name": "(GMT+10:00) Vladivostok", "tzCode": "Asia/Vladivostok", "utc": "+10:00"},
{"label": "Central Pacific Standard Time (GMT+11:00)", "name": "(GMT+11:00) Magadan, Solomon Islands, New Caledonia", "tzCode": "Pacific/Guadalcanal", "utc": "+11:00"},
{"label": "New Zealand Standard Time (GMT+12:00)", "name": "(GMT+12:00) Auckland, Wellington", "tzCode": "Pacific/Auckland", "utc": "+12:00"},
{"label": "Fiji Standard Time (GMT+12:00)", "name": "(GMT+12:00) Fiji Islands, Kamchatka, Marshall Islands", "tzCode": "Pacific/Fiji", "utc": "+12:00"},
{"label": "Tonga Standard Time (GMT+13:00)", "name": "(GMT+13:00) Nuku'alofa", "tzCode": "Pacific/Tongatapu", "utc": "+13:00"}]

LogBox.ignoreLogs([
    'Non-serializable values were found in the navigation state',
]);

export default class ScheduleSupport extends Component {
constructor(props) {
    super(props)
    USER_DB.getProfile(this.onUserGet) 

    this.state = { 
        isLoading: false, 
        curUser: '',
        requestId: '',
        buttonTitle: '',

        selectedSupport: '',    
        selectedContent: '',        
        selectedTimezone:'',

        isPickerShow: false,        
        selectedTime: '',

        isAM: 0,
        isAvailable: true,
        modalVisible: false,

        supportFacilityName: '',
        supportBranchName: '',
        supprotSimulator:'',
        isSimulatorModal: false,
        searchText: '',

        originalData: [],
        filteredData: [] 
    }
}

componentDidMount() {
    const phoneTzCode = RNLocalize.getTimeZone()
    console.log("Phone Timezone tzCode is  ===>", phoneTzCode)
    const now = new Date()   

    if (this.props.route.params.isCreate == true){        
        let currentTimezone = ''
        const filteredTimezones = new_timezones.filter((item) => item.tzCode === phoneTzCode)        

        if (filteredTimezones.length > 0) {            
            currentTimezone = filteredTimezones[0]
        } else {        
            currentTimezone = {
                "label": '',
                "name": '',
                "tzCode": phoneTzCode,
                "utc": '',
            }            
        }
        
        moment.locale('en')
        const isAM = (moment(now).format('A') == 'AM') ? 0 : 1
        console.log("current Timezone = ", currentTimezone);

        this.setState({
            requestId: '',
            buttonTitle: 'Schedule',

            selectedSupport: 'Call',
            selectedContent: '',
            selectedTimezone: currentTimezone,

            selectedTime: now.getTime(),   
            isAM: isAM, 
            isAvailable: now.getTime() > new Date().getTime()                 
        })
    } else {
        // let currentDate = new Date()
        // const currentoffset = currentDate.getTimezoneOffset() * 60 * 1000
        // const targetoffset = this.props.route.params.scheduleOffset * 60 * 60 * 1000
        // let miliseconds = this.props.route.params.scheduleTime + currentoffset + targetoffset

        const moment = require('moment')        
        moment.locale('en')
        const momentT = require('moment-timezone')

        const currentoffset = momentT.tz(phoneTzCode).utcOffset();
        const targetoffset = momentT.tz(this.props.route.params.scheduleTimezone.tzCode).utcOffset();
        let miliseconds = this.props.route.params.scheduleTime - (currentoffset - targetoffset) * 60 * 1000

        const isAM = (moment(miliseconds).format('A') == 'AM') ? 0 : 1

        this.setState({
            requestId: this.props.route.params.requestId,
            buttonTitle: 'Re-schedule',

            selectedSupport: this.props.route.params.scheduleSupport,
            selectedContent: this.props.route.params.scheduleContent,
            selectedTimezone: this.props.route.params.scheduleTimezone,
            supportFacilityName: this.props.route.params.scheduleFacility,
            supprotSimulator: this.props.route.params.scheduleSimulator, 

            selectedTime: miliseconds,
            isAM: isAM,
            isAvailable: this.props.route.params.scheduleTime > new Date().getTime()  
        })
    }    
}    

onSupportTypeRow = (item) => {
    this.setState({
        selectedSupport: item
    })
}

onTimeZone = () => {
    this.props.navigation.navigate('TimeZoneScreen', {
        onGoBackFromOptions: (item) => this._onGoBackFromOptions(item)
    })
}

_onGoBackFromOptions = (item) => {
    console.log("Selected back Timezone ===>", item)

    this.setState({
        selectedTimezone: item,   
    })
}

onDateChange = (date) => {
    console.log("Calendar date", date);

    const year = date.year
    const month = date.month - 1
    const day = date.day

    const curDate = new Date(this.state.selectedTime)
    const hour = curDate.getHours();
    const minute = curDate.getMinutes();

    const newDate = new Date(year, month, day, hour, minute);
    moment.locale('en')
    const isAM = (moment(newDate).format('A') == 'AM') ? 0 : 1

    this.setState({
        selectedTime: newDate.getTime(),
        isAM: isAM,
        isAvailable: newDate.getTime() > new Date().getTime()
    });
}

onPickerPressed = () => {
    this.setState({
        isPickerShow: true
    })    
}

onPressTime = (date) => {
    console.log("Picker date", date);

    const curDate = new Date(this.state.selectedTime)
    const year = curDate.getFullYear()
    const month = curDate.getMonth()
    const day = curDate.getDate()

    const hour = date.getHours()
    const minute = date.getMinutes();

    const newDate = new Date(year, month, day, hour, minute);
    moment.locale('en')
    const isAM = (moment(newDate).format('A') == 'AM') ? 0 : 1

    this.setState({
        selectedTime: newDate.getTime(),
        isAM: isAM,
        isAvailable: newDate.getTime() > new Date().getTime()
    });
}

onPressPickerDone = () => {
    this.setState({
        isPickerShow: false,
    })
}

onUserGet = (user) => {  
    this.setState({
        curUser: user,
    })    

    FACILITY_DB.getFacilities(this.onGetFacilities)
}

onGetFacilities = (facilities) => {
    var simulatorData = []
    const currentFacilityIds = this.state.curUser.facility

    currentFacilityIds.map(facilityItem => {
      const facilityID = facilityItem.facility
      const branchName = facilityItem.branch

      const tmpFacility = facilities.filter(facility => facility.facilityid === facilityID)[0]      
      const branches = tmpFacility.branch   
      const simulators = tmpFacility.simulators

      const tmpBranch = branches.filter(branch => branch.name === branchName)[0]
      const simulatorIDs = tmpBranch.simulators      

      var tmpSimulators = []
      simulatorIDs.forEach(simulatorID => {
        const tmpSimulator = simulators.filter(simulator => simulator.simulatorid === simulatorID)[0]
        tmpSimulators.push(tmpSimulator)
      })

      simulatorData.push(
        {
          branch: { facility: tmpFacility, branch: tmpBranch},
          data: tmpSimulators
        }
      )
    })
    
    this.setState({
      isLoading: false,
      originalData: simulatorData,
      filteredData: simulatorData
    })

    if (simulatorData.length > 0 && this.props.route.params.isCreate) {
        var timeZones = []

        simulatorData.forEach(simulatorItem => {
            if ( simulatorItem.branch.facility.timezone ){
                timeZones.push(simulatorItem.branch.facility.timezone)
            }
        })

        if (timeZones.length > 0) {
            this.setState({
                selectedTimezone: timeZones[0],  
            })
        }
    }
}

onSimulatorSelect = () => {
    this.setState({
        isSimulatorModal: true
    })
}

searchFilter = (text) => {
    if (text) {
        const textData = text.toUpperCase()
        var newData = []
  
        this.state.originalData.forEach(element => {
          const simulators = element.data
          const newSimulators = simulators.filter(
            function(item){
              const itemData = item.name.toUpperCase()            
              return itemData.indexOf(textData) > -1
            }
          )
  
          if (newSimulators.length > 0) {
            newData.push({
                branch: element.branch,
                data: newSimulators
            })
          }
        })
  
        this.setState({
          searchText: text,
          filteredData: newData,
        })
    } else {
        this.setState({
          searchText: '',
          filteredData: this.state.originalData,
        })
    }

}

selectSimulatorRow = (item, section) => {
    this.setState({
        supportFacilityName: section.branch.facility.title,
        supportBranchName: section.branch.branch.name,
        supprotSimulator: item.name,
        filteredData: this.state.originalData,
        searchText: '',
        isSimulatorModal: false
    });    
}

onConfirm = (visible) => {

    if (this.state.isAvailable && this.state.selectedTimezone.label != '' && this.state.selectedContent != '' ) {
        this.setState({ modalVisible: visible });   
    } else {
        if (!this.state.isAvailable) {
            Alert.alert(
                "Warning",
                `This Support is not available.`,
                [
                    {
                    text: "Ok",
                    },
                ],
                { cancelable: false }
                );
            return
        } 

        if (this.state.selectedTimezone.label == '') {
            Alert.alert(
                "Warning",
                `You should set Timezone.`,
                [
                    {
                    text: "Ok",
                    },
                ],
                { cancelable: false }
                );
            return
        } 

        if (this.state.selectedContent == '') {
            Alert.alert(
                "Warning",
                `Please type description of this support.`,
                [
                    {
                    text: "Ok",
                    },
                ],
                { cancelable: false }
            );
            return;
        }             
    }
}

onSendRequest = () => {
    if (!this.state.isLoading){
    
        this.setState({
            isLoading: true,
        }) 
  
        const moment = require('moment')        
        moment.locale('en')
        const momentT = require('moment-timezone')
        const strTime = moment(this.state.selectedTime).format('YYYY-MM-DD HH:mm')        
        var targetMoment = momentT.tz(strTime, this.state.selectedTimezone.tzCode)
        const miliseconds = targetMoment.valueOf()

        console.log(" Schedule Request Info === ", this.state.selectedTimezone, this.state.selectedTime, miliseconds, strTime)
        
        if (this.state.buttonTitle === 'Schedule'){
            REQUEST_DB.addRequest(this.state.selectedSupport, this.state.supportFacilityName, this.state.supprotSimulator, new Date().getTime(), 'pending', true, miliseconds, this.state.selectedTimezone, this.state.selectedContent, '', this.state.curUser, '', '', this.onUserSubmit)
        } else{
            REQUEST_DB.updateRequest(this.state.requestId, this.state.selectedSupport, this.state.supportFacilityName, this.state.supprotSimulator, miliseconds, this.state.selectedTimezone, this.state.selectedContent, this.onUserSubmit)
        }    
    }
}

onUserSubmit = async (request) => {
    this.setState({
        isLoading: false,
        modalVisible: false,
    })

    this.props.navigation.push('ScheduleSupportWaiting', {
        request: request,
        isFromScheduleSupport: true,
    })
}

render() {
    let selected = moment(this.state.selectedTime).format('yyyy-MM-DD')

    return (
        <Background>

            <Modal
                animationType="fade"
                transparent={true}
                visible={this.state.modalVisible}
                onRequestClose={() => {
                    this.onConfirm(false);
                }}
            >
                <View style={styles.centeredView}>
                    <View style = {styles.modalView}>

                    <View style={styles.titleView}>
                        <View style={{flex: 1}}/>
                        <Text style={styles.editPText}>Schedule Support</Text>
                        <View style={{flex: 1}}/>
                        <TouchableOpacity style={styles.closeView} onPress={() => this.onConfirm(false)} >
                            <Image  style={styles.coloseImage} source={require('../assets/images/account/icon_close.png')} />
                        </TouchableOpacity>
                    </View> 

                    <Text style={{...styles.selectText, marginTop: 18,}}>Schedule Support</Text>
                    <View style={{...styles.cellSelectedContentView, alignSelf: 'flex-start', marginLeft: 16,}}>
                        <Image style={styles.callImage} source={ this.state.selectedSupport == 'Call' ? require('../assets/images/request/icon_call.png') : this.state.selectedSupport == 'Video' ? require('../assets/images/request/icon_video.png') : require('../assets/images/request/icon_chat.png')}  />
                        <Text style={styles.callText}>{ this.state.selectedSupport } </Text>
                    </View>         

                    <View style={styles.confirmtimeView}>
                        <View styles={styles.cDateView}>
                            <Text style={{...styles.selectText, marginTop: 12}}>Date</Text>
                            <View style={{...styles.dateContentView, alignSelf: 'flex-start', marginLeft: 16,}}>
                                <Text style={{...styles.callText, marginLeft: 0}}>{moment(this.state.selectedTime).format('MMM D, yyyy')}</Text>
                            </View>
                        </View>

                        <View styles={styles.cDateView}>
                            <Text style={{...styles.selectText, paddingLeft: 0, marginTop: 12}}>Time</Text>
                            <View style={{...styles.dateContentView, alignSelf: 'flex-start', marginLeft: 0,}}>
                                <Text style={{...styles.callText, marginLeft: 0}}>{moment(this.state.selectedTime).format('h : mm  A')}</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={{...styles.selectText, marginTop: 12}}>Description</Text>
                    <Text style={{fontSize: 15, lineHeight: 22, fontFamily: 'Poppins-Regular', marginLeft: 16, marginRight: 16, textAlign: 'left', alignSelf: 'flex-start', marginTop: 6}}>{this.state.selectedContent}</Text>

                    <Text style={{...styles.selectText, marginTop: 12}}>Simulator</Text>
                    <Text style={{fontSize: 15, lineHeight: 22, fontFamily: 'Poppins-Regular', marginLeft: 16, marginRight: 16, textAlign: 'left', alignSelf: 'flex-start', marginTop: 6}}>{this.state.supprotSimulator}</Text>

                    <Text style={styles.confirmText}>Please confirm schedule details</Text>
                    <TouchableOpacity style={styles.loginButton} onPress={() => this.onSendRequest()}>
                        <Text style={styles.loginText}>Confirm</Text>
                    </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            
            <Modal
                animationType="fade"
                transparent={true}
                visible={this.state.isSimulatorModal}
                onRequestClose={() => {
                    this.setState({isSimulatorModal : false})
                }}
            >
                <View style={styles.centeredView2}>
                    <View style = {styles.navigationView2}>
                    <View style={{flex:1}}/>
                    <Text style={styles.pageTitle1}>Select Simulator</Text> 
                    <View style={{flex:1}}/>
                    <TouchableOpacity onPress={() => this.setState({isCallModal: true, isSimulatorModal: false})} style={styles.arrowButton}>
                        <Image style={styles.arrowImage} source={require('../assets/images/home/icon_bclose.png')}/>
                    </TouchableOpacity>
                    </View>

                    <View style={styles.searchView}>              
                    <TextInput
                        style= {styles.searchInput}
                        returnKeyType="search"
                        value={this.state.searchText}
                        onChangeText={(text) => this.searchFilter(text)}
                        underlineColorAndroid="transparent"
                        placeholder="Search"
                    />
                    </View> 

                    <View style={styles.listView}>
                        <SectionList
                            sections={this.state.filteredData}
                            keyExtractor={(item, index) => item + index}
                            renderSectionHeader={({ section: {branch} }) => (
                            <View style = {styles.sectionView}>
                                <Text style={styles.sectionText}>{branch.facility.title} - {branch.branch.name}</Text>
                            </View>
                            )}
                            renderItem={({item, section}) => (
                            <TouchableWithoutFeedback onPress={() => this.selectSimulatorRow(item, section)}>
                                <View style={styles.cellContentView1}>
                                    <Text style={styles.nameText}>{item.name}</Text>
                                </View>
                            </TouchableWithoutFeedback>
                            )}  
                        />
                    </View>
                </View>
            </Modal>

            <View style ={styles.navigationView}>
                <View style={{position: 'absolute', left: 0, bottom: 10, width: 50, height: 50}}>
                    <BackButton goBack={() => this.props.navigation.goBack()} />
                </View>
                
                <Text style={styles.titleText}>Schedule Support</Text>
            </View>

            <ScrollView style = {styles.scrollViewContentView} showsVerticalScrollIndicator={false}>  
                <Text style={styles.selectText}>Schedule Support</Text>
                <View style={styles.supportView}>             
                    <TouchableWithoutFeedback onPress={ () => this.onSupportTypeRow('Call')}>
                        <View style={(this.state.selectedSupport == 'Call') ? {...styles.cellSelectedContentView, shadowColor: theme.colors.callShadow} : styles.cellContentView}>
                            <Image style={styles.callImage} source={require('../assets/images/request/icon_call.png')}  />
                            <Text style={styles.callText}>Call</Text>
                        </View>
                    </TouchableWithoutFeedback>
                    <TouchableWithoutFeedback onPress={ () => this.onSupportTypeRow('Video')}>
                        <View style={(this.state.selectedSupport == 'Video') ? {...styles.cellSelectedContentView, shadowColor: theme.colors.videoShadow} : styles.cellContentView}>
                            <Image style={styles.callImage} source={require('../assets/images/request/icon_video.png')}  />
                            <Text style={styles.callText}>Video</Text>
                        </View>
                    </TouchableWithoutFeedback>
                    <TouchableWithoutFeedback onPress={ () => this.onSupportTypeRow('Chat')}>
                        <View style={(this.state.selectedSupport == 'Chat') ? {...styles.cellSelectedContentView, shadowColor: theme.colors.chatShadow} : styles.cellContentView}>
                            <Image style={styles.callImage} source={require('../assets/images/request/icon_chat.png')}  />
                            <Text style={styles.callText}>Chat</Text>
                        </View>
                    </TouchableWithoutFeedback>
                </View>      

                <Text style={styles.selectText}>Time Zone</Text>
                <TouchableOpacity style={styles.timezoneButton} onPress={() => this.onTimeZone()}  >
                    <Text style={styles.timezoneText}>{this.state.selectedTimezone.label}</Text>
                    <View style={{flex: 1}}/>
                    <Image source={require('../assets/images/request/arrow_forward.png')} style={styles.chevronImage}/>
                </TouchableOpacity>

                <Text style={styles.selectText}>Select Date</Text>
                <Calendar
                    style={styles.calendar}
                    onDayPress={this.onDateChange}
                    monthFormat={'MMMM, yyyy'}
                    markedDates={{
                        [selected]: {
                        selected: true,
                        disableTouchEvent: true,
                        selectedColor: theme.colors.primary,
                        selectedTextColor: 'white'
                        }
                    }}
                    theme={{
                        calendarBackground: theme.colors.inputBar,
                        arrowColor: theme.colors.primary,
                        textSectionTitleColor: '#000000',
                        textSectionTitleDisabledColor: '#d9e1e8',
                        todayTextColor: theme.colors.primary,
                        dayTextColor: '#000000',                            
                        textDisabledColor: '#d9e1e8',
                        monthTextColor: '#000',
                        textDayFontFamily: 'Poppins-Medium',
                        textMonthFontFamily: 'Poppins-SemiBold',
                        textDayHeaderFontFamily: 'Poppins-Regular',
                        textDayFontSize: 15,
                        textMonthFontSize: 17,
                        textDayHeaderFontSize: 11
                    }}
                />                  

                <View style={{width: DEVICE_WIDTH, backgroundColor: '#fff', marginTop: 12}}>
                    <Text style={styles.selectTimeText}>Select Time</Text>
                    <View style={styles.timeView}>                        
                        <TouchableOpacity style={styles.selectTimeView} onPress={() => this.onPickerPressed()}>
                            <Text style={styles.timeText}>{moment(this.state.selectedTime).format('h  :  mm')}</Text>
                        </TouchableOpacity>    

                        <View style={{width: 90, height: 42, marginLeft: 8,  borderRadius: 21, borderColor: theme.colors.supportBorder, borderWidth: 1}}>
                            <SwitchSelector
                                style={{height: 32}}
                                initial={this.state.isAM}
                                value={this.state.isAM}
                                onPress={value => this.setState({ isAM: value })}
                                textColor={ '#000' } //'#7a44cf'
                                selectedColor={'#fff' }
                                buttonColor={theme.colors.primary}
                                borderColor={theme.colors.supportBorder}
                                borderWidth={1}
                                options={[
                                    { label: "AM", value: 0}, 
                                    { label: "PM", value: 1} 
                                ]}
                            /> 
                        </View>

                        <TouchableOpacity style={styles.optionView} >
                            { this.state.isAvailable ? 
                                (<Image source={require('../assets/images/request/icon_option.png')} style={styles.iconImage}/>)
                                : (<View style={styles.iconView} />)
                            }                    
                        </TouchableOpacity> 
                        <Text style={styles.availableText}>Available</Text>
                    </View>

                    <View style={{flexDirection: 'row'}}>
                        <Text style={styles.selectText}>Description</Text> 
                        <View style={{flex:1}}/>
                        <Text style={styles.countText}>{this.state.selectedContent.length}/100</Text> 
                    </View>
                    
                    <TextInput
                        style={styles.emailInput}
                        multiline={true}
                        value={this.state.selectedContent}
                        onChangeText={(text) => this.setState({selectedContent: text}) }
                        autoCapitalize="none"
                        autoCompleteType="name"
                        textContentType="name"
                    />  
                    <View style ={styles.simulatorView}>
                        <Text style={{fontSize: 17, lineHeight: 24, fontFamily: 'Poppins-Medium', color: theme.colors.lightGray, }}>Simulator </Text>
                        <Text style={{fontSize: 17, lineHeight: 24, fontFamily: 'Poppins-Regular', color: theme.colors.lightGray,}}>(Optional)</Text>
                    </View> 

                    <TouchableOpacity style={styles.simulatorButton} onPress={() => this.onSimulatorSelect()}  >
                        <Text style={this.state.supprotSimulator == '' ? styles.nonsimulatorText : styles.simulatorText}>{this.state.supprotSimulator == '' ? 'Select' : this.state.supprotSimulator }</Text>
                        <View style={{flex: 1}}/>
                        <Image source={require('../assets/images/request/arrow_forward.png')} style={styles.chevronImage}/>
                    </TouchableOpacity>  

                    <View style={{height: 120, width: DEVICE_WIDTH}}/>

                </View>                

            </ScrollView>
            <View style ={styles.bottomView}>
                <TouchableOpacity style={styles.scheduleButton} onPress={() => this.onConfirm(true)}>
                    <Text style={styles.scheduleButtonText}>{this.state.buttonTitle}</Text>
                </TouchableOpacity> 
            </View>

            {this.state.isPickerShow ? 
                <View style={styles.pickerView}>
                    <TouchableOpacity style={styles.pickerHeader} onPress={this.onPressPickerDone}>
                        <Text style={styles.pickerDone}>Done</Text>
                    </TouchableOpacity>
                    <View style={styles.timePickerView}>
                        <DateTimePicker
                        value={new Date(this.state.selectedTime)}
                        mode={'time'}
                        is24Hour={false}
                        display="spinner"
                        onChange={(event, date) => this.onPressTime(date)}
                        minuteInterval={15}
                        themeVariant="light"
                        />
                    </View>                     
                </View> 
                : <View /> 
            }

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

    centeredView: {
        flex: 1,
        justifyContent: "flex-end",
        alignItems: "center",
        marginTop: 0,
        backgroundColor: theme.colors.shadow
    },
    
    modalView: {    
        width: DEVICE_WIDTH,
        borderTopRightRadius: 10,
        borderTopLeftRadius: 10,
        alignItems: "center",   
        backgroundColor: theme.colors.inputBar, 
    
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },

    titleView : {    
        width: DEVICE_WIDTH,
        height: 72,
        borderTopRightRadius: 10,
        borderTopLeftRadius: 10,
        flexDirection: 'row',
        backgroundColor: '#fff'
    },
      
    editPText: {
        marginTop: 24,
        fontSize: 17,
        lineHeight: 22,
        fontFamily: 'Poppins-Medium',
    },

    closeView: {
        position: 'absolute',
        right: 10,
        top: 10,
        height: 50,
        width: 50,
    },

    descriptionText: {
        alignSelf: 'flex-start',
        width: DEVICE_WIDTH - 32,
        height: 44,
        marginTop: 6,
        marginLeft: 16,        
        borderRadius: 22,
        backgroundColor: '#FFFFFF',
        paddingTop: 10,
        paddingLeft: 22,
        paddingRight: 12,       
        

        shadowColor: theme.colors.shadow,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 11 },
        shadowOpacity: 1,
    },
    
    coloseImage: {
        position: 'absolute',
        top: 3,
        right: 3,
        width: 44,
        height: 44,
    },

    confirmtimeView:{
        alignSelf: 'flex-start',
        justifyContent: 'flex-start',
        flexDirection: 'row',   
    },

    cDateView: {
        width: DEVICE_WIDTH/3,
        backgroundColor: 'blue',
    },

    dateContentView: {
        height: 42,
        width: (DEVICE_WIDTH - 64)/2,
        marginHorizontal: 16,
        marginVertical: 8,
        paddingTop: 2,
        borderRadius: 21,           
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        flexDirection: 'row',

        shadowColor: theme.colors.shadow,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 1,
    },

    confirmText: {
        marginTop: 28,
        fontSize: 15,
        lineHeight: 26,
        fontFamily: 'Poppins-Medium',
    },

    loginButton: { 
        width: DEVICE_WIDTH - 48,
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
    },

    navigationView: {
        width: '100%',
        height: Platform.OS === 'ios' ? 70 + getStatusBarHeight() : 70,
        justifyContent: 'flex-end',
        backgroundColor: theme.colors.inputBar,

        shadowColor: theme.colors.shadow,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 1,
    },  

    titleText:{
        marginLeft: 16,
        marginBottom: 10,
        fontSize: 28,
        lineHeight: 38,
        fontFamily: 'Poppins-Medium', 
        alignSelf: 'center'
    },

    scrollViewContentView: {
        width: '100%',
        marginBottom: 0,
        // backgroundColor: theme.colors.inputBar,
    },   
    
    selectText:{
        marginTop: 24,
        paddingLeft: 16,
        fontSize: 17,
        lineHeight: 26,
        fontFamily: 'Poppins-Medium', 
        alignSelf: 'flex-start',
        color: theme.colors.lightGray,
    },

    countText:{
        marginTop: 24,
        marginRight: 16,
        paddingLeft: 16,
        fontSize: 18,
        lineHeight: 30,
        
        fontFamily: 'Poppins-Medium', 
        alignSelf: 'flex-start',
        color: theme.colors.lightGray,
    },

    selectTimeText:{
        width: DEVICE_WIDTH,
        marginTop: 24,
        paddingLeft: 16,
        fontSize: 17,
        lineHeight: 26,
        fontFamily: 'Poppins-Medium', 
        alignSelf: 'flex-start',
        color: theme.colors.lightGray,
        backgroundColor: '#fff'
    },

    supportView: {
        width: '100%',
        height: 58,
        paddingHorizontal: 12,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexDirection : 'row',
    },

    cellSelectedContentView: {
        height: 42,
        width: (DEVICE_WIDTH - 24 - 24)/3,
        marginHorizontal: 4,
        marginVertical: 8,
        paddingTop: 2,
        borderRadius: 21,           
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'white',
        flexDirection: 'row',
        elevation: 18,

        shadowColor: theme.colors.shadow,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
    },

    cellContentView: {
        height: 42,
        width: (DEVICE_WIDTH - 24 - 24)/3,
        marginHorizontal: 4,
        marginVertical: 8,
        paddingTop: 2,
        borderRadius: 21,   
        borderColor: theme.colors.supportBorder,       
        borderWidth:  1,    
        alignItems: 'center',
        justifyContent: 'center',        
        flexDirection: 'row',
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

    listView: {
        width: DEVICE_WIDTH,
        flex: 1,
    },

    scheduleButton: { 
        width: DEVICE_WIDTH - 48,
        height: 57,
        marginTop: 16,
        marginBottom: 47,
        borderRadius: 28.5,
        backgroundColor: theme.colors.lightYellow,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
    
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

    timeView: {
        width: DEVICE_WIDTH,
        paddingTop: 10,
        paddingHorizontal: 16, 
        flexDirection: 'row',    
        alignItems: 'center',
        alignContent: 'center',
        backgroundColor: '#fff'
    },

    emailInput: {
        width: DEVICE_WIDTH - 32,
        marginTop: 6,
        marginLeft: 16,
        height: 90,
        borderRadius: 10,
        backgroundColor: theme.colors.inputBar,
        paddingLeft: 12,
        paddingRight: 12,
        paddingTop: 12,
    },

    selectTimeView: {
        height: 42,
        width: 108,
        paddingTop: 2,
        borderRadius: 21,           
        borderColor: theme.colors.supportBorder,       
        borderWidth:  1,    
        alignItems: 'center',
        alignContent: 'center',
        justifyContent: 'center',  
        backgroundColor: 'white',      
    },

    timeText: {
        fontSize: 15,
        lineHeight: 22,    
        fontFamily: 'Poppins-Medium',
    },

    optionView:{
        width: 40,   
        height: 40,   
        paddingLeft: 5,    
        alignItems: 'center',
        justifyContent: 'center',  
        flexDirection: 'row'
    },

    iconImage:{
        width: 20,
        height: 20,
    },

    iconView: {
        width: 20,
        height: 20,
        borderColor: theme.colors.primary,
        borderWidth: 1,
        borderRadius: 10,
    },

    availableText: {
        fontSize: 15,
        lineHeight: 22,    
        fontFamily: 'Poppins-Medium',
    },

    pickerView: {
        position: 'absolute',
        bottom: 0,
        width: DEVICE_WIDTH, 
        borderColor: theme.colors.primary, 
        borderWidth: 1,
        borderTopLeftRadius: 3,
        borderTopRightRadius: 3,
        backgroundColor: 'white',
    },

    pickerHeader: {
        width: '100%',
        height: 44,
        backgroundColor: theme.colors.navBar,
        borderRadius: 3,
    },

    pickerDone: {
        position: 'absolute',
        right: 12,
        top: 14,
        color: theme.colors.primary
    },    

    timePickerView: {
        width: '100%',
    },   

    timezoneButton: {
        height: 42,
        width: DEVICE_WIDTH - 32,
        marginHorizontal: 16,
        marginVertical: 4,
        paddingTop: 2,
        borderRadius: 21,   
        borderColor: theme.colors.supportBorder,       
        borderWidth:  1,    
        alignItems: 'center',
        justifyContent: 'center',      
        flexDirection: 'row',

        shadowColor: theme.colors.shadow,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 11 },
        shadowOpacity: 1,      
    }, 

    timezoneText: {
        marginLeft: 12,
        fontSize: 15,
        lineHeight: 22,
        fontFamily: 'Poppins-Regular',      
    },

    chevronImage: {
        marginRight: 16,
        width: 10.5,
        height: 18,
    },    

    calendar: {
        width: DEVICE_WIDTH - 16,
        marginHorizontal: 8,
    },

    bottomView: {
        position: 'absolute', 
        width: DEVICE_WIDTH, 
        height: 120, 
        bottom: 0, 
        backgroundColor: 'white',
        borderTopColor: theme.colors.inputBar,
        borderTopWidth: 2,
    },

    simulatorView:{
        marginTop: 24,
        paddingLeft: 16,
        alignSelf: 'flex-start',
        flexDirection: 'row',
    },
    
    simulatorButton: {
        height: 44,
        width: DEVICE_WIDTH - 32,
        marginHorizontal: 16,
        marginTop: 8,
        marginBottom:24,
        paddingTop: 2,
        
        borderRadius: 10,
        backgroundColor: '#F2F2F2',
    
        alignItems: 'center',
        justifyContent: 'center',      
        flexDirection: 'row',    
    }, 
    
    simulatorText: {
        marginLeft: 12,
        fontSize: 15,
        lineHeight: 22,
        fontFamily: 'Poppins-Regular',   

    },
    
    nonsimulatorText: {
        marginLeft: 12,
        fontSize: 15,
        lineHeight: 22,
        fontFamily: 'Poppins-Regular',   
        color: theme.colors.lightGray,  
    },
    
    chevronImage: {
        marginRight: 16,
        width: 10.5,
        height: 18,
    }, 

    centeredView2: {
        width: DEVICE_WIDTH,
        height: DEVICE_HEIGHT,
        justifyContent: "flex-start",
        alignItems: "center",
        backgroundColor: 'white'
    },
    
    navigationView2: {
        width: '100%',
        height: Platform.OS === 'ios' ? 54 + getStatusBarHeight() : 60,
        alignItems: 'flex-end',
        flexDirection: 'row',
        backgroundColor: theme.colors.inputBar
    },

    pageTitle1: {
        height: 30, 
        marginBottom: 14,  
        fontSize: 20, 
        lineHeight: 30,    
        fontFamily: 'Poppins-SemiBold', 
        fontWeight: '500',
    },
    
    arrowButton: {
        width: 50, 
        height: 50, 
        position: 'absolute',
        right: 10,
        bottom: 2,
        justifyContent: 'center',
        alignItems: 'center',
    },
    
    arrowImage: {
        width: 22,  
        height: 22
    },
    
    searchView: {
        width: DEVICE_WIDTH - 32,
        height: 45,    
        marginTop: 14,
        borderRadius: 22.5,    
        backgroundColor: theme.colors.inputBar,
    },
    
    searchInput:{
        flex: 1,
        marginLeft: 14,
    },
    
    listView: {
        flex: 1,
        marginTop: 8,  
    },
    
    sectionView: {
        width: DEVICE_WIDTH,
        marginTop: 6,
        height: 24,
        marginBottom: 6,
    },
    
    sectionText: {    
        paddingLeft: 16,
        paddingTop: 8,    
        fontSize: 15,
        lineHeight: 18,
        fontFamily: 'Poppins-Medium',      
        color: theme.colors.sectionHeader
    },
    
    cellView: {
        width: DEVICE_WIDTH,
        height: 51,
        backgroundColor: 'red'
    },
    
    cellContentView1: {    
        flex: 1,
        width: DEVICE_WIDTH - 32,
        height: 45,
        marginTop: 6,
        marginHorizontal: 16,
        borderRadius: 16,
        backgroundColor: theme.colors.inputBar,
        flexDirection: 'row',
    },
    
    nameText: {
        marginLeft: 12,
        marginTop: 14,
        fontSize: 15,
        lineHeight: 20,
        fontFamily: 'Poppins-Medium',     
    },
})  