import { Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { FontAwesome } from '@expo/vector-icons';
import { Permissions } from 'expo';
import { firebase } from '@react-native-firebase/app';
import storage from '@react-native-firebase/storage';


const firebaseConfig = {
  apiKey: 'AIzaSyBQBLgDsVv3Tl0oWizGaAHQ6WYXh0v_CUs',
  authDomain: 'the-app-7f567.firebaseapp.com',
  projectId: 'the-app-7f567',
  storageBucket: 'the-app-7f567.appspot.com',
  messagingSenderId: '398014330647',
  appId: '1:398014330647:web:a03202093f78f5a56aa952',
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default function App() {
  const [recording, setRecording] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [audioPermission, setAudioPermission] = useState(null);

  useEffect(() => {
    async function getPermissionsAsync() {
      const { status } = await Permissions.askAsync(Permissions.AUDIO_RECORDING);
      if (status === 'granted') {
        setAudioPermission(true);
        console.log('Audio recording permission granted');
      } else {
        setAudioPermission(false);
        console.error('Audio recording permission not granted');
      }
    }

    // Call function to get permission
    getPermissionsAsync();

    // Cleanup upon first render
    return () => {
      if (recording) {
        stopRecording();
      }
    };
  }, []);

  async function startRecording() {
    try {
      // needed for iOS
      if (audioPermission) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }

      const newRecording = new Audio.Recording();
      console.log('Starting Recording');
      await newRecording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await newRecording.startAsync();
      setRecording(newRecording);
      setRecordingStatus('recording');
    } catch (error) {
      console.error('Failed to start recording', error);
    }
  }

  async function stopRecording() {
    try {
      if (recordingStatus === 'recording' && recording) {
        console.log('Stopping Recording');
        await recording.stopAndUnloadAsync();
        const recordingUri = recording.getURI();

        // Create a file name for the recording
        const fileName = `recording-${Date.now()}.caf`;

        // Upload the recording to Firebase Storage
        const reference = storage().ref(`recordings/${fileName}`);
        await reference.putFile(recordingUri);

        // Get the download URL for the uploaded file
        const downloadURL = await reference.getDownloadURL();

        // Now you can use the downloadURL as needed, e.g., store it in your database

        // This is for simply playing the sound back
        const playbackObject = new Audio.Sound();
        await playbackObject.loadAsync({ uri: downloadURL });
        await playbackObject.playAsync();

        // reset our states to record again
        setRecording(null);
        setRecordingStatus('stopped');
      }
    } catch (error) {
      console.error('Failed to stop recording', error);
    }
  }

  async function handleRecordButtonPress() {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={handleRecordButtonPress}>
        <FontAwesome name={recording ? 'stop-circle' : 'circle'} size={64} color="white" />
      </TouchableOpacity>
      <Text style={styles.recordingStatusText}>{`Recording status: ${recordingStatus}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: 'red',
  },
  recordingStatusText: {
    marginTop: 16,
  },
});