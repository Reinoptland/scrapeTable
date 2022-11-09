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

async function scrapeLeagueTable(url) {
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
    if (!team) continue;

    const teamName =
      team.querySelector("a")?.textContent || team.textContent || null;
    const teamPosition = parseInt(position?.textContent);
    const matchCount = parseInt(matchesPlayed?.textContent);
    const winCount = parseInt(wins?.textContent);
    const drawCount = parseInt(draws?.textContent);
    const lossesCount = parseInt(losses?.textContent);

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

// scrapeLeagueTable("https://en.wikipedia.org/wiki/2006%E2%80%9307_Eredivisie");

async function scrapeSeasons() {
  const response = await axios.get(
    "https://en.wikipedia.org/wiki/List_of_Dutch_football_champions"
  );
  const html = response.data;

  const jsdom = new JSDOM(html);
  const document = jsdom.window.document;

  const tables = document.querySelectorAll("table");
  const seasonTables = [];

  for (table of tables) {
    if (table.querySelector("th").textContent.includes("Season")) {
      seasonTables.push(table);
    }
  }

  const wikipediaLinks = [];

  for (seasonTable of seasonTables) {
    const body = seasonTable.querySelector("tbody");
    const rows = body.querySelectorAll("tr");
    console.log(rows.length);
    for (row of rows) {
      const seasonCell = row.querySelector("td");
      console.log(seasonCell);
      if (seasonCell) {
        const link = seasonCell.querySelector("a")?.href;
        if (link) {
          wikipediaLinks.push(link);
        }
      }
    }
  }

  console.log(wikipediaLinks);
  for (const link of wikipediaLinks) {
    scrapeLeagueTable(`https://en.wikipedia.org${link}`);
  }
}

scrapeSeasons();
