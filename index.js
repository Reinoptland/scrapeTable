const axios = require("axios");
const { JSDOM } = require("jsdom");
const fs = require("fs");

function findLeagueTable(tables) {
  for (table of tables) {
    const headings = table.querySelectorAll("th");
    for (heading of headings) {
      if (heading.textContent.includes("Pos")) {
        return table;
      }
    }
  }
  return null;
}

async function scrape() {
  const url = "https://en.wikipedia.org/wiki/2006%E2%80%9307_Eredivisie";
  const response = await axios.get(url);
  const html = response.data;

  const jsdom = new JSDOM(html);
  const document = jsdom.window.document;

  const tables = document.querySelectorAll("table");
  let tableToScrape = findLeagueTable(tables);
  if (!tableToScrape) return console.log("Table not found for", url);

  const [headings, ...rows] = tableToScrape.querySelectorAll("tr");

  let results = [];
  for (row of rows) {
    const [position, team, matchesPlayed, wins, draws, losses] =
      row.querySelectorAll("td, th");

    const teamName = team.querySelector("a").textContent;
    const teamPosition = parseInt(position.textContent);
    const matchCount = parseInt(matchesPlayed.textContent);
    const winCount = parseInt(wins.textContent);
    const drawCount = parseInt(draws.textContent);
    const lossesCount = parseInt(losses.textContent);

    const teamResults = {
      name: teamName,
      position: teamPosition,
      matchesPlayed: matchCount,
      wins: winCount,
      draws: drawCount,
      losses: lossesCount,
    };

    results.push(teamResults);
  }

  const year = url.match(/\d{4}/)[0];

  fs.writeFileSync(`${year}.json`, JSON.stringify(results));
}

scrape();
