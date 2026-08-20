/**
 * ETHIOPIAN MUSIC CHART (BILLBOARD-STYLE) AUTOMATION
 */

// 1. WEB API ENDPOINT (GET REQUESTS)
function doGet(e) {
  var action = e.parameter.action;
  var timeframe = e.parameter.timeframe || "weekly"; // weekly, monthly, 3month, yearly
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  if (action === "getChart") {
    var entriesSheet = ss.getSheetByName("Chart_Entries");
    var tracksSheet = ss.getSheetByName("Tracks");
    var linksSheet = ss.getSheetByName("Platform_Links");

    var entries = entriesSheet.getDataRange().getValues();
    var tracks = tracksSheet.getDataRange().getValues();
    var links = linksSheet.getDataRange().getValues();

    // Map Youtube direct watch URLs
    var linkMap = {};
    for (var l = 1; l < links.length; l++) {
      if (links[l][2] === "YouTube") {
        linkMap[links[l][1]] = links[l][3]; // map track_id to youtube URL
      }
    }

    // Map Track Metadata
    var trackMap = {};
    for (var j = 1; j < tracks.length; j++) {
      var trackId = tracks[j][0];
      trackMap[trackId] = {
        title_en: tracks[j][2],
        title_am: tracks[j][3],
        artist: tracks[j][1],
        cover_art: tracks[j][5],
        youtube_url: linkMap[trackId] || "https://youtube.com"
      };
    }

    var resultChart = [];
    for (var k = 1; k < entries.length; k++) {
      var entryStatus = entries[k][8]; // Status / Category string
      var tId = entries[k][2];
      var tDetails = trackMap[tId] || {};

      // Filter based on requested timeframe parameter
      var include = false;
      if (timeframe === "weekly" && entryStatus.includes("WEEKLY")) include = true;
      else if (timeframe === "monthly" && entryStatus.includes("MONTHLY")) include = true;
      else if (timeframe === "3month" && entryStatus.includes("3MONTH")) include = true;
      else if (timeframe === "yearly" && entryStatus.includes("YEARLY")) include = true;
      else if (timeframe === "all") include = true;

      if (include) {
        resultChart.push({
          rank: entries[k][3],
          previous_rank: entries[k][4],
          status: entryStatus,
          title: tDetails.title_en,
          title_amharic: tDetails.title_am,
          artist: tDetails.artist,
          streams: entries[k][7],
          cover_art: tDetails.cover_art,
          youtube_url: tDetails.youtube_url,
          track_id: tId
        });
      }
    }

    return ContentService.createTextOutput(JSON.stringify(resultChart))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ status: "API Active" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// 2. LIVE YOUTUBE CHART DATA GENERATOR
function generateEthiopianMusicCharts() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tracksSheet = ss.getSheetByName("Tracks");
  var entriesSheet = ss.getSheetByName("Chart_Entries");
  var linksSheet = ss.getSheetByName("Platform_Links");

  // Search YouTube for 100 hits
  var searchResponse = YouTube.Search.list('id,snippet', {
    q: 'Ethiopian Music 2026 OR Amharic Music 2026',
    type: 'video',
    maxResults: 50,
    order: 'viewCount',
    regionCode: 'ET'
  });

  var items = searchResponse.items;
  if (!items || items.length === 0) return;

  var tracksData = [];
  var entriesData = [];
  var linksData = [];

  for (var i = 0; i < items.length; i++) {
    var video = items[i];
    var videoId = video.id.videoId;
    var title = video.snippet.title;
    var channelTitle = video.snippet.channelTitle;
    var thumbnailUrl = video.snippet.thumbnails.high.url;

    var statsResponse = YouTube.Videos.list('statistics', { id: videoId });
    var views = statsResponse.items[0] ? parseInt(statsResponse.items[0].statistics.viewCount) : 0;

    var trackId = "TRK-" + (i + 1);
    var rank = i + 1;
    var youtubeWatchUrl = "https://www.youtube.com/watch?v=" + videoId;

    // Timeframe tagging logic
    var statusTag = "WEEKLY";
    if (rank <= 10) statusTag = "WEEKLY";
    else if (rank <= 25) statusTag = "MONTHLY";
    else if (rank <= 40) statusTag = "3MONTH";
    else statusTag = "YEARLY";

    tracksData.push([trackId, channelTitle, title, "", new Date(), thumbnailUrl, true]);
    entriesData.push(["ENT-" + (i + 1), "CHT-2026", trackId, rank, "", rank, 1, views, statusTag]);
    linksData.push(["LNK-" + (i + 1), trackId, "YouTube", youtubeWatchUrl, true, "Official Video"]);
  }

  tracksSheet.getRange("A2:G").clearContent();
  entriesSheet.getRange("A2:I").clearContent();
  linksSheet.getRange("A2:F").clearContent();

  tracksSheet.getRange(2, 1, tracksData.length, 7).setValues(tracksData);
  entriesSheet.getRange(2, 1, entriesData.length, 9).setValues(entriesData);
  linksSheet.getRange(2, 1, linksData.length, 6).setValues(linksData);
}
