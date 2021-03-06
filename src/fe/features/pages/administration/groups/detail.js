import { h } from 'preact';
import { useRef, useState, PureComponent } from 'preact/compat';
import AddIcon from '@material-ui/icons/Add';
import EditIcon from '@material-ui/icons/Edit';
import SearchIcon from '@material-ui/icons/Search';
import { Button, Dialog, LinearProgress, TextField } from '@cpsdqs/yamdl';
import Tabs from '../../../../components/tabs';
import Page from '../../../../components/page';
import CODEHOLDER_FIELDS from '../../codeholders/table-fields';
import { FIELDS as CLIENT_FIELDS } from '../clients/index';
import DetailView from '../../../../components/detail';
import SearchFilters from '../../../../components/search-filters';
import OverviewList from '../../../../components/overview-list';
import StaticOverviewList from '../../../../components/overview-list-static';
import GlobalFilterNotice from '../../codeholders/global-filter-notice';
import { PickerDialog as CodeholderPickerDialog } from '../../../../components/codeholder-picker';
import Meta from '../../../meta';
import { coreContext } from '../../../../core/connection';
import { LinkButton } from '../../../../router';
import { adminGroups as locale, clients as clientsLocale, codeholders as codeholdersLocale } from '../../../../locale';
import { connectPerms } from '../../../../perms';
import './detail.less';

export default connectPerms(class AdminGroupDetailPage extends Page {
    state = {
        edit: null,
        editing: false,
        tab: 'codeholders',
    };

    static contextType = coreContext;

    onEndEdit = () => {
        this.props.editing && this.props.editing.pop(true);
        this.setState({ edit: null });
    };

    #commitTask = null;
    onCommit = changedFields => {
        if (!this.props.editing || this.#commitTask) return;
        if (!changedFields.length) {
            // nothing changed, so we can just pop the editing state
            this.props.editing.pop(true);
            return;
        }

        this.#commitTask = this.context.createTask('adminGroups/update', {
            id: this.props.match[1],
            _changedFields: changedFields,
        }, this.state.edit);
        this.#commitTask.on('success', this.onEndEdit);
        this.#commitTask.on('drop', () => this.#commitTask = null);
    };

    componentDidUpdate () {
        if (!this.didInitWithPerms) this.tryInitWithPerms();
    }

    tryInitWithPerms () {
        if (this.props.perms._isDummy) return;
        this.didInitWithPerms = true;

        const tab = this.state.tab;
        const perms = this.props.perms;

        if (tab === 'clients' && !perms.hasPerm('clients.read')) {
            this.setState({ tab: 'codeholders' });
        } else if (tab === 'codeholders' && !perms.hasPerm('codeholders.read')) {
            this.setState({ tab: 'clients' });
        }
    }

    componentWillUnmount () {
        if (this.#commitTask) this.#commitTask.drop();
    }

    get id () {
        return this.props.match[1];
    }

    render ({ perms, editing }, { tab, edit }) {
        const actions = [];
        const permsTarget = `/administrado/grupoj/${this.id}/permesoj`;

        if (perms.hasPerm('admin_groups.update')) {
            actions.push({
                icon: <EditIcon style={{ verticalAlign: 'middle' }} />,
                label: locale.edit,
                action: () => this.props.push('redakti'),
            });
        }

        if (perms.hasPerm('admin_groups.delete')) {
            actions.push({
                overflow: true,
                label: locale.delete,
                action: () => this.context.createTask('adminGroups/delete', {}, { id: this.id }),
            });
        }

        const showList = perms.hasPerm('clients.read') || perms.hasPerm('codeholders.read');

        // still show the other tab items to imply that they exist, but disable the ability to
        // switch to them
        const canChangeTabs = perms.hasPerm('clients.read') && perms.hasPerm('codeholders.read');
        const canEditItems = perms.hasPerm('admin_groups.update') && (tab === 'clients'
            ? perms.hasPerm('clients.read')
            : perms.hasPerm('codeholders.read'));

        return (
            <div class="admin-group-detail-page">
                <Meta
                    title={locale.detailTitle}
                    actions={actions} />
                <DetailView
                    compact
                    view="adminGroups/group"
                    id={this.id}
                    header={Header}
                    fields={fields}
                    locale={locale}
                    userData={{ permsTarget }}
                    edit={edit}
                    onEditChange={edit => this.setState({ edit })}
                    editing={editing}
                    onEndEdit={this.onEndEdit}
                    onCommit={this.onCommit} />
                {showList && (
                    <Tabs
                        class="tab-switcher"
                        value={tab}
                        onChange={tab => this.setState({ tab })}
                        disabled={!canChangeTabs}
                        tabs={{
                            codeholders: locale.tabs.codeholders,
                            clients: locale.tabs.clients,
                        }} />
                )}
                {showList && (
                    <GroupList
                        tab={tab}
                        id={this.id}
                        editing={canEditItems && editing}
                        perms={perms} />
                )}
            </div>
        );
    }
});

