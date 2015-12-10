import logger from '../logger';
import {rdb} from './connection';

const table = async function() {
    const {db, connection} = await rdb();
    const t = db.table('users');
    return {t, connection};
};

const find = async function(pattern) {
    const {t, connection} = await table();
    const cursor = await t.filter(pattern).without('password').limit(1).run(connection);
    let result;
    try {
        result = await cursor.next();
    } catch (err) {
        // check if it's just nothing found error
        if (err.name === 'ReqlDriverError' && err.message === 'No more rows in the cursor.') {
            logger.debug('error, no users found');
        } else {
            throw err;
        }
    }
    connection.close();
    return result;
};

const findAll = async function(pattern) {
    const {t, connection} = await table();
    const cursor = await t.filter(pattern).without('password').run(connection);
    let result;
    try {
        result = await cursor.toArray();
    } catch (err) {
        // check if it's just nothing found error
        if (err.name === 'ReqlDriverError' && err.message === 'No more rows in the cursor.') {
            logger.debug('error, no users found');
        } else {
            throw err;
        }
    }
    connection.close();
    return result;
};

const create = async function(data: Object) {
    const {t, connection} = await table();
    const existingUserCount = await t.filter(data).count().run(connection);
    if (existingUserCount > 0) {
        throw new Error('User with given email already exists!');
    }
    const res = await t.insert(data).run(connection);
    const id = res.generated_keys[0];
    return await find({id});
};

const update = async function(pattern: Object|string, data: Object|Function) {
    const {t, connection} = await table();
    return t.get(pattern).update(data).run(connection);
};

export const User = {
    find,
    findAll,
    create,
    update,
};
