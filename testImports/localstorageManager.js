import { 
    localstorageRoundObjectsKey, 
    localstorageDateKey, 
    localstorageIDKey, 
    localstorageValueKey,
    round,
    getRound
} from './sketchSetup.js';

// abstract access and manage the localstorage content class definition
//
// This is a duplicate of src/js/localstorageManager.js. Any further changes made there should be also applied here.
//
// -----------------------------------------------------------------------------
class LocalStorageManager {

    /**
     * Retrieve data type of array from the localstorage of the given key.
     * 
     * @param {key of the array data value in the localstorage} key 
     * @returns 
     */
    getArrayObject(key) {
        try {
            const storedObjects = localStorage.getItem(key);
            let fetchedArrayObject = JSON.parse(storedObjects || '[]');

            return fetchedArrayObject;
        } catch (error) {
            console.error("Error occured while fetching localstorage data of: ", key, error); // We can have a error logging implementation later.
            return [];
        }
    }

    /**
     * Store the value with the key.
     * 
     * @param {the key of the value in the localstorage} key 
     * @param {the value to be stored} value 
     */
    setItem(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
}

// -----------------------------------------------------------------------------
// access and manage round in the localstorage implementation of manage the localstorage content class
// -----------------------------------------------------------------------------
class LocalStorageRoundManager extends LocalStorageManager {

    /**
     * Store the final round of the user in the localstorage.
     */
    storeRound() {
        let sortedExistingRounds = this.getArrayObject(localstorageRoundObjectsKey).sort((a, b) => a[localstorageIDKey] - b[localstorageIDKey]);
        let latestID = 0;
        if (sortedExistingRounds.length > 0) {
            latestID = Number(sortedExistingRounds[sortedExistingRounds.length - 1].id);
        }

        const now = new Date().toISOString();
        const roundObject = { 
            [localstorageIDKey]:        latestID + 1, 
            [localstorageDateKey]:      now,
            [localstorageValueKey]:     getRound() 
        };
        sortedExistingRounds.push(roundObject);
        this.setItem(localstorageRoundObjectsKey, sortedExistingRounds);
    }

    /**
     * Returns the top rounds.
     * @param {the numner of top rounds that returns} limit 
     * @returns 
     */
    getTopRounds(limit = 3) {
        let sortedExistingRounds = this.getArrayObject(localstorageRoundObjectsKey).sort((a, b) => b[localstorageValueKey] - a[localstorageValueKey]);
        const topRounds = sortedExistingRounds.slice(0, limit);
        return topRounds;
    }
}
// SessionStats Class refers to the stats tracked for one single game start-finish.
// Create this class at the start of a session, update during gameplay,
// After calling end(), save the stats to LifetimeStats 
//const storage = new LocalStorageManager();

class SessionStats {
    constructor() {
        this.refresh();
    }

    refresh() {
        this.startTime = millis();
        this.endTime = null;
        this.data = {
            difficulty: "",
            timeAlive: 0,
            totalClicks: 0,
            correctClicks: 0,
            incorrectClicks: 0,
            averageFindTime: 0,
            highestCombo: 0,
            round: 0,
            findTimes: [],
            defeatedBosses: [],
        }
    }

    update() {
        if (this.startTime && !this.endTime) {
            this.data.timeAlive = (millis() - this.startTime) / 1000; // seconds
        }
    }

    add(stat, amount = 1) {
        if (this.data[stat] !== undefined) this.data[stat] += amount;
    }
    addDefeatedBoss(bossKey) {
        if (!this.data.defeatedBosses.includes(bossKey)) {
            this.data.defeatedBosses.push(bossKey);
        }
    }

    set(stat, value) {
        if (this.data[stat] !== undefined) this.data[stat] = value;
    }

    addTimeToFind(ms) {
        this.data.findTimes.push(ms);
        const sum = this.data.findTimes.reduce((a,b) => a + b, 0);
        this.data.averageFindTime = sum / this.data.findTimes.length;
    }

    get(stat) {
        return this.data[stat] ?? 0;
    }

