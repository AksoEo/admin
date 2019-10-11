import { UEACode, util } from '@tejo/akso-client';
import { AbstractDataView } from '../view';
import asyncClient from '../client';
import * as store from '../store';
import { LOGIN_ID } from './login-keys';

//! # Client-side codeholder representation
//! - fields with no value are null or an empty string
//! - fields that have not been loaded must not be indexed (i.e. they do not exist in the object)
//!
//! ## Fields
//! - id: identical to API
//! - type: string 'human' or 'org'
//! - name: object { first, last, firstLegal, lastLegal, honorific }
//!   or object { full, local, abbrev }
//! - careOf: identical to API
//! - website: identical to API
//! - code: object { new, old } where old always has a check letter
//! - creationTime: identical to API
//! - hasPassword: identical to API
//! - address: object that’s identical to API, except every field also has a -Latin variant
//!   may have a magic `$latin: bool` key to only send one variant to the API
//! - feeCountry: identical to API
//! - membership: identical to API
//! - email: identical to API
//! - enabled: identical to API
//! - notes: identical to API
//! - officePhone: object { value, formatted }
//! - landlinePhone: object { value, formatted }
//! - cellphone: object { value, formatted }
//! - isDead: identical to API
//! - birthdate: identical to API
//! - age: object { now, atStartOfYear }
//! - deathdate: identical to API
//! - profilePictureHash: identical to API
//! - isActiveMember: identical to API
//! - profession: identical to API

/// Data store path.
export const CODEHOLDERS = 'codeholders';

// used below; this is just here for DRY
const addressSubfields = [
    'country',
    'countryArea',
    'city',
    'cityArea',
    'streetAddress',
    'postalCode',
    'sortingCode',
];
// ditto
const phoneFormat = field => ({
    apiFields: [field, field + 'Formatted'],
    fromAPI: codeholder => ({ value: codeholder[field], formatted: codeholder[field + 'Formatted'] }),
    // -Formatted is a derived property so we never serialize it
    toAPI: ({ value }) => ({ [field]: value }),
});

