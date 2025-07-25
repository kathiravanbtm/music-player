import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for storage
const KEYS = {
  LOCAL_SONGS: 'crowdradio_local_songs',
  USER_PREFERENCES: 'crowdradio_user_preferences',
  RECENT_ROOMS: 'crowdradio_recent_rooms',
};

/**
 * Save songs to local storage
 * @param {Array} songs - Array of song objects to save
 * @param {string} roomId - Room ID to associate with songs
 */
export const saveLocalSongs = async (songs, roomId) => {
  try {
    // Use room ID as key to separate songs for different rooms
    const key = `${KEYS.LOCAL_SONGS}_${roomId}`;
    await AsyncStorage.setItem(key, JSON.stringify(songs));
    return true;
  } catch (error) {
    console.error('Error saving local songs:', error);
    return false;
  }
};

/**
 * Load songs from local storage
 * @param {string} roomId - Room ID to get songs for
 */
export const loadLocalSongs = async (roomId) => {
  try {
    const key = `${KEYS.LOCAL_SONGS}_${roomId}`;
    const songsJson = await AsyncStorage.getItem(key);
    return songsJson ? JSON.parse(songsJson) : [];
  } catch (error) {
    console.error('Error loading local songs:', error);
    return [];
  }
};

/**
 * Save user preferences
 * @param {Object} preferences - User preferences object
 */
export const saveUserPreferences = async (preferences) => {
  try {
    // Get existing preferences first
    const existingPrefs = await getUserPreferences();
    const updatedPrefs = { ...existingPrefs, ...preferences };
    await AsyncStorage.setItem(KEYS.USER_PREFERENCES, JSON.stringify(updatedPrefs));
    return true;
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return false;
  }
};

/**
 * Get user preferences
 * @returns {Object} User preferences
 */
export const getUserPreferences = async () => {
  try {
    const prefsJson = await AsyncStorage.getItem(KEYS.USER_PREFERENCES);
    return prefsJson ? JSON.parse(prefsJson) : {};
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return {};
  }
};

/**
 * Save a room to recent rooms list
 * @param {Object} room - Room object with id, name, and last visited time
 */
export const saveRecentRoom = async (room) => {
  try {
    // Get existing rooms first
    const existingRooms = await getRecentRooms();
    
    // Filter out this room if it already exists to avoid duplicates
    const filteredRooms = existingRooms.filter(r => r.numericRoomId !== room.numericRoomId);
    
    // Add this room to the beginning of the list (most recent)
    const updatedRooms = [room, ...filteredRooms].slice(0, 5); // Keep only the 5 most recent
    
    await AsyncStorage.setItem(KEYS.RECENT_ROOMS, JSON.stringify(updatedRooms));
    return true;
  } catch (error) {
    console.error('Error saving recent room:', error);
    return false;
  }
};

/**
 * Get list of recently visited rooms
 * @returns {Array} List of recent room objects
 */
export const getRecentRooms = async () => {
  try {
    const roomsJson = await AsyncStorage.getItem(KEYS.RECENT_ROOMS);
    return roomsJson ? JSON.parse(roomsJson) : [];
  } catch (error) {
    console.error('Error getting recent rooms:', error);
    return [];
  }
};

/**
 * Clear all app data (for debugging)
 */
export const clearAllData = async () => {
  try {
    await AsyncStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing storage:', error);
    return false;
  }
};
