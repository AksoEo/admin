import asyncClient from '../client';
import { AbstractDataView } from '../view';
import * as store from '../store';
import { makeParametersToRequestData, makeClientFromAPI } from '../list';
import { deepMerge } from '../../util';

export const HTTP_LOG = 'httpLog';

const clientFields = {
    id: 'id',
    time: 'time',
    codeholder: 'codeholderId',
    apiKey: 'apiKey',
    ip: 'ip',
    origin: 'origin',
    userAgent: 'userAgent',
    userAgentParsed: 'userAgentParsed',
    method: 'method',
    path: 'path',
    query: 'query',
    resStatus: 'resStatus',
    resTime: 'resTime',
    resLocation: 'resLocation',
};

const clientFilters = {

};

const parametersToRequestData = makeParametersToRequestData({
    searchFieldToTransientFields: [],
    clientFields,
    clientFilters,
});

const clientFromAPI = makeClientFromAPI(clientFields);

export const tasks = {
    /// httpLog/list: fetches log items
    ///
    /// See codeholders/list for parameters and return value format.
    list: async (_, parameters) => {
        const client = await asyncClient;

        const { options, usedFilters, transientFields } = parametersToRequestData(parameters);

        const result = await client.get('/http_log', options);
        let list = result.body;
        const totalItems = +result.res.headers.get('x-total-items');

        for (const item of list) {
            const existing = store.get([HTTP_LOG, item.id]);
            store.insert([HTTP_LOG, item.id], deepMerge(existing, clientFromAPI(item)));
        }

        list = list.map(item => item.id);

        return {
            items: list,
            total: totalItems,
            transientFields,
            stats: {
                time: result.resTime,
                filtered: usedFilters,
            },
        };
    },
};

export const views = {
    /// httpLog/request: observes (and fetches) a request
    ///
    /// # Options
    /// - id: request id
    /// - fields: list of field ids to consider the minimal required set (will be fetched)
    /// - noFetch: if true, will not fetch
    /// - lazyFetch: if true, will only fetch if the data is missing
    request: class RequestView extends AbstractDataView {
        constructor (options) {
            super();
            const { id, fields } = options;
            this.id = id;
            this.fields = fields;

            store.subscribe([HTTP_LOG, this.id], this.#onUpdate);
            const current = store.get([HTTP_LOG, this.id]);
            if (current) setImmediate(this.#onUpdate);

            let shouldFetch = !options.noFetch;
            if (options.lazyFetch) {
                shouldFetch = false;
                for (const field of options.fields) {
                    if (!current || !current[field]) {
                        shouldFetch = true;
                        break;
                    }
                }
            }

            /// Note that this specifically uses the id argument and not this.id so that we’re
            /// fetching `self` instead of the resolved id if id is set to `self`
            if (shouldFetch) {
                tasks.list({}, {
                    jsonFilter: {
                        filter: { id },
                    },
                    fields: fields.map(field => ({ id: field, sorting: 'none' })),
                    limit: 1,
                }).catch(err => this.emit('error', err));
            }
        }

        #onUpdate = (type) => {
            if (type === store.UpdateType.DELETE) {
                this.emit('update', store.get([HTTP_LOG, this.id]), 'delete');
            } else {
                this.emit('update', store.get([HTTP_LOG, this.id]));
            }
        };

        drop () {
            store.unsubscribe([HTTP_LOG, this.id], this.#onUpdate);
        }
    },
};