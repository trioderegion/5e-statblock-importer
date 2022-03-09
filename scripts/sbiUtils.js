import {
    sbiConfig
} from "./sbiConfig.js";

export class sbiUtils {

    static log(message) {
        if (sbiConfig.options.debug) {
            console.log("sbi | " + message);
        }
    }

    // ==========================
    // Object Functions    
    // ==========================

    static assignToObject(obj, path, val) {
        const pathArr = path.split(".");

        let length = pathArr.length;
        let current = obj;

        for (let i = 0; i < pathArr.length; i++) {
            const key = pathArr[i];

            // If this is the last item in the loop, assign the value
            if (i === length - 1) {
                current[key] = val;
            } else {
                // If the key doesn't exist, create it
                if (!current[key]) {
                    current[key] = {};
                }

                current = current[key];
            }
        }

        return obj;
    }

    static async updateItemImgFromSRD(actor){

      let pack = game.packs.get('symbaroum5eplayersguide.ros-pg-items');
      const sybItems = (await pack.getIndex()).contents;
      pack = game.packs.get('symbaroum5eplayersguide.ros-pg-classes');
      const classFeatures = (await pack.getIndex()).contents;
      pack = game.packs.get('dnd5e.monsterfeatures')
      const monsterFeatures = (await pack.getIndex()).contents;
      pack = game.packs.get('dnd5e.items');
      const items = (await pack.getIndex()).contents;
      const index = sybItems.concat(classFeatures.concat(monsterFeatures.concat(items)));

      if (!actor) {
        ui.notifications.error(`No actor provided`)
        return;
      }

      const updates = actor.items.reduce( (acc, item) => {

        /* try the override actor */
        const fallbackItem = game.actors.getName("Override Item Images")?.items.getName(item.name);
        if(fallbackItem) {
          acc.updates.push({_id: item.id, img: fallbackItem.data.img});
          return acc;
        }

        const info = index.find( e => e.name === item.name )
        if (!info){
          
          acc.missing.push(item.name);
        } else if (item.img !== 'icons/svg/item-bag.svg') {
          acc.skipped.push(item.name); 
        } else {
          acc.updates.push({_id: item.id, img: info.img});
        }

        return acc;
      },{updates: [], missing: [], skipped: []})

      await actor.updateEmbeddedDocuments('Item', updates.updates);
      console.debug('Missing Icons', ...updates.missing)
      console.debug('Skipped Items', ...updates.skipped)

    }

    static async getFromPackAsync(packName, itemName) {
        let result = null;
        const pack = game.packs.get(packName);

        if (pack) {
            const item = pack.index.find(e => itemName.toLowerCase() === e.name.toLowerCase());

            if (item) {
                const itemDoc = await pack.getDocument(item._id);
                result = itemDoc.toObject();
            }
        }

        return result;
    }

    static async tryGetFromPackAsync(packName, text) {
        let result = null;
        const pack = game.packs.get(packName);
        const searchText = text.toLowerCase();

        if (pack) {
            const item = pack.index.find(e => text.includes(e.name.toLowerCase()));

            if (item) {
                const itemDoc = await pack.getDocument(item._id);
                result = itemDoc.toObject();
            }
        }

        return result;
    }

    // ==========================
    // String Functions    
    // ==========================

    // capitalizeAll("passive perception") => "Passive Perception"
    static capitalizeAll(string) {
        if (!string) {
            return null;
        }

        return string.toLowerCase().replace(/^\w|\s\w/g, function(letter) {
            return letter.toUpperCase();
        })
    }

    // capitalizeFirstLetter("passive perception") => "Passive perception"
    static capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // format("{0} comes before {1}", "a", "b") => "a comes before b"
    static format(stringToFormat, ...tokens) {
        return stringToFormat.replace(/{(\d+)}/g, function(match, number) {
            return typeof tokens[number] != 'undefined' ? tokens[number] : match;
        });
    };

    // startsWithCapital("Foo") => true
    static startsWithCapital(string) {
        return /[A-Z]/.test(string.charAt(0))
    }

    // parseFraction("1/2") => 0.5
    static parseFraction(string) {
        let result = null;
        const numbers = string.split("/");

        if (numbers.length == 2) {
            const numerator = parseFloat(numbers[0]);
            const denominator = parseFloat(numbers[1]);
            result = numerator / denominator;
        }

        return result;
    }

    static exactMatch(string, regex) {
        const match = string.match(regex);
        return match && match[0] === string;
    }

    // ==========================
    // Array Functions    
    // ==========================

    // remove([1,2,3], 2) => [1,3]
    static remove(array, item) {
        const index = array.indexOf(item);

        if (index > -1) {
            array.splice(index, 1);
        }
    }

    // last([1,2,3]) => 3
    static last(array) {
        return array[array.length - 1];
    }

    // skipWhile([1,2,3], (item) => item !== 2) => [2,3]
    static skipWhile(array, callback) {
        let doneSkipping = false;

        return array.filter((item) => {
            if (!doneSkipping) {
                doneSkipping = !callback(item);
            }

            return doneSkipping;
        });
    };

    // intersect([1,2,3], [2]) => [2]
    static intersect(sourceArr, targetArr) {
        return sourceArr.filter(item => targetArr.indexOf(item) !== -1);
    };

    // except([1,2,3], [2]) => [1,3]
    static except(sourceArr, targetArr) {
        return sourceArr.filter(item => targetArr.indexOf(item) === -1);
    };
}
