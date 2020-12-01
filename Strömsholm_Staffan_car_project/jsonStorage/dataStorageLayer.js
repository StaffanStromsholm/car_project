'use strict';

const path = require('path');
const fs = require('fs').promises;

const storageConfig = require('./storageConfig.json');
const storageFile = path.join(__dirname, storageConfig.storageFile);

//wrapper function for all of the datastorage logic
function createDataStorage() {
    const { CODES, MESSAGES } = require(path.join(__dirname, storageConfig.errorCodes));

    //private API

    async function readStorage() {
        try {
            const data = await fs.readFile(storageFile, 'utf8');
            return JSON.parse(data);
        }
        catch (err) {
            return [];
        }
    }

    async function writeStorage(data) {
        try {
            await fs.writeFile(storageFile, JSON.stringify(data, null, 4), { encoding: 'utf8', flag: 'w' })
            return MESSAGES.WRITE_OK();
        }
        catch (error) {
            return MESSAGES.WRITE_ERROR(error.message);
        }
    }

    async function getFromStorage(productNumber) {
        return (await readStorage()).find(car => car.productNumber == productNumber) || null;
    }

    async function addToStorage(newCar) {
        const storage = await readStorage();
        if (storage.find(car => car.productNumber == newCar.productNumber)) {
            return false;
        }
        else {
            storage.push({
                productNumber: +newCar.productNumber,
                model: newCar.model,
                licencePlate: newCar.licencePlate,
                rating: newCar.rating,
                year: newCar.year
            });
            await writeStorage(storage);
            return true;
        }
    }

    async function removeFromStorage(productNumber) {
        let storage = await readStorage();
        const i = storage.findIndex(car => car.productNumber == productNumber);
        if (i < 0) return false;
        storage.splice(i, 1);
        await writeStorage(storage);
        return true;
    }
    async function updateStorage(car) {
        let storage = await readStorage();
        const oldCar = storage.find(oldCar => oldCar.productNumber == car.productNumber);
        if (oldCar) {
            Object.assign(oldCar, {
                productNumber: +car.productNumber,
                model: car.model,
                licencePlate: car.licencePlate,
                rating: car.rating,
                year: car.year
            });
            await writeStorage(storage);
            return true;
        }
        else {
            return false;
        }
    }

    class Datastorage {
        get CODES() {
            return CODES;
        }

        getAll() {
            return readStorage();
        }

        get(productNumber) {
            return new Promise(async (resolve, reject) => {
                if (!productNumber) {
                    reject(MESSAGES.NOT_FOUND('<empty productNumber>'));
                }
                else {
                    const result = await getFromStorage(productNumber);
                    if (result) {
                        resolve(result);
                    }
                    else {
                        reject(MESSAGES.NOT_FOUND(productNumber));
                    }
                }
            });
        }

        insert(car) {
            return new Promise(async (resolve, reject) => {
                if (!(car && car.productNumber && car.model && car.licencePlate)) {
                    reject(MESSAGES.NOT_INSERTED());
                } else {
                    if (await addToStorage(car)) {
                        resolve(MESSAGES.INSERT_OK(car.productNumber));
                    } else {
                        reject(MESSAGES.ALREADY_IN_USE(car.productNumber));
                    }
                }
            })
        }

        remove(productNumber) {
            return new Promise(async (resolve, reject) => {
                if (!productNumber) {
                    reject(MESSAGES.NOT_FOUND('<empty>'));
                } else {
                    if (await removeFromStorage(productNumber)) {
                        resolve(MESSAGES.REMOVE_OK(productNumber));
                    } else {
                        reject(MESSAGES.NOT_REMOVED());
                    }
                }
            });
        }
        
        update(car) {
            return new Promise(async (resolve, reject) => {
                if (!(car && car.productNumber && car.model && car.licencePlate)) {
                    reject(MESSAGES.NOT_UPDATED());
                } else {
                    if (await updateStorage(car)) {
                        resolve(MESSAGES.UPDATE_OK(car.productNumber));
                    } else {
                        reject(MESSAGES.NOT_UPDATED());
                    }
                }
            });
        }
    }
    return new Datastorage();
}

module.exports = {
    createDataStorage
}