function GroupList ({ tab, id, editing, perms }) {
    if (tab === 'codeholders') {
        return <CodeholdersList perms={perms} id={id} editing={editing} />;
    } else if (tab === 'clients') {
        return <ClientsList perms={perms} id={id} editing={editing} />;
    }
}

/// Handles item list during editing.
///
/// - task: list task
/// - addTask/deleteTask
/// - type: type used in add/delete tasks
/// - id: group id
/// - editing
class WithItems extends PureComponent {
    state = {
        selection: [],
        data: [],
        loading: false,
        addingItems: null,
        deletingItems: null,
    };

    static contextType = coreContext;

    componentDidMount () {
        this.load(true);
    }

    componentWillUnmount () {
        this.dead = true;
    }

    load (first = false) {
        if (!this.props.task) return;
        if (this.dead) return;
        if (first) this.setState({ data: [] });
        this.setState({ loading: true });
        this.context.createTask(this.props.task, { group: this.props.id }, {
            offset: this.state.data.length,
            fields: [],
            limit: 100,
        }).runOnceAndDrop().then(res => {
            if (!res.items.length) {
                this.setState({ loading: false });
                return;
            }
            this.setState({
                data: this.state.data.slice().concat(res.items.filter(x => !this.state.data.includes(x))),
            }, () => this.load());
        }).catch(err => {
            console.error(err); // eslint-disable-line no-console
            setTimeout(() => this.load(), 4000);
        });
    }

    hasItem = id => {
        if (this.state.addingItems.includes(id)) return null;
        if (this.state.deletingItems.includes(id)) return null;
        return this.state.data.includes(id);
    };

    addSelected = id => {
        this.setState({ selection: this.state.selection.slice().concat([id]) });
    };
    deleteSelected = id => {
        const selection = this.state.selection.slice();
        selection.splice(selection.indexOf(id), 1);
        this.setState({ selection });
    };
    hasSelected = id => this.state.selection.includes(id);

    addItems = async (items) => {
        try {
            for (let i = 0; i < items.length; i++) {
                const id = items[i];
                this.setState({ addingItems: i / items.length });
                await this.context.createTask(this.props.addTask, {
                    group: this.props.id,
                }, { [this.props.type]: id }).runOnceAndDrop().then(() => {
                    const data = this.state.data.slice();
                    if (!data.includes(id)) data.push(id);
                    this.setState({ data });
                });
            }
        } catch (e) {
            this.setState({ addingItems: null });
            throw e;
        }
        this.setState({ selection: [], addingItems: null });
    };
    deleteSelection = async () => {
        const selection = this.state.selection.slice();

        try {
            for (let i = 0; i < selection.length; i++) {
                const id = selection[i];
                this.setState({ deletingItems: i / selection.length });
                await this.context.createTask(this.props.deleteTask, {
                    group: this.props.id,
                }, { [this.props.type]: id }).runOnceAndDrop().then(() => {
                    const data = this.state.data.slice();
                    data.splice(data.indexOf(id), 1);
                    if (data.includes(id)) data.splice(data.indexOf(id), 1);
                    this.setState({ data });
                });
            }
        } catch (e) {
            this.setState({ deletingItems: null });
            throw e;
        }
        this.setState({ selection: [], deletingItems: null });
    };