/// Codeholder fields in the client-side representation.
///
/// - apiFields: corresponding API fields for this field
///   this can either be a string (for 1:1 mapping) or an array (for other mappings)
/// - fromAPI: maps an API codeholder to a value of this field. required fields can be assumed to
///   exist in the API codeholder (if apiFields is a string, this is automatic)
/// - toAPI: maps a value of this field to a partial API codeholder
///   (if apiFields is a string, this is automatic)
/// - requires: required client-side fields that must also be requested (for e.g. disambiguation)
/// - sort: API field to sort by. If not given, use apiFields in the given order
const clientFields = {
    id: 'id',
    type: 'codeholderType',
    name: {
        apiFields: [
            'firstName', 'lastName', 'firstNameLegal', 'lastNameLegal', 'honorific',
            'fullName', 'fullNameLocal', 'nameAbbrev',
        ],
        fromAPI: codeholder => {
            const value = {};
            if (codeholder.codeholderType === 'human') {
                for (const f of ['firstName', 'lastName', 'firstNameLegal', 'lastNameLegal', 'honorific']) {
                    value[f.replace(/Name/, '')] = codeholder[f] || null;
                }
            } else if (codeholder.codeholderType === 'org') {
                value.full = codeholder.fullName || null;
                value.local = codeholder.fullNameLocal || null;
                value.abbrev = codeholder.nameAbbrev || null;
            }
            return value;
        },
        toAPI: value => {
            const codeholder = {};
            if ('first' in value) {
                // human
                for (const f of ['firstName', 'lastName', 'firstNameLegal', 'lastNameLegal', 'honorific']) {
                    const cf = f.replace(/Name/, '');
                    if (value[cf]) codeholder[f] = value[cf] || null;
                }
            } else {
                // org
                if (value.full) codeholder.fullName = value.full || null;
                if (value.local) codeholder.fullNameLocal = value.local || null;
                if (value.abbrev) codeholder.nameAbbrev = value.abbrev || null;
            }
            return codeholder;
        },
        requires: ['type', 'isDead'],
        sort: ['searchName'],
    },
    careOf: 'careOf',
    website: 'website',
    code: {
        apiFields: ['newCode', 'oldCode'],
        fromAPI: codeholder => ({ new: codeholder.newCode, old: codeholder.oldCode }),
        toAPI: value => ({ newCode: value.new, oldCode: value.old }),
    },
    creationTime: 'creationTime',
    hasPassword: 'hasPassword',
    address: {
        apiFields: addressSubfields.flatMap(f => [`address.${f}`, `addressLatin.${f}`]),
        fromAPI: codeholder => {
            const value = {};
            for (const f of addressSubfields) {
                value[f] = codeholder.address ? (codeholder.address[f] || null) : null;
                value[f + 'Latin'] = codeholder.addressLatin ? (codeholder.addressLatin[f] || null) : null;
            }
            return value;
        },
        toAPI: value => {
            const codeholder = {};
            const sendNormal = value.$latin !== true;
            const sendLatin = value.$latin !== false;
            if (sendNormal) codeholder.address = {};
            if (sendLatin) codeholder.addressLatin = {};
            for (const f of addressSubfields) {
                if (sendNormal) codeholder.address[f] = value[f];
                if (sendLatin) codeholder.addressLatin[f] = value[f + 'Latin'];
            }
            return codeholder;
        },
        sort: ['addressLatin.country', 'addressLatin.postalCode'],
    },
    feeCountry: 'feeCountry',
    membership: 'membership',
    email: 'email',
    enabled: 'enabled',
    notes: 'notes',
    officePhone: phoneFormat('officePhone'),
    landlinePhone: phoneFormat('landlinePhone'),
    cellphone: phoneFormat('cellphone'),
    isDead: 'isDead',
    birthdate: 'birthdate',
    age: {
        apiFields: ['age', 'agePrimo'],
        fromAPI: codeholder => ({ now: codeholder.age, atStartOfYear: codeholder.agePrimo }),
        // agePrimo is a derived property so we never serialize it
        toAPI: value => ({ age: value.now }),
        requires: ['isDead'], // to ignore atStartOfYear when they’re dead
    },
    deathdate: 'deathdate',
    profilePictureHash: 'profilePictureHash',
    isActiveMember: 'isActiveMember',
    profession: 'profession',
};

/// converts from API repr to client repr (see above)
function clientFromAPI (apiRepr) {
    const clientRepr = {};
    for (const field in clientFields) {
        const spec = clientFields[field];
        clientRepr[field] = typeof spec === 'string' ? apiRepr[spec]
            : typeof spec.apiFields === 'string'
                ? apiRepr[spec.apiFields]
                : spec.fromAPI(apiRepr);
    }
    return clientRepr;
}
function coerceToNull (value) {
    if (value === null || value === undefined || value === '') return null;
    return value;
}
/// converts from client repr to api repr (see above)
function clientToAPI (clientRepr) {
    const apiRepr = {};
    for (const field in clientFields) {
        const spec = clientFields[field];
        if (typeof spec === 'string') apiRepr[spec] = coerceToNull(clientRepr[field]);
        else if (typeof spec.apiFields === 'string') apiRepr[spec.apiFields] = coerceToNull(clientRepr[field]);
        else Object.assign(apiRepr, spec.toAPI(clientRepr));
    }
    return apiRepr;
}

//! # Client-side filter representation
//! - type: 'human', or 'org'
//! - country: object { type, set } where type is one of null, 'fee', or 'address' and set is a
//!   list of countries and country groups
//! - enabled: true or false
//! - age: object { range, atStartOfYear } where range is a two-element array representing an
//!   inclusive interval and atStartOfYear is a bool
//! - hasOldCode: true or false
//! - hasEmail: true or false
//! - hasPassword: true or false
//! - isDead: true or false
//! - membership: array of objects { invert, lifetime, givesMembership, useRange, range, categories }
//!   where invert, lifetime, givesMembership, useRange are bool, range is an inclusive year
//!   interval, and categories is an array of membership category ids
//! - isActiveMember: array [lower bound year, upper bound year]
//! - deathdate: array [lower bound year, upper bound year]

