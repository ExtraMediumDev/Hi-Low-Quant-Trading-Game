import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Button } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import io from 'socket.io-client';

const socket = io('http://192.168.84.169:5000');

interface Player {
  username: string;
}

interface WaitingRoomProps {
  currentPlayers?: Player[];
  minPlayers?: number;
}

export default function WaitingRoom({ currentPlayers = [], minPlayers = 4 }: WaitingRoomProps) {
  const { roomName, roomId, username, num_players, player_list, host_username } = useLocalSearchParams();
  const [dots, setDots] = useState('.');
  const [players, setPlayers] = useState<string[]>(
    Array.isArray(player_list) ? player_list : player_list.split(",")
  );
  const [isHost, setIsHost] = useState(username === host_username);

  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to Socket.IO server');
    });
  
    socket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
    });

    socket.on('player_joined', (data) => {
      console.log('player_joined', data);
      setPlayers((prevPlayers) => [...prevPlayers, data.username]);
    });

    socket.on('player_left', (data) => {
      setPlayers((prevPlayers) => prevPlayers.filter((player) => player !== data.username));
    });

    return () => {
      socket.off('player_joined');
      socket.off('player_left');
    };
  }, []);

  useEffect(() => {
      const disconnect = () => {
        navigator.sendBeacon(
          'http://localhost:5000/disconnect',
          JSON.stringify({ roomId, username })
        );
      };
    
      window.addEventListener('beforeunload', disconnect);
      
      return () => {
        disconnect();
        window.removeEventListener('beforeunload', disconnect);
      };
    }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => (prev.length < 3 ? prev + '.' : '.'));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  const playersNeeded = Math.max(0, minPlayers - Number(num_players));

  const handleStartGame = () => {
    socket.emit('start_game', { roomId });
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Trading Game</Text>
        <View style={styles.content}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>
              {playersNeeded > 0
                ? `Waiting for ${playersNeeded} more player${playersNeeded !== 1 ? 's' : ''} to start the game${dots}`
                : `Game is ready to start${dots}`
              }
            </Text>
          </View>
          <View style={styles.playersContainer}>
            <Text style={styles.playersTitle} >Current Players:</Text>
              {players.length > 0 ? (
                players.map((item, index) => (
                  <View key={index} style = {styles.badge}>
                    <Text style={styles.badgeText}>{item}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noPlayersText} >No players have joined yet.</Text>
              )}
          </View>
          {players.length >= minPlayers && isHost && (
            <Button title="Start Game" onPress={handleStartGame} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f9ff', // Light blue background
  },
  card: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
    color: '#1e3a8a', // Dark blue text
  },
  content: {
    padding: 16,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
    color: '#374151', // Gray text
  },
  playersContainer: {
    marginTop: 16,
  },
  playersTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151', // Gray text
  },
  playersList: {
    justifyContent: 'space-between',
  },
  badge: {
    backgroundColor: '#e2e8f0', // Light gray background
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    margin: 4,
  },
  badgeText: {
    fontSize: 14,
    color: '#1e293b', // Dark gray text
  },
  noPlayersText: {
    fontSize: 14,
    color: '#64748b', // Light gray text
    textAlign: 'center',
  },
});