    selection = {
        add: this.addSelected,
        delete: this.deleteSelected,
        has: this.hasSelected,
    };

    render ({ children }) {
        const contents = children(this.selection, this.state.loading, this.state.data);
        return (
            <div class="set-container">
                <div class={'set-header' + (this.state.selection.length ? ' has-selection' : '')}>
                    <Button icon small onClick={this.props.onAdd}>
                        <AddIcon style={{ verticalAlign: 'middle' }} />
                    </Button>
                    <div class="selection-header">
                        <Button disabled={!this.state.selection.length} onClick={this.deleteSelection}>
                            {locale.removeCodeholders(this.state.selection.length)}
                        </Button>
                    </div>
                    <Dialog open={this.state.deletingItems !== null}>
                        <div>{locale.removingMembers}</div>
                        <LinearProgress progress={this.state.deletingItems} />
                    </Dialog>
                    <Dialog open={this.state.addingItems !== null}>
                        <div>{locale.addingMembers}</div>
                        <LinearProgress progress={this.state.addingItems} />
                    </Dialog>
                </div>
                {contents}
            </div>
        );
    }
}

function CodeholdersList ({ perms, id, editing }) {
    const [adding, setAdding] = useState(false);
    const [addingValue, setAddingValue] = useState([]);
    const [offset, setOffset] = useState(0);
    const [parameters, setParameters] = useState({
        limit: 10,
        fields: [{ id: 'code', sorting: 'asc' }, { id: 'name', sorting: 'asc' }],
        search: { field: 'nameOrCode', query: '' },
        filters: {},
    });
    const items = useRef(null);

    return (
        <div class="group-member-list">
            <SearchFilters
                value={parameters}
                onChange={setParameters}
                searchFields={['nameOrCode', 'email', 'searchAddress', 'notes']}
                expanded={false}
                onExpandedChange={() => {}}
                locale={{
                    searchFields: codeholdersLocale.search.fields,
                    searchPlaceholders: codeholdersLocale.search.placeholders,
                }} />
            <WithItems
                ref={items}
                id={id}
                type="codeholder"
                task="adminGroups/listCodeholders"
                addTask="adminGroups/addCodeholder"
                deleteTask="adminGroups/removeCodeholder"
                onAdd={() => {
                    setAdding(true);
                    setAddingValue([]);
                }}
                editing={editing}>
                {(selection, loading, data) => (
                    <div>
                        <CodeholderPickerDialog
                            open={adding}
                            onClose={() => setAdding(false)}
                            value={addingValue}
                            onChange={setAddingValue}
                            filter={{ id: { $nin: data } }}
                            actions={[
                                {
                                    label: locale.addButton,
                                    action: () => {
                                        items.current.addItems(addingValue);
                                        setAdding(false);
                                    },
                                },
                            ]} />
                        <OverviewList
                            task="adminGroups/listCodeholders"
                            notice={<GlobalFilterNotice perms={perms} />}
                            view="codeholders/codeholder"
                            selection={selection}
                            options={{ group: id }}
                            fields={CODEHOLDER_FIELDS}
                            useDeepCmp
                            parameters={{ ...parameters, offset }}
                            onGetItemLink={id => `/membroj/${id}`}
                            outOfTree
                            onSetOffset={setOffset}
                            onSetLimit={limit => setParameters({ ...parameters, limit })}
                            onSetFields={fields => setParameters({ ...parameters, fields })}
                            updateView={editing ? null : ['adminGroups/group', { id }]}
                            locale={codeholdersLocale.fields} />
                    </div>
                )}
            </WithItems>
        </div>
    );
}