/// Client filter specs.
///
/// - toAPI: converts client repr to an API filter
/// - fields: required API fields for this filter (wrt permissions)
const clientFilters = {
    type: {
        toAPI: value => ({ codeholderType: value }),
        fields: ['codeholderType'],
    },
    country: {
        toAPI: ({ type, set }) => {
            const countryGroups = [];
            const countries = [];
            for (const item of set) {
                if (item.startsWith('x')) countryGroups.push(item);
                else countries.push(item);
            }
            const filterItems = [];
            if (type === null || type === 'fee') {
                filterItems.push({ feeCountry: { $in: countries } });
                filterItems.push({ feeCountryGroups: { $hasAny: countryGroups } });
            }
            if (type === null || type === 'address') {
                filterItems.push({ 'addressLatin.country': { $in: countries } });
                filterItems.push({ 'addressCountryGroups': { $hasAny: countryGroups } });
            }
            return { $or: filterItems };
        },
        // TODO: maybe there are user who can only see one but still want to use the filter?
        fields: ['feeCountry', 'addressLatin.country'],
    },
    enabled: {
        toAPI: value => ({ enabled: value }),
        fields: ['enabled'],
    },
    age: {
        toAPI: ({ range, atStartOfYear }) => ({ [atStartOfYear ? 'agePrimo' : 'age']: { $range: range } }),
        fields: ['age', 'agePrimo'],
    },
    hasOldCode: {
        toAPI: value => ({ oldCode: value ? { $neq: null } : null }),
        fields: ['oldCode'],
    },
    hasEmail: {
        toAPI: value => ({ email: value ? { $neq: null } : null }),
        fields: ['email'],
    },
    hasPassword: {
        toAPI: value => ({ hasPassword: value }),
        fields: ['hasPassword'],
    },
    isDead: {
        toAPI: value => ({ isDead: value }),
        fields: ['isDead'],
    },
    membership: {
        toAPI: value => {
            const items = value.map(({
                invert, lifetime, givesMembership, useRange, range, categories,
            }) => {
                const filter = {};
                if (givesMembership !== null) {
                    filter.givesMembership = invert ? !givesMembership : givesMembership;
                }
                if (lifetime !== null) {
                    filter.lifetime = invert ? !lifetime : lifetime;
                }
                if (useRange) {
                    if (invert) {
                        const [lowerYear, upperYear] = range;
                        filter.$or = [
                            { year: { $lt: lowerYear } },
                            { year: { $gt: upperYear } },
                        ];
                    } else filter.year = { $range: range };
                }
                if (categories.length) {
                    filter.categoryId = invert ? { $nin: categories } : { $in: categories };
                }
                return filter;
            });

            return { $membership: { $and: items } };
        },
        fields: ['membership'],
    },
    isActiveMember: {
        toAPI: range => ({
            $membership: {
                givesMembership: true,
                $or: [
                    {
                        lifetime: false,
                        year: { $range: range },
                    },
                    {
                        lifetime: true,
                        year: { $lte: range[0] },
                    },
                ],
            },
        }),
        fields: ['membership'],
    },
    deathdate: {
        toAPI: range => ({ deathdate: { $range: [`${range[0]}-01-01`, `${range[1]}-12-31`] } }),
        fields: ['deathdate'],
    },
};

/// Transient client fields that will be selected for a given search field.
///
/// This is a list of exceptions; all other will be passed through as-is.
const searchFieldToTransientFields = {
    nameOrCode: ['name', 'code'],
    searchAddress: ['address'],
};

