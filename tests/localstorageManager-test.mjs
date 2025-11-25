// localStorageManager-tests.mjs

import { 
  LocalStorageManager, 
  LocalStorageRoundManager
} from '../testImports/localstorageManager.js';

import { 
  localstorageRoundObjectsKey, 
  localstorageDateKey, 
  localstorageIDKey, 
  localstorageValueKey,
  getRound,
  setRound
} from '../testImports/sketchSetup.js';

import { runner } from './testClass.js';

// ---- Mock localStorage ----
global.localStorage = {
  store: {},

  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key)
      ? this.store[key]
      : null;
  },

  setItem(key, value) {
    this.store[key] = String(value);
  },

  removeItem(key) {
    delete this.store[key];
  },

  clear() {
    this.store = {};
  },

  get length() {
    return Object.keys(this.store).length;
  }
};

// Utility for deep equal
function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}


// ------------------------------------------------------
// MockLocalStorage Tests
// ------------------------------------------------------

runner.test("MockLocalStorage: should store and retrieve string values", function () {
  localStorage.clear();

  localStorage.setItem("test", "value");
  this.assertEquals(localStorage.getItem("test"), "value");
});

runner.test("MockLocalStorage: should handle JSON data correctly", function () {
  localStorage.clear();
  const testData = { array: [1, 2, 3] };

  localStorage.setItem("json", JSON.stringify(testData));
  const retrieved = JSON.parse(localStorage.getItem("json"));

  this.assertTrue(deepEqual(retrieved, testData), "JSON should match original object");
});

runner.test("MockLocalStorage: should track length correctly", function () {
  localStorage.clear();

  this.assertEquals(localStorage.length, 0);

  localStorage.setItem("key1", "value1");
  this.assertEquals(localStorage.length, 1);

  localStorage.setItem("key2", "value2");
  this.assertEquals(localStorage.length, 2);

  localStorage.removeItem("key1");
  this.assertEquals(localStorage.length, 1);
});


// ------------------------------------------------------
// LocalStorageManager Tests
// ------------------------------------------------------

runner.test("LocalStorageManager.getArrayObject: empty storage returns empty array", function () {
  localStorage.clear();
  const manager = new LocalStorageManager();

  const result = manager.getArrayObject("empty");

  this.assertTrue(Array.isArray(result));
  this.assertEquals(result.length, 0);
});

runner.test("LocalStorageManager.getArrayObject: parses stored arrays", function () {
  localStorage.clear();

  localStorage.setItem("arrayKey", JSON.stringify([{ id: 1 }, { id: 2 }]));
  const manager = new LocalStorageManager();

  const result = manager.getArrayObject("arrayKey");

  this.assertTrue(deepEqual(result, [{ id: 1 }, { id: 2 }]));
});

runner.test("LocalStorageManager.getArrayObject: malformed JSON returns empty array", function () {
  localStorage.clear();

  localStorage.setItem("badJson", "not valid json");
  const manager = new LocalStorageManager();

  const result = manager.getArrayObject("badJson");

  this.assertTrue(Array.isArray(result));
  this.assertEquals(result.length, 0);
});

runner.test("LocalStorageManager.getArrayObject: null values return empty array", function () {
  localStorage.clear();

  const manager = new LocalStorageManager();
  const result = manager.getArrayObject("doesNotExist");

  this.assertTrue(deepEqual(result, []));
});

runner.test("LocalStorageManager.setItem: stores string", function () {
  localStorage.clear();

  const manager = new LocalStorageManager();
  const testString = "test";

  manager.setItem("testKey", testString);

  this.assertEquals(localStorage.getItem("testKey"), JSON.stringify(testString));
});

runner.test("LocalStorageManager.setItem: stores integer", function () {
  localStorage.clear();

  const manager = new LocalStorageManager();
  const testNumber = 42;

  manager.setItem("testKey", testNumber);

  this.assertEquals(localStorage.getItem("testKey"), JSON.stringify(testNumber));
});

runner.test("LocalStorageManager.setItem: stores decimal", function () {
  localStorage.clear();

  const manager = new LocalStorageManager();
  const testNumber = 42.42;

  manager.setItem("testKey", testNumber);

  this.assertEquals(localStorage.getItem("testKey"), JSON.stringify(testNumber));
});

runner.test("LocalStorageManager.setItem: stores date", function () {
  localStorage.clear();

  const manager = new LocalStorageManager();
  const testDate = new Date().toISOString();;

  manager.setItem("testKey", testDate);

  this.assertEquals(localStorage.getItem("testKey"), JSON.stringify(testDate));
});

runner.test("LocalStorageManager.setItem: stores JSON string", function () {
  localStorage.clear();

  const manager = new LocalStorageManager();
  const data = [{ name: "test" }, { name: "test2" }];

  manager.setItem("testKey", data);

  this.assertEquals(localStorage.getItem("testKey"), JSON.stringify(data));
});

