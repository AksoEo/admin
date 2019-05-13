/** Handles interfacing with the API. */

import EventEmitter from 'events';
import { UEACode, util as aksoUtil } from 'akso-client';
import client from '../../../client';
import { Sorting } from './fields';

const { transformSearch } = aksoUtil;

const dataSingleton = new EventEmitter();

const fieldIdMapping = {
    code: ['newCode', 'oldCode'],
    name: [
        'firstName',
        'lastName',
        'firstNameLegal',
        'lastNameLegal',
        'fullName',
        'fullNameLocal',
        'nameAbbrev',
    ],
    country: ['addressLatin.country', 'feeCountry'],
    age: ['age', 'agePrimo'],
};

const mapFieldId = id => fieldIdMapping[id] || [id];

let currentSearchQuery;
let currentSearch;
let currentResult;

/**
 * Performs a search if necessary.
 * @param {string} field - the search field
 * @param {string} query - the query
 * @param {Array} filters - an array of search filters
 * @param {Array} fields - an array of selected fields
 */
function search (field, query, filters, fields, offset, limit) {
    const order = fields.map(({ id, sorting }) => {
        if (sorting === Sorting.NONE) return null;
        else if (sorting === Sorting.ASC) return [mapFieldId(id)[0], 'asc'];
        else return [mapFieldId(id)[0], 'desc'];
    }).filter(id => id);

    const selectedFields = fields.map(({ id }) => mapFieldId(id)).flatMap(v => v);

    selectedFields.push('id');

    let searchFields = [field];
    if (field === 'nameOrCode') {
        if (UEACode.validate(query)) {
            // TODO: prepend extra search with only the code
        }
        searchFields = ['name'];
    }

    const filter = {};
    for (const predicate of filters) {
        if (predicate.enabled) {
            const result = toFilterValue(predicate.field, predicate.value);
            if (result) {
                const [field, value] = result;
                filter[field] = value;
            }
        }
    }

    const options = {
        order,
        fields: selectedFields,
        filter,
        offset,
        limit,
    };

    if (query) {
        options.search = { str: transformSearch(query), cols: searchFields };
    }

    const searchQuery = JSON.stringify(options);
    if (searchQuery === currentSearchQuery && currentResult.ok) {
        dataSingleton.emit('result', currentResult);
        return;
    } else {
        currentSearchQuery = searchQuery;
    }

    const promise = currentSearch = client.get('/codeholders', options);
    promise.then(result => {
        if (currentSearch === promise) {
            if (result.bodyOk) {
                currentResult = {
                    ok: true,
                    list: result.body,
                    resTime: result.resTime,
                    totalItems: +result.res.headers.map['x-total-items'],
                };
                dataSingleton.emit('result', currentResult);
            } else {
                // TODO: handle error
                throw new Error('unimplemented: handle !bodyOk');
            }
        }
    }).catch(error => {
        if (currentSearch === promise) {
            currentResult = { ok: false, error };
            dataSingleton.emit('result', currentResult);
        }
    });
}

function toFilterValue (field, value) {
    if (field === 'age') {
        return [value.atStartOfYear ? 'agePrimo' : 'age', numericRangeToFilter(value.range)];
    } else if (field === 'codeholderType') {
        if (value.org !== value.human) {
            if (value.org) return [field, 'org'];
            else return [field, 'human'];
        } else return null;
    } else if (field === 'hasOldCode') {
        return ['oldCode', value ? { $neq: null } : null];
    } else if (field === 'hasEmail') {
        return ['email', value ? { $neq: null } : null];
    } else {
        return [field, value];
    }
}

function numericRangeToFilter (value) {
    const v = {};
    if (value.startInclusive) v.$gte = value.start;
    else v.$gt = value.start;
    if (value.endInclusive) v.$lte = value.end;
    else v.$lt = value.end;
    return v;
}

let loadedCountries;
async function getCountries () {
    if (!loadedCountries) {
        const result = await client.get('/countries', {
            limit: 300,
            fields: ['code', 'name_eo'],
        });

        loadedCountries = [];

        for (const item of result.body) {
            loadedCountries[item.code] = item.name_eo;
        }
    }
    return loadedCountries;
}

dataSingleton.search = search;
dataSingleton.getCountries = getCountries;

export default dataSingleton;