function ClientsList ({ perms, id, editing }) {
    const [adding, setAdding] = useState(false);
    const [addingValue, setAddingValue] = useState([]);
    const [offset, setOffset] = useState(0);
    const [parameters, setParameters] = useState({
        limit: 10,
        fields: [{ id: 'name', sorting: 'none' }, { id: 'ownerName', sorting: 'none' }, { id: 'apiKey', sorting: 'asc' }],
        search: { field: 'name', query: '' },
    });
    const items = useRef(null);

    return (
        <div class="group-member-list">
            <SearchFilters
                value={parameters}
                onChange={setParameters}
                searchFields={['name', 'apiKey', 'ownerName', 'ownerEmail']}
                filters={{}}
                expanded={false}
                onExpandedChange={() => {}}
                locale={{
                    searchFields: clientsLocale.fields,
                    searchPlaceholders: clientsLocale.search.placeholders,
                }} />
            <WithItems
                ref={items}
                id={id}
                type="client"
                task="adminGroups/listClients"
                addTask="adminGroups/addClient"
                deleteTask="adminGroups/removeClient"
                onAdd={() => {
                    setAdding(true);
                    setAddingValue([]);
                }}
                editing={editing}>
                {(selection, loading, data) => (
                    <div>
                        <ClientPicker
                            open={adding}
                            onClose={() => setAdding(false)}
                            value={addingValue}
                            onChange={setAddingValue}
                            onCommit={() => {
                                items.current.addItems(addingValue);
                                setAdding(false);
                            }}
                            exclude={data} />
                        <OverviewList
                            task={'adminGroups/listClients'}
                            notice={<GlobalFilterNotice perms={perms} />}
                            view="clients/client"
                            selection={selection}
                            options={{ group: id }}
                            fields={CLIENT_FIELDS}
                            useDeepCmp
                            parameters={{ ...parameters, offset }}
                            onGetItemLink={id => `/administrado/klientoj/${id}`}
                            outOfTree
                            onSetOffset={setOffset}
                            onSetLimit={limit => setParameters({ ...parameters, limit })}
                            onSetFields={fields => setParameters({ ...parameters, fields })}
                            updateView={editing ? null : ['adminGroups/group', { id }]}
                            locale={clientsLocale.fields} />
                    </div>
                )}
            </WithItems>
        </div>
    );
}

function Header ({ item, userData, editing }) {
    if (editing) return null;
    return (
        <div class="group-header">
            <h1 class="group-title">{item.name}</h1>
            <div class="group-description">{item.description}</div>
            <LinkButton class="edit-perms-button" target={userData.permsTarget}>
                {locale.editPerms}
            </LinkButton>
        </div>
    );
}

const fields = {
    name: {
        component ({ value, onChange }) {
            return (
                <TextField
                    outline
                    value={value}
                    onChange={e => onChange(e.target.value)} />
            );
        },
        shouldHide: (_, editing) => !editing,
    },
    description: {
        component ({ value, onChange }) {
            return (
                <TextField
                    outline
                    value={value}
                    onChange={e => onChange(e.target.value)} />
            );
        },
        shouldHide: (_, editing) => !editing,
    },
};

function ClientPicker ({
    open,
    onClose,
    value,
    onChange,
    onCommit,
    exclude,
}) {
    const [offset, setOffset] = useState(0);
    const [search, setSearch] = useState('');
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
    // FIXME: don't reappropriate the codeholder picker styles
    return (
        <Dialog
            backdrop
            class="codeholder-picker-add-dialog"
            open={open}
            onClose={onClose}
            actions={[{ label: locale.addButton, action: onCommit }]}>
            <div class="codeholder-picker-search">
                <div class="search-icon-container">
                    <SearchIcon />
                </div>
                <input
                    class="search-inner"
                    placeholder={locale.pickerSearch}
                    value={search}
                    onChange={e => setSearch(e.target.value)} />
            </div>
            <StaticOverviewList
                compact
                task="clients/list"
                view="clients/client"
                search={{ field: 'name', query: search }}
                jsonFilter={{ apiKey: { $nin: exclude || [] } }}
                fields={CLIENT_FIELDS}
                sorting={{ code: 'asc' }}
                offset={offset}
                onSetOffset={setOffset}
                selection={selection}
                onItemClick={id => {
                    if (value.includes('' + id)) {
                        selection.delete(id);
                    } else {
                        selection.add(id);
                    }
                }}
                limit={10}
                locale={locale.fields} />
        </Dialog>
    );
}