runner.test("LocalStorageManager.setItem: overwrites existing data", function () {
  localStorage.clear();

  const manager = new LocalStorageManager();
  manager.setItem("key", "first");
  manager.setItem("key", "second");

  this.assertEquals(localStorage.getItem("key"), JSON.stringify("second"));
});

runner.test("LocalStorageManager.setItem: handles add mixed data type object", function () {
  localStorage.clear();

  const manager = new LocalStorageManager();

  let latestID = 0;
  const now = new Date().toISOString();
  const roundObject = { 
      [localstorageIDKey]:        latestID + 1, 
      [localstorageDateKey]:      now,
      [localstorageValueKey]:     getRound() 
  };

  manager.setItem(localstorageRoundObjectsKey, [roundObject]);

  this.assertEquals(localStorage.getItem(localstorageRoundObjectsKey), JSON.stringify([roundObject]));
});

runner.test("LocalStorageManager.setItem: handles updating an exisitng mixed data type object by adding a new object", function () {
  localStorage.clear(); 

  const manager = new LocalStorageManager();

  let latestID = 0;
  let now = new Date().toISOString();
  const roundObject1 = { 
      [localstorageIDKey]:        latestID + 1, 
      [localstorageDateKey]:      now,
      [localstorageValueKey]:     getRound() 
  };

  manager.setItem(localstorageRoundObjectsKey, [roundObject1]);
  this.assertEquals(localStorage.getItem(localstorageRoundObjectsKey), JSON.stringify([roundObject1]));

  let existingRounds = manager.getArrayObject(localstorageRoundObjectsKey).sort((a, b) => a[localstorageIDKey] - b[localstorageIDKey]);

  this.assertTrue(Array.isArray(existingRounds));
  this.assertTrue(existingRounds.length > 0);
  this.assertTrue(existingRounds[existingRounds.length - 1].id !== undefined);

  latestID = Number(existingRounds[existingRounds.length - 1].id);
  now = new Date().toISOString();
  const roundObject2 = { 
      [localstorageIDKey]:        latestID + 1, 
      [localstorageDateKey]:      now,
      [localstorageValueKey]:     getRound() 
  };
  existingRounds.push(roundObject2);
  manager.setItem(localstorageRoundObjectsKey, existingRounds);

  this.assertEquals(localStorage.getItem(localstorageRoundObjectsKey), JSON.stringify(existingRounds));
});


// ------------------------------------------------------
// LocalStorageRoundManager Tests
// ------------------------------------------------------

runner.test("RoundManager: stores rounds with sequential IDs", function () {
  localStorage.clear();

  const manager = new LocalStorageRoundManager();

  setRound(100);
  manager.storeRound(); // First round
  setRound(150);
  manager.storeRound(); // Second round
  setRound(75);
  manager.storeRound(); // Third round

  const rounds = manager.getArrayObject(localstorageRoundObjectsKey);

  this.assertEquals(rounds.length, 3);
  this.assertEquals(rounds[0].id, 1);
  this.assertEquals(rounds[1].id, 2);
  this.assertEquals(rounds[2].id, 3);

  this.assertEquals(rounds[0].value, 100);
  this.assertEquals(rounds[1].value, 150);
  this.assertEquals(rounds[2].value, 75);

  setRound(1); // resetting to the default value
});

runner.test("RoundManager: storing first round works with empty storage", function () {
  localStorage.clear();

  const manager = new LocalStorageRoundManager();
  manager.storeRound();

  const rounds = manager.getArrayObject(localstorageRoundObjectsKey);

  this.assertEquals(rounds.length, 1);
  this.assertEquals(rounds[0].id, 1);
  this.assertEquals(rounds[0].value, 1);
  this.assertTrue("date" in rounds[0]);
});

runner.test("RoundManager: getTopRounds returns sorted rounds", function () {
  localStorage.clear();

  const manager = new LocalStorageRoundManager();
  const values = [50, 200, 100, 300, 75];

  values.forEach(val => {
    setRound(val);
    manager.storeRound();
  });

  const top3 = manager.getTopRounds(3);

  this.assertEquals(top3.length, 3);
  this.assertEquals(top3[0].value, 300);
  this.assertEquals(top3[1].value, 200);
  this.assertEquals(top3[2].value, 100);

  const top5 = manager.getTopRounds(5);
  this.assertEquals(top5.length, 5);
  this.assertEquals(top5[4].value, 50);

  setRound(1); // resetting to the default value
});

runner.test("RoundManager: getTopRounds works with fewer rounds than limit", function () {
  localStorage.clear();

  const manager = new LocalStorageRoundManager();

  setRound(100);
  manager.storeRound();

  const top5 = manager.getTopRounds(5);

  this.assertEquals(top5.length, 1);
  this.assertEquals(top5[0].value, 100);

  setRound(1); // resetting to the default value
});

runner.test("RoundManager: getTopRounds handles empty storage", function () {
  localStorage.clear();

  const manager = new LocalStorageRoundManager();

  const top = manager.getTopRounds(3);

  this.assertTrue(Array.isArray(top));
  this.assertEquals(top.length, 0);
});
