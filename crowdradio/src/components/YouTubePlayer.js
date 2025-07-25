import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { AntDesign } from '@expo/vector-icons';

/**
 * A simplified YouTube audio player component focused solely on audio playback
 * This implementation uses a direct HTML5-friendly approach to improve compatibility
 */
const YouTubePlayer = ({ videoUrl, isHost, onSongEnd }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [playerState, setPlayerState] = useState('loading'); // loading, playing, paused, error
  const [retry, setRetry] = useState(0);
  
  // Extract video ID from YouTube URL
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    
    let videoId = null;
    
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1];
      const ampersandPosition = videoId.indexOf('&');
      if (ampersandPosition !== -1) {
        videoId = videoId.substring(0, ampersandPosition);
      }
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1];
      const questionMarkPosition = videoId.indexOf('?');
      if (questionMarkPosition !== -1) {
        videoId = videoId.substring(0, questionMarkPosition);
      }
    }
    
    return videoId;
  };
  
  const videoId = getYouTubeVideoId(videoUrl);
  
  if (!videoId) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Invalid YouTube URL</Text>
      </View>
    );
  }

  // Simple, minimal HTML for reliable audio playback
  // This uses multiple playback approaches for better compatibility
  const simpleAudioHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          body {
            margin: 0;
            padding: 10px;
            background-color: #2C3E50;
            color: white;
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100vh;
            overflow: hidden;
          }
          
          .audio-player {
            width: 100%;
            max-width: 500px;
            margin: 0 auto;
            text-align: center;
          }
          
          .audio-title {
            font-size: 16px;
            font-weight: bold;
            margin: 10px 0;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .controls {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin: 15px 0;
          }
          
          .control-button {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: #3498db;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .progress {
            width: 100%;
            height: 6px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
            position: relative;
            margin: 10px 0;
          }
          
          .progress-bar {
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            background: #3498db;
            border-radius: 3px;
            width: 0%;
            transition: width 0.3s ease;
          }
          
          .time-info {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
          }
          
          .status {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            margin-top: 10px;
          }
          
          .visualizer {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 40px;
            gap: 2px;
            margin: 10px 0;
          }
          
          .bar {
            width: 3px;
            height: 3px;
            background: #3498db;
            border-radius: 1px;
          }
          
          .bar.active {
            animation: pulse 1s infinite;
          }
          
          @keyframes pulse {
            0% { height: 3px; }
            50% { height: 20px; }
            100% { height: 3px; }
          }

          #youtube-embed {
            position: absolute;
            opacity: 0.01;
            pointer-events: none;
            width: 5px;
            height: 5px;
          }
        </style>
      </head>
      <body>
        <div class="audio-player">
          <div class="audio-title" id="title">Loading audio...</div>
          
          <div class="visualizer" id="visualizer">
            <!-- Bars will be added dynamically -->
          </div>
          
          <div class="progress">
            <div class="progress-bar" id="progress"></div>
          </div>
          
          <div class="time-info">
            <span id="current-time">0:00</span>
            <span id="duration">0:00</span>
          </div>
          
          <div class="controls">
            <button class="control-button" id="play-pause" onclick="togglePlayback()">▶</button>
            <button class="control-button" id="volume" onclick="toggleMute()">🔊</button>
          </div>
          
          <div class="status" id="status">Connecting...</div>
        </div>
        
        <!-- Hidden container for audio -->
        <div style="position:absolute;top:-999px;left:-999px;">
          <div id="player-container"></div>
        </div>
        
        <script>
          // Config
          const videoId = "${videoId}";
          const isHost = ${isHost};
          let player = null;
          let isPlaying = false;
          let isMuted = false;
          let currentTime = 0;
          let duration = 0;
          let progressInterval = null;
          let checkEndInterval = null;
          let heartbeatInterval = null;
          let playerType = null; // 'iframe' or 'api'
          
          // Create visualizer bars
          function setupVisualizer() {
            const visualizer = document.getElementById('visualizer');
            visualizer.innerHTML = '';
            
            for (let i = 0; i < 20; i++) {
              const bar = document.createElement('div');
              bar.className = 'bar';
              bar.style.animationDelay = \`\${i * 0.05}s\`;
              visualizer.appendChild(bar);
            }
          }
          
          // Format time in MM:SS
          function formatTime(seconds) {
            if (isNaN(seconds) || seconds === Infinity) return '0:00';
            const min = Math.floor(seconds / 60);
            const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
            return \`\${min}:\${sec}\`;
          }
          
          // Try multiple playback approaches for better compatibility
          function initPlayer() {
            try {
              // First try with simple iframe embed (most compatible)
              createIframeEmbed();
              
              // Also try YT API as backup
              loadYoutubeAPI();
              
              // Start heartbeat to communicate with React Native
              heartbeatInterval = setInterval(() => {
                window.ReactNativeWebView.postMessage('HEARTBEAT');
              }, 5000);
            } catch (err) {
              console.error('Player init error:', err);
              window.ReactNativeWebView.postMessage('INIT_ERROR:' + err.message);
              updateStatus('Error initializing player');
            }
          }
          
          // Create direct iframe embed (simpler approach)
          function createIframeEmbed() {
            try {
              // Create an iframe with autoplay
              const container = document.getElementById('player-container');
              container.innerHTML = \`
                <iframe 
                  id="youtube-embed"
                  src="https://www.youtube.com/embed/\${videoId}?enablejsapi=1&autoplay=1&controls=0&playsinline=1&origin=\${window.location.origin}"
                  allow="autoplay; encrypted-media" 
                  allowfullscreen
                ></iframe>
              \`;
              
              // Mark player as ready
              playerType = 'iframe';
              window.ReactNativeWebView.postMessage('PLAYER_READY');
              updateStatus(isHost ? 'Playing' : 'Ready');
              setupVisualizer();
              activateVisualizer(true);
              
              // Set up timer for progress tracking (since we can't get it from iframe)
              startProgressSimulation();
              
              // Check if playback is actually happening
              setTimeout(checkPlaybackStarted, 2000);
              
              // Set up check for song end
              setupEndDetection();
            } catch (e) {
              window.ReactNativeWebView.postMessage('IFRAME_ERROR:' + e.toString());
            }
          }
          
          // Check if audio is actually playing
          function checkPlaybackStarted() {
            // No reliable way to check, so we just assume it's playing
            window.ReactNativeWebView.postMessage('PLAYBACK_ASSUMED_STARTED');
            isPlaying = true;
            document.getElementById('play-pause').textContent = '❚❚';
            activateVisualizer(true);
          }
          
          // Load YouTube API as a fallback
          function loadYoutubeAPI() {
            window.onYouTubeIframeAPIReady = function() {
              // Only use API if iframe embed failed
              if (playerType !== 'iframe') {
                initYouTubePlayer();
              }
            };
            
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScript = document.getElementsByTagName('script')[0];
            firstScript.parentNode.insertBefore(tag, firstScript);
          }
          
          // Initialize YouTube player with API
          function initYouTubePlayer() {
            try {
              player = new YT.Player('youtube-embed', {
                videoId: videoId,
                playerVars: {
                  autoplay: 1,
                  controls: 0,
                  playsinline: 1,
                  origin: window.location.origin
                },
                events: {
                  'onReady': onPlayerReady,
                  'onStateChange': onPlayerStateChange,
                  'onError': onPlayerError
                }
              });
              playerType = 'api';
            } catch (err) {
              window.ReactNativeWebView.postMessage('YT_API_ERROR:' + err.toString());
            }
          }
          
          // YouTube API callbacks
          function onPlayerReady(event) {
            if (isHost) {
              event.target.playVideo();
              document.getElementById('play-pause').textContent = '❚❚';
            }
            window.ReactNativeWebView.postMessage('API_PLAYER_READY');
            
            // Try to get video title
            try {
              const videoData = player.getVideoData();
              if (videoData && videoData.title) {
                document.getElementById('title').textContent = videoData.title;
                window.ReactNativeWebView.postMessage('TITLE:' + videoData.title);
              }
            } catch (e) {}
          }
          
          function onPlayerStateChange(event) {
            if (event.data === YT.PlayerState.PLAYING) {
              isPlaying = true;
              document.getElementById('play-pause').textContent = '❚❚';
              activateVisualizer(true);
              updateStatus('Playing');
            } else if (event.data === YT.PlayerState.PAUSED) {
              isPlaying = false;
              document.getElementById('play-pause').textContent = '▶';
              activateVisualizer(false);
              updateStatus('Paused');
            } else if (event.data === YT.PlayerState.ENDED) {
              isPlaying = false;
              document.getElementById('play-pause').textContent = '▶';
              activateVisualizer(false);
              updateStatus('Ended');
              
              if (isHost) {
                window.ReactNativeWebView.postMessage('VIDEO_ENDED');
              }
            } else if (event.data === YT.PlayerState.BUFFERING) {
              updateStatus('Buffering...');
            }
          }
          
          function onPlayerError(event) {
            window.ReactNativeWebView.postMessage('YT_ERROR:' + event.data);
            updateStatus('Playback error');
          }
          
          // Toggle play/pause
          function togglePlayback() {
            if (playerType === 'api' && player) {
              if (isPlaying) {
                player.pauseVideo();
              } else {
                player.playVideo();
              }
            } else {
              // For iframe, we don't have real control
              isPlaying = !isPlaying;
              document.getElementById('play-pause').textContent = isPlaying ? '❚❚' : '▶';
              activateVisualizer(isPlaying);
              updateStatus(isPlaying ? 'Playing' : 'Paused');
            }
          }
          
          // Toggle mute
          function toggleMute() {
            isMuted = !isMuted;
            document.getElementById('volume').textContent = isMuted ? '🔇' : '🔊';
            
            if (playerType === 'api' && player) {
              if (isMuted) {
                player.mute();
              } else {
                player.unMute();
              }
            }
            
            // For iframe we can only notify the user
            updateStatus(isMuted ? 'Audio muted' : 'Audio unmuted');
          }
          
          // Simulate progress for iframe embed
          function startProgressSimulation() {
            // Estimate a typical song length
            duration = 240; // 4 minutes
            
            progressInterval = setInterval(() => {
              if (isPlaying && !isMuted) {
                currentTime++;
                
                // Update progress bar
                const percent = (currentTime / duration) * 100;
                document.getElementById('progress').style.width = percent + '%';
                
                // Update time display
                document.getElementById('current-time').textContent = formatTime(currentTime);
                document.getElementById('duration').textContent = formatTime(duration);
              }
            }, 1000);
          }
          
          // Setup song end detection
          function setupEndDetection() {
            checkEndInterval = setInterval(() => {
              if (currentTime >= duration) {
                clearInterval(progressInterval);
                clearInterval(checkEndInterval);
                
                if (isHost) {
                  window.ReactNativeWebView.postMessage('VIDEO_ENDED');
                }
                
                isPlaying = false;
                document.getElementById('play-pause').textContent = '▶';
                activateVisualizer(false);
                updateStatus('Ended');
              }
            }, 1000);
          }
          
          // Update status message
          function updateStatus(message) {
            document.getElementById('status').textContent = message;
          }
          
          // Activate/deactivate visualizer
          function activateVisualizer(active) {
            const bars = document.getElementsByClassName('bar');
            for (let i = 0; i < bars.length; i++) {
              if (active) {
                bars[i].classList.add('active');
              } else {
                bars[i].classList.remove('active');
              }
            }
          }
          
          // Initialize player
          setupVisualizer();
          initPlayer();
        </script>
      </body>
    </html>
  `;

  // Handle messages from WebView
  const handleWebViewMessage = (event) => {
    const message = event.nativeEvent.data;
    
    if (message === 'PLAYER_READY' || message === 'API_PLAYER_READY') {
      setLoading(false);
      setPlayerReady(true);
      setPlayerState('playing');
    } 
    else if (message === 'VIDEO_ENDED') {
      onSongEnd && onSongEnd();
    } 
    else if (message.startsWith('TITLE:')) {
      console.log('Song title:', message.substring(6));
    }
    else if (message.startsWith('YT_ERROR:') || message.startsWith('IFRAME_ERROR:') || message.startsWith('INIT_ERROR:')) {
      console.log('Player error:', message);
      if (!playerReady) {
        setError(true);
        setPlayerState('error');
      }
    }
    // All other messages are just logged for debugging
    else if (!message.startsWith('HEARTBEAT')) {
      console.log('Player message:', message);
    }
  };

  // Retry mechanism for errors
  useEffect(() => {
    if (error) {
      const retryTimer = setTimeout(() => {
        console.log('Attempting to reload player...');
        setError(false);
        setLoading(true);
        setRetry(prev => prev + 1);
      }, 5000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [error]);

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading audio...</Text>
        </View>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <AntDesign name="warning" size={24} color="#FFCC00" />
          <Text style={styles.errorText}>Failed to load audio</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setError(false);
              setLoading(true);
              setPlayerReady(false);
              setRetry(prev => prev + 1);
            }}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      
      <WebView
        key={`player-${retry}`}
        style={styles.webView}
        originWhitelist={['*']}
        source={{ html: simpleAudioHTML }}
        onMessage={handleWebViewMessage}
        mediaPlaybackRequiresUserAction={false} // Important for autoplay
        allowsInlineMediaPlayback={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        mixedContentMode="always"
        androidLayerType="hardware"
        bounces={false}
        scrollEnabled={false}
        automaticallyAdjustContentInsets={false}
        onError={() => {
          setError(true);
          setLoading(false);
        }}
        startInLoadingState={true}
        onLoadEnd={() => {
          // Backup in case player ready message is never received
          setTimeout(() => {
            if (loading) setLoading(false);
          }, 8000);
        }}
      />
      
      {playerReady && (
        <View style={styles.audioIndicator}>
          <AntDesign name="sound" size={16} color="#3498db" />
          <Text style={styles.audioText}>{isHost ? "Playing audio" : "Audio ready"}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 120, // Smaller height for audio-only player
    width: '100%',
    backgroundColor: '#2C3E50',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
  },
  webView: {
    flex: 1,
    opacity: 0.99, // Fix for Android WebView rendering issues
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2C3E50',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#2C3E50',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  errorText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold',
  },
  audioIndicator: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    paddingVertical: 5,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  audioText: {
    color: 'white',
    fontSize: 12,
    marginLeft: 5,
  }
});

export default YouTubePlayer;