    end() {
        this.endTime = millis();
        this.data.timeAlive = (this.endTime - this.startTime) / 1000;
    }
}

class LifetimeStats {
    constructor() {
        // The base stat template
        // After parsing the saved data in localStorage,
        // We merge 'saved' with the template
        this.template = {
            averageFindTime: 0,
            bestRound: 0,
            correctClicks: 0,
            highestCombo: 0,
            incorrectClicks: 0,
            totalGames: 0,
            totalPlayTime: 0,
            defeatedBosses: [],
        }

        //const saved = storage.getArrayObject("lifetimeStats")[0] || {};
        const savedArray = localstorageRoundManager.getArrayObject("lifetimeStats");
        const savedData = savedArray.length > 0 ? savedArray[0] : {};
        this.data = this.mergeWithTemplate(savedData);
    }

    mergeWithTemplate(savedData) {
        const result = { ...this.template };
        for ( let key in savedData ) {
            if (savedData[key] !== undefined) result[key] = savedData[key];
        }
        return result;
    }

    add(stat, value = 1) {
        if (!(stat in this.data)) {
            this.data[stat] = 0;
        }
        this.data[stat] += value;
    }

    // Replace stat entirely
    set(stat, value) {
        this.data[stat] = value;
    }

    get(stat) {
        return this.data[stat] ?? 0;
    }
    // Pass a session object and merge its stats to the lifetime
    saveSession(session) {
        this.add(     "totalGames", 1);  
        this.add(  "correctClicks", session.get("correctClicks"));
        this.add("incorrectClicks", session.get("incorrectClicks"));
        this.add(  "totalPlayTime", session.get("timeAlive"));

        this.set("averageFindTime", this.data.totalPlayTime / this.data.correctClicks)

        if (session.get("round") > this.data.bestRound)           { this.set("bestRound", session.get("round")) }
        if (session.get("highestCombo") > this.data.highestCombo) { this.set("highestCombo", session.get("highestCombo")) }

        for (const bossKey of session.data.defeatedBosses) {
            if (!this.data.defeatedBosses.includes(bossKey)) {
                this.data.defeatedBosses.push(bossKey);
            }
        }

        this.save();
    }

    save() {
        localstorageRoundManager.setItem("lifetimeStats", [this.data]);
        //localStorage.setItem("lifetimeStats", JSON.stringify(this.data));
    }
    reset() {
        this.data = { ...this.template };
        this.save();
    }

    static load() {
        return new LifetimeStats();
    }
}

// This is where we implement the EventListener, and
// make changes based on what events are being called during gameplay 

class StatTracker {
    constructor() {
        this.lastValidClickTime = millis();

        this.session = new SessionStats();
        this.lifetime = LifetimeStats.load();
        // debug: reset every time
        //this.lifetime.reset();

        gameEvents.OnEvent("setDifficulty", (d) => { 
            this.session.data.difficulty = d; 
        });
        gameEvents.OnEvent("Clicked", (valid) => { 
            const now = millis();
            if (valid) {
                const timeToFind = now - this.lastValidClickTime;
                    this.session.addTimeToFind(timeToFind);
                this.lastValidClickTime = now;
                this.session.add("correctClicks", 1)
            } else if (valid == false) {
                 this.session.add("incorrectClicks", 1)
            }
            this.session.add("totalClicks", 1) 
        })
        gameEvents.OnEvent("newCombo", (combo) => {
            if (this.session.get("highestCombo") < combo) this.session.set("highestCombo", combo);
        })
        gameEvents.OnEvent("roundChanged", (to) => {
            this.session.set("round", to);
        })
        gameEvents.OnEvent("gameOver", () => { this.onGameEnd() })

        gameEvents.OnEvent("bossDefeated", (bossKey) => {this.session.addDefeatedBoss(bossKey);})

    }

    update() {
        this.session.update();
    }

    onGameEnd() {
        this.session.end();
        this.lifetime.saveSession(this.session);
    }

    debug() {
        setInterval(() => {
            console.log(this.session.data);
        }, 2000);
    }
}

export{
  LocalStorageManager,
  LocalStorageRoundManager,
  SessionStats,
  LifetimeStats,
  StatTracker
}