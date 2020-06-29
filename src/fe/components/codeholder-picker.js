import { h, Component } from 'preact';
import { useState } from 'preact/compat';
import { Button, Dialog } from '@cpsdqs/yamdl';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import StaticOverviewList from './overview-list-static';
import { ueaCode } from './data';
import { coreContext } from '../core/connection';
import { codeholders as locale } from '../locale';
import FIELDS from '../features/pages/codeholders/table-fields'; // FIXME: dont ximport
import './codeholder-picker.less';

const REDUCED_FIELD_IDS = ['type', 'code', 'name'];
const REDUCED_FIELDS = Object.fromEntries(REDUCED_FIELD_IDS.map(id => [id, FIELDS[id]]));

const portalContainer = document.createElement('div');
portalContainer.id = 'codeholder-picker-portal-container';
document.body.appendChild(portalContainer);

function orderPortalContainerFront () {
    document.body.removeChild(portalContainer);
    document.body.appendChild(portalContainer);
}


/// Picks a codeholder and displays their UEA code.
///
/// # Props
/// - value/onChange
/// - limit: if set, will limit number of selectable codeholders
export default class CodeholderPicker extends Component {
    state = {
        search: '',
        addDialogOpen: false,

        // cached id -> uea code mappings
        codeCache: {},
    };

    static contextType = coreContext;

    itemHeight = 48;

    scheduledLoads = new Set();

    componentDidMount () {
        for (const id of this.props.value) this.loadCodeForId(id);
        this.onSearchChange('');
    }

    componentDidUpdate (prevProps) {
        if (prevProps.value !== this.props.value) {
            for (const id of this.props.value) this.loadCodeForId(id);
        }
    }

    loadCodeForId (id) {
        if (this.state.codeCache[id]) return;
        return new Promise((resolve, reject) => {
            const view = this.context.createDataView('codeholders/codeholder', {
                id,
                fields: ['code'],
                lazyFetch: true,
            });
            view.on('update', () => {
                // HACK: mutate object directly to avoid lost updates
                const codeCache = this.state.codeCache;
                codeCache[id] = view.data.code.new;
                this.setState({ codeCache });
                view.drop();
                resolve();
            });
            view.on('error', () => {
                view.drop();
                reject();
            });
        });
    }

    getChunk = async (offset, limit) => {
        const idFilter = { $nin: this.props.value };

        const res = await this.context.createTask('codeholders/list', {}, {
            search: {
                field: 'nameOrCode',
                query: this.state.search,
            },
            fields: [{ id: 'id', sorting: 'asc' }, { id: 'code', sorting: 'none' }],
            jsonFilter: { filter: { id: idFilter } },
            offset,
            limit,
        }).runOnceAndDrop();

        for (const id of res.items) {
            await this.loadCodeForId(id);
        }

        return res.items;
    };

    _searchReqId = 0;

    onSearchChange = search => {
        this.setState({ search }, () => {
            const reqId = ++this._searchReqId;
            this.getChunk(0, 7).then(items => {
                if (this._searchReqId !== reqId) return;
                this.setState({
                    suggestions: items.filter(id => !this.props.value.includes(id)).map(id => ({
                        id,
                        toString: () => '' + this.state.codeCache[id],
                    })),
                });
            }).catch(err => {
                console.error(err); // eslint-disable-line no-console
            });
        });
    };

    render ({ value, onChange, limit, disabled }, { addDialogOpen }) {
        const canAddMore = !this.props.limit || value.length < this.props.limit;

        return (
            <div class="codeholder-picker" data-limit={limit}>
                <div
                    class="selected-codeholders"
                    onClick={() => this.setState({ dialogOpen: true })}>
                    {value.map(id => (
                        <div class="codeholder-item" key={id}>
                            <Button class="remove-button" icon small onClick={() => {
                                const value = this.props.value.slice();
                                value.splice(value.indexOf(id), 1);
                                onChange(value);
                            }}>
                                <RemoveIcon />
                            </Button>
                            {this.state.codeCache[id]
                                ? <ueaCode.inlineRenderer value={this.state.codeCache[id]} />
                                : `(${id})`}
                        </div>
                    ))}
                    {(!value.length && this.props.limit !== 1) && locale.picker.none}

                    {canAddMore ? (
                        <Button small icon onClick={() => {
                            this.setState({ addDialogOpen: true });
                            orderPortalContainerFront();
                        }}>
                            <AddIcon />
                        </Button>
                    ) : null}

                    <Dialog
                        class="codeholder-picker-add-dialog"
                        backdrop
                        fullScreen={width => width < 600}
                        title={this.props.limit === 1 ? locale.picker.addOne : locale.picker.add}
                        container={portalContainer}
                        open={canAddMore && addDialogOpen}
                        onClose={() => this.setState({ addDialogOpen: false })}>
                        <AddDialogInner
                            value={value}
                            onChange={onChange}
                            limit={this.props.limit} />
                    </Dialog>
                </div>
            </div>
        );
    }
}

function AddDialogInner ({ value, onChange, limit }) {
    const [offset, setOffset] = useState(0);

    const selection = {
        add: id => {
            if (value.includes('' + id)) return;
            onChange(value.concat(['' + id]));
        },
        has: id => value.includes('' + id),
        delete: id => {
            if (!value.includes('' + id)) return;
            const newValue = value.slice();
            newValue.splice(value.indexOf('' + id), 1);
            onChange(newValue);
        },
    };

    return (
        <StaticOverviewList
            compact
            task="codeholders/list"
            view="codeholders/codeholder"
            fields={REDUCED_FIELDS}
            sorting={{ code: 'asc' }}
            offset={offset}
            onSetOffset={setOffset}
            selection={limit === 1 ? null : selection}
            onItemClick={id => {
                if (value.includes('' + id)) {
                    selection.delete(id);
                } else {
                    selection.add(id);
                }
            }}
            limit={10}
            locale={locale.fields} />
    );
}
