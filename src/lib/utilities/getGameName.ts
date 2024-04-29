import { base } from "$app/paths";
import initSqlJs from "sql.js";
import sqlWasmUrl from "sql.js/dist/sql-wasm.wasm?url";


export const getGameName = async (gameid: string) => {
  const response = await fetch(`${base}/gameid.db`);
  const data = await response.arrayBuffer();
  const SQL = await initSqlJs({
    locateFile: () => sqlWasmUrl,
  });

  let db = new SQL.Database(new Uint8Array(data));
  let gamename = db.exec('SELECT name FROM \'games\' WHERE id="'
    + gameid + '" LIMIT 1');

  return gamename[0]?.values[0][0]
};

export default getGameName;
