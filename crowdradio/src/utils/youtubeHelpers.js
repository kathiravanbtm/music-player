
/**
 * Extract YouTube video ID from a URL
 * @param {string} url - YouTube URL
 * @returns {string|null} - YouTube video ID or null if invalid
 */
export const getYouTubeVideoId = (url) => {
  if (!url) return null;
  
  // Try to match various YouTube URL formats
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  
  return (match && match[2].length === 11) ? match[2] : null;
};

/**
 * Fetch YouTube video title using oEmbed API
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<string|null>} - Video title or null if failed
 */
export const fetchVideoTitle = async (videoId) => {
  try {
    // Use YouTube oEmbed endpoint to get video information
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    
    if (response.ok) {
      const data = await response.json();
      return data.title;
    }
    return null;
  } catch (error) {
    console.error('Error fetching video title:', error);
    return null;
  }
};

/**
 * Check if a YouTube URL is valid
 * @param {string} url - URL to check
 * @returns {boolean} - Whether the URL is a valid YouTube URL
 */
export const isValidYouTubeUrl = (url) => {
  // First check if we have a URL
  if (!url || typeof url !== 'string') return false;
  
  // Then check if it's a YouTube domain
  if (!url.includes('youtube.com/') && !url.includes('youtu.be/')) {
    return false;
  }
  
  // Finally check if we can extract a valid ID
  return getYouTubeVideoId(url) !== null;
};

/**
 * Convert YouTube video ID to a thumbnail URL
 * @param {string} videoId - YouTube video ID
 * @returns {string} - URL to the YouTube thumbnail image
 */
export const getYouTubeThumbnail = (videoId) => {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
};

/**
 * Convert seconds to a formatted time string (MM:SS)
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string
 */
export const formatTime = (seconds) => {
  if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};
