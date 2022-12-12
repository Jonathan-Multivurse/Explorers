import firestore from '@react-native-firebase/firestore'

const requestCollection = firestore().collection('request');

const REQUEST_DB = {
    addRequest: async (type, facility, simulator, time, status, isSchedule, scheduleTime, scheduleTimeZone, description, dialogDic, sender, receiverId, receiver, userAction) => {

        const docid = requestCollection.doc().id
        const doc = {
            requestid: docid,
            facility: facility,
            senderId: sender.userid,
            sender: sender,
            type: type,
            simulator: simulator,
            time: time,
            status: status,            
            isSchedule: isSchedule,
            scheduleTime: scheduleTime,
            scheduleTimeZone: scheduleTimeZone,
            description: description,
            dialog: dialogDic,
            receiver: receiver,
            receiverId: receiverId,
        }
            
        await requestCollection
        .doc(docid)
        .set(doc)
        .then(() => {
            userAction(doc)
        })
    },

    cancelRequest: async (requestID, userAction) => {
        requestCollection
        .doc(requestID)
        .update({
            status: 'cancelled',
        })
        .then(() => {
            userAction()
        })
    },

    getRequest: async (requestID, userAction) => {
        console.log(requestID);

        requestCollection
        .doc(requestID)
        .get()
        .then(documentSnapshot => {

            if (documentSnapshot.exists) {
                userAction(documentSnapshot.data())
            }
        }); 
    },

    completeRequest: async (requestID, userAction) => {
        console.log(requestID);
            
        requestCollection
        .doc(requestID)
        .update({
            status: 'completed',
        })
        .then(() => {
            userAction()
        })
    },
    
    updateRequest: async (requestID, type, facility, simulator, scheduleTime, scheduleTimeZone, description, userAction) => {
        requestCollection
        .doc(requestID)
        .update({
            type: type,
            facility: facility,
            simulator: simulator,
            scheduleTime: scheduleTime,
            scheduleTimeZone: scheduleTimeZone,
            offset: offset,
            description: description
        })
        .then(() => {
            console.log('Request updated!');

            requestCollection
            .doc(requestID)
            .get()
            .then(documentSnapshot => {
                userAction(documentSnapshot.data())
            }); 
            
        });        
    },
    
};

export default REQUEST_DB;