/// Converts params to request options. See task codeholders/list for details.
function parametersToRequestData (params) {
    const options = {};
    const transientFields = [];

    // searching for nameOrUeaCode should prepend an item with the exact match for the search
    // string, if available
    let prependedUeaCodeSearch = null;

    if (params.search.query) {
        let query = params.search.query;
        let searchField = params.search.field;

        // select search fields as temporary fields
        transientFields.push(...(searchFieldToTransientFields[searchField] || [searchField]));

        if (searchField === 'nameOrCode') {
            searchField = 'searchName';
            try {
                // if the query is a valid UEA code; prepend search
                const code = new UEACode(query);
                if (code.type === 'new') prependedUeaCodeSearch = { newCode: query };
                else prependedUeaCodeSearch = { oldCode: query };
            } catch (invalidUeaCode) { /* only search for name otherwise */ }
        } else if (['landlinePhone', 'officePhone', 'cellphone'].includes(searchField)) {
            // filter out non-alphanumeric characters because they might be interpreted as
            // search operators
            query = query.replace(/[^a-z0-9]/ig, '');
        }

        const transformedQuery = util.transformSearch(query);

        if (!util.isValidSearch(transformedQuery)) {
            throw { code: 'invalid-search-query', message: 'invalid search query' };
        }

        options.search = { str: transformedQuery, cols: [searchField] };
    }

    // list of all fields that have been selected
    const fields = params.fields.concat(transientFields.map(id => ({ id, sorting: 'none' })));

    options.order = fields
        .filter(({ sorting }) => sorting !== 'none')
        // some fields have multiple sub-fields that must be sorted individually
        .flatMap(({ id, sorting }) => typeof clientFields[id] === 'string'
            ? [[clientFields[id], sorting]]
            : (clientFields[id].sort || clientFields[id].apiFields).map(id => [id, sorting]))
        .map(({ id, sorting }) => [id, sorting]);

    // order by relevance if no order is selected
    if (options.search && !options.order.length) {
        options.order = [['_relevance', 'desc']];
    }

    options.fields = fields.flatMap(({ id }) => typeof clientFields[id] === 'string'
        ? clientFields[id]
        : clientFields[id].apiFields);
    options.fields.push('id'); // also select the ID field

    options.offset = params.offset;
    options.limit = params.limit;

    options.filter = params.jsonFilter;
    if (!('jsonFilter' in params)) {
        // TODO: filter stuff
    }
    const usedFilters = !!Object.keys(params.filter).length;

    return {
        options,
        prependedUeaCodeSearch,
        usedFilters,
        transientFields,
    };
}

/// merges like object.assign, but deep
/// may or may not mutate a
function deepMerge (a, b) {
    if (typeof a === 'object' && typeof b === 'object') {
        if (Array.isArray(a) || Array.isArray(b)) return b;
        for (const k in b) a[k] = deepMerge(a[k], b[k]);
        return a;
    } else return b;
}

