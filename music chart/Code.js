const YOUTUBE_API_KEY = 'AIzaSyDks4prJHzJcfnwN2mHROEfkeOyuiB0wWY'; // Replace with your actual API key

function fetchYouTubeMusicCharts(timeframe, maxResults, sheetName) {
  // We search for the most popular music videos. 
  // videoCategoryId 10 is for Music.
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&order=viewCount&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
  
  const response = UrlFetchApp.fetch(url);
  const data = JSON.parse(response.getContentText());
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  
  // If the sheet doesn't exist, create it
  if (!sheet) {
    SpreadsheetApp.getActiveSpreadsheet().insertSheet(sheetName);
  }
  
  const targetSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  
  // Clear previous data and set headers
  targetSheet.clear();
  targetSheet.appendRow(['Rank', 'Title', 'Channel', 'YouTube Music Link']);
  
  const rows = [];
  let rank = 1;
  
  data.items.forEach(item => {
    const title = item.snippet.title;
    const channel = item.snippet.channelTitle;
    const videoId = item.id.videoId;
    // Format the link exactly for YouTube Music
    const ytMusicLink = `https://music.youtube.com/watch?v=${videoId}`;
    
    rows.push([rank, title, channel, ytMusicLink]);
    rank++;
  });
  
  // Write data to the sheet
  if (rows.length > 0) {
    targetSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
}

// Function to run Weekly Top 10
function updateWeeklyTop10() {
  fetchYouTubeMusicCharts('weekly', 10, 'Weekly Top 10');
}

// Function to run Monthly Top 100
function updateMonthlyTop100() {
  // Note: YouTube API maxResults per page is 50, so for 100 you would typically paginate.
  // For simplicity in this script, we'll pull the maximum allowed in one request (50).
  fetchYouTubeMusicCharts('monthly', 50, 'Monthly Top 50'); 
}