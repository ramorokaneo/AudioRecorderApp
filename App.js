import React, { useEffect, useState } from 'react';
import { Text, TouchableOpacity, View, StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { FontAwesome } from '@expo/vector-icons';
import { Permissions } from 'expo';

export default function App() {
  const [recording, setRecording] = useState(null);
  const [recordingStatus, setRecordingStatus] = useState('idle');
  const [audioPermission, setAudioPermission] = useState(null);
  const [recordedAudioList, setRecordedAudioList] = useState([]);

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

    getPermissionsAsync();

    return () => {
      if (recording) {
        stopRecording();
      }
    };
  }, []);

  async function startRecording() {
    try {
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

        const fileName = `recording-${Date.now()}.caf`;

        const newDirectory = FileSystem.documentDirectory + 'recordings/';
        await FileSystem.makeDirectoryAsync(newDirectory, { intermediates: true });
        const newRecordingUri = newDirectory + fileName;
        await FileSystem.moveAsync({
          from: recordingUri,
          to: newRecordingUri,
        });

        const playbackObject = new Audio.Sound();
        await playbackObject.loadAsync({ uri: newRecordingUri });

        setRecordedAudioList((prevList) => [
          ...prevList,
          { id: Date.now().toString(), fileName, playbackObject },
        ]);

        setRecording(null);
        setRecordingStatus('stopped');
      }
    } catch (error) {
      console.error('Failed to stop recording', error);
    }
  }

  const handleRecordButtonPress = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handlePlayback = async (playbackObject) => {
    try {
      await playbackObject.replayAsync();
    } catch (error) {
      console.error('Failed to replay audio', error);
    }
  };

  const handlePlayButtonPress = async (item) => {
    try {
      await item.playbackObject.replayAsync();
    } catch (error) {
      console.error('Failed to replay audio', error);
    }
  };

  const handleDeleteButtonPress = async (item) => {
    try {
      // Stop playback if it's currently playing
      if (item.playbackObject._loaded) {
        await item.playbackObject.unloadAsync();
      }

      // Delete the audio file from the file system using the constructed file path
      const filePath = FileSystem.documentDirectory + 'recordings/' + item.fileName;
      await FileSystem.deleteAsync(filePath);

      // Remove the item from the recordedAudioList
      setRecordedAudioList((prevList) => prevList.filter((audioItem) => audioItem.id !== item.id));
    } catch (error) {
      console.error('Failed to delete audio', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.innerContainer}>
        <TouchableOpacity style={styles.button} onPress={handleRecordButtonPress}>
          <FontAwesome name={recording ? 'stop-circle' : 'circle'} size={64} color="white" />
        </TouchableOpacity>
        <Text style={styles.recordingStatusText}>{`Recording status: ${recordingStatus}`}</Text>

        <FlatList
          data={recordedAudioList}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.audioItem}>
              <Text>{item.fileName}</Text>
              <View style={styles.audioButtons}>
                <TouchableOpacity onPress={() => handlePlayButtonPress(item)}>
                  <FontAwesome name="play-circle" size={32} color="green" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteButtonPress(item)}>
                  <FontAwesome name="trash" size={32} color="red" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
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
    backgroundColor: 'purple',
    marginTop: 96,
  },
  recordingStatusText: {
    marginTop: 26,
  },
  audioItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 12,
    padding: 16,
    backgroundColor: 'blue',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    
  },
  audioButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: 64,
  },
});