export const tasks = {
    /// codeholders/fields: lists available fields according to permissions
    /// returns an array with field ids
    fields: async () => {
        const client = await asyncClient;
        const fields = [];
        for (const field in clientFields) {
            const spec = clientFields[field];
            let hasPerm;
            if (typeof spec === 'string') hasPerm = await client.hasCodeholderField(spec);
            else if (typeof spec.apiFields === 'string') hasPerm = await client.hasCodeholderField(spec.apiFields);
            else {
                for (const f of spec.apiFields) {
                    if (await client.hasCodeholderField(f, 'r')) {
                        hasPerm = true;
                        break;
                    }
                }
            }
            if (hasPerm) fields.push(field);
        }
        return fields;
    },

    /// codeholders/filters: lists available filters according to permissions
    /// returns an array with filter ids
    filters: async () => {
        const client = await asyncClient;
        const filters = [];
        for (const filter in clientFilters) {
            if (client.hasCodeholderFields('r', ...clientFilters[filter].fields)) {
                filters.push(filter);
            }
        }
        return filters;
    },

    /// codeholders/list: fetches codeholders
    /// options: none
    /// parameters:
    ///    - search: { field: string, query: string }
    ///    - filters: object { [name]: value }
    ///    - jsonFilter: object (will be preferred over filters if set)
    ///    - fields: [{ id: string, sorting: 'asc' | 'desc' | 'none' }]
    ///    - offset: number
    ///    - limit: number
    /// returns:
    ///    - items: [data store id list]
    ///    - transientFields: [string]
    ///    - total: number
    ///    - cursed: bool
    ///    - stats
    ///        - filtered: bool
    ///        - time: string
    list: async (_, parameters) => {
        const client = await asyncClient;

        const {
            options, prependedUeaCodeSearch, usedFilters, transientFields,
        } = parametersToRequestData(parameters);

        let itemToPrepend = null;
        if (prependedUeaCodeSearch) {
            itemToPrepend = (await client.get('/codeholders', {
                filter: prependedUeaCodeSearch,
                // only need to know about its existence on later pages
                fields: options.offset === 0 ? options.fields : [],
                limit: 1,
            })).body[0];
            if (itemToPrepend) itemToPrepend.isCursed = true;
        }

        if (itemToPrepend) {
            // there’s an extra item at the front
            // on the first page, just reduce the limit to compensate
            if (parameters.offset === 0) options.limit--;
            // and on any other page, reduce the offset to compensate
            else options.offset--;
        }

        const result = await client.get('/codeholders', options);
        let list = result.body;
        let totalItems = +result.res.headers.map['x-total-items'];
        let cursed = false;

        if (itemToPrepend) {
            cursed = true;
            let isDuplicate = false;
            for (const item of list) {
                if (item.id === itemToPrepend.id) {
                    isDuplicate = true;
                    break;
                }
            }
            if (!isDuplicate) {
                // prepend item on the first page if it’s not a duplicate
                if (parameters.offset === 0) list.unshift(itemToPrepend);
                totalItems++;
            }
        }

        for (const item of list) {
            const existing = store.get([CODEHOLDERS, item.id]);
            store.insert([CODEHOLDERS, item.id], deepMerge(existing, clientFromAPI(item)));
        }

        list = list.map(item => item.id);

        return {
            items: list,
            total: totalItems,
            cursed,
            transientFields,
            stats: {
                time: result.resTime,
                filtered: usedFilters,
            },
        };
    },
    /// codeholders/codeholder: gets a single codeholder
    ///
    /// # Options
    /// - id: codeholder id or `self`
    /// - fields: client field ids
    ///
    /// Returns the resolved id (i.e. always a number, never `self`)
    codeholder: async (_, { id, fields }) => {
        const client = await asyncClient;
        const res = await client.get(`/codeholders/${id}`, {
            fields: ['id'].concat(fields.flatMap(id => typeof clientFields[id] === 'string'
                ? [clientFields[id]]
                : clientFields[id].apiFields)),
        });

        const storeId = id === 'self' ? store.get(LOGIN_ID) : id;

        const existing = store.get([CODEHOLDERS, storeId]);
        store.insert([CODEHOLDERS, storeId], deepMerge(existing, clientFromAPI(res.body)));

        return id;
    },
};

export const views = {
    /// codeholders/codeholder: observes (and fetches) a codeholder
    ///
    /// # Options
    /// - id: codeholder id
    /// - fields: list of field ids to consider the minimal required set (will be fetched)
    codeholder: class CodeholderView extends AbstractDataView {
        constructor (options) {
            super();
            const { id, fields } = options;
            this.id = id === 'self' ? store.get(LOGIN_ID) : id; // resolve id
            this.fields = fields;

            store.subscribe([CODEHOLDERS, this.id], this.#onUpdate);
            const current = store.get([CODEHOLDERS, this.id]);
            if (current) setImmediate(this.#onUpdate);

            /// Note that this specifically uses the id argument and not this.id so that we’re
            /// fetching `self` instead of the resolved id if id is set to `self`
            tasks.codeholder({}, { id, fields }).catch(err => this.emit('error', err));
        }

        #onUpdate = () => {
            this.emit('update', store.get([CODEHOLDERS, this.id]));
        };

        drop () {
            store.unsubscribe([CODEHOLDERS, this.id], this.#onUpdate);
        }
    },
};
