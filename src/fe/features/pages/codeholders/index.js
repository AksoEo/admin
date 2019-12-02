import { h } from 'preact';
import AddIcon from '@material-ui/icons/Add';
import SortIcon from '@material-ui/icons/Sort';
import SaveIcon from '@material-ui/icons/Save';
import ContactMailIcon from '@material-ui/icons/ContactMail';
import SearchFilters from '../../../components/search-filters';
import OverviewList from '../../../components/overview-list';
import FieldPicker from '../../../components/field-picker';
import { decodeURLQuery, encodeURLQuery } from '../../../components/list-url-coding';
import Page from '../../../components/page';
import { codeholders as locale, search as searchLocale } from '../../../locale';
import { coreContext } from '../../../core/connection';
import CSVExport from '../../../components/csv-export';
import Meta from '../../meta';
import FILTERS from './filters';
import FIELDS from './table-fields';
import AddrLabelGen from './addr-label-gen';
import './style';

const SEARCHABLE_FIELDS = [
    'nameOrCode',
    'email',
    'landlinePhone',
    'cellphone',
    'officePhone',
    'searchAddress',
    'notes',
];

/// The codeholders list page.
///
/// # Props
/// - query/onQueryChange: url query handling
/// - addrLabelGen: label gen state (see navigation)
export default class CodeholdersPage extends Page {
    state = {
        options: {
            search: {
                field: SEARCHABLE_FIELDS[0],
                query: '',
            },
            filters: {},
            jsonFilter: {
                _disabled: true,
                filter: {},
            },
            fields: [
                {
                    id: 'type',
                    sorting: 'none',
                    fixed: true,
                },
                {
                    id: 'code',
                    sorting: 'asc',
                },
                {
                    id: 'name',
                    sorting: 'none',
                },
                {
                    id: 'age',
                    sorting: 'none',
                },
                {
                    id: 'membership',
                    sorting: 'none',
                },
                {
                    id: 'country',
                    sorting: 'none',
                },
            ],
            offset: 0,
            limit: 10,
        },

        // whether the filters list is expanded
        expanded: false,
        fieldPickerOpen: false,
        csvExportOpen: false,
    };

    static contextType = coreContext;

    // current url query state
    #currentQuery = '';

    decodeURLQuery () {
        const decoded = decodeURLQuery(this.props.query, FILTERS);
        this.#currentQuery = this.props.query;

        const options = { ...this.state.options };
        if (decoded.search) options.search = decoded.search;
        else options.search.query = '';
        options.filters = { ...options.filters };
        if (decoded.filters) {
            options.filters._disabled = false;
            for (const id in decoded.filters) {
                options.filters[id] = decoded.filters[id];
            }
            for (const id in options.filters) {
                if (id === '_disabled') continue;
                if (!(id in decoded.filters)) options.filters[id].enabled = false;
            }
        } else {
            for (const id in options.filters) {
                if (id === '_disabled') continue;
                options.filters[id].enabled = false;
            }
        }
        if (decoded.jsonFilter) {
            // TODO
        }
        if (decoded.fields) {
            options.fields = options.fields.filter(x => x.fixed);
            const currentFieldIds = options.fields.map(x => x.id);
            for (const item of decoded.fields) {
                if (currentFieldIds.includes(item.id)) {
                    const i = options.fields.findIndex(x => x.id === item.id);
                    options.fields[i].sorting = item.sorting;
                    continue;
                }
                currentFieldIds.push(item.id);
                options.fields.push(item);
            }
        }
        if ('offset' in decoded) options.offset = decoded.offset;
        if ('limit' in decoded) options.limit = decoded.limit;
        this.setState({ options });
    }

    encodeURLQuery () {
        const encoded = encodeURLQuery(this.state.options, FILTERS);
        if (encoded === this.#currentQuery) return;
        this.#currentQuery = encoded;
        this.props.onQueryChange(encoded);
    }

    componentDidMount () {
        this.decodeURLQuery();
    }

    componentDidUpdate (prevProps, prevState) {
        if (prevProps.query !== this.props.query && this.props.query !== this.#currentQuery) {
            this.decodeURLQuery();
        }
        if (prevState.options !== this.state.options) {
            this.encodeURLQuery();
        }
    }

    render ({ addrLabelGen }) {
        // overflow menu
        const menu = [];

        menu.push({
            icon: <AddIcon style={{ verticalAlign: 'middle' }} />,
            label: locale.create,
            action: () => this.context.createTask('codeholders/create'), // task view
        });

        menu.push({
            icon: <SortIcon style={{ verticalAlign: 'middle' }} />,
            label: searchLocale.pickFields,
            action: () => this.setState({ fieldPickerOpen: true }),
        });

        if (!this.state.expanded) {
            menu.push({
                icon: <SaveIcon style={{ verticalAlign: 'middle' }} />,
                label: searchLocale.csvExport,
                action: () => this.setState({ csvExportOpen: true }),
                overflow: true,
            });
            if (!addrLabelGen) {
                menu.push({
                    icon: <ContactMailIcon style={{ verticalAlign: 'middle' }} />,
                    label: locale.addrLabelGen.menuItem,
                    action: () => this.props.onNavigate(`/membroj/etikedoj?${this.props.query}`),
                    overflow: true,
                });
            }
        }
        menu.push({
            label: searchLocale.resetFilters,
            action: () => this.setState({
                options: {
                    ...this.state.options,
                    filters: {},
                    jsonFilter: { _disabled: true },
                },
            }),
            overflow: true,
        });

        const { options, expanded } = this.state;

        return (
            <div class="codeholders-page" ref={node => this.node = node}>
                <Meta title={locale.title} actions={menu} />
                <SearchFilters
                    value={options}
                    onChange={options => this.setState({ options })}
                    searchFields={SEARCHABLE_FIELDS}
                    // TODO: use core views
                    fields={Object.keys(FIELDS)}
                    filters={FILTERS}
                    expanded={expanded}
                    onExpandedChange={expanded => this.setState({ expanded })}
                    locale={{
                        searchFields: locale.search.fields,
                        searchPlaceholders: locale.search.placeholders,
                        filters: locale.search.filters,
                    }}
                    category="codeholders" />
                <FieldPicker
                    open={this.state.fieldPickerOpen}
                    onClose={() => this.setState({ fieldPickerOpen: false })}
                    // TODO: use core views
                    available={Object.keys(FIELDS)}
                    sortables={Object.keys(FIELDS).filter(x => FIELDS[x].sortable)}
                    selected={options.fields}
                    onChange={fields => this.setState({ options: { ...options, fields } })}
                    locale={locale.fields} />
                <OverviewList
                    // TODO: also note global filter if present (use core view?)
                    task="codeholders/list"
                    parameters={options}
                    expanded={expanded}
                    fields={FIELDS}
                    onGetItemLink={id => `/membroj/${id}`}
                    onSetOffset={offset => this.setState({ options: { ...options, offset }})}
                    onSetLimit={limit => this.setState({ options: { ...options, limit }})}
                    locale={locale.fields} />
                <CSVExport
                    open={this.state.csvExportOpen}
                    onClose={() => this.setState({ csvExportOpen: false })}
                    task="codeholders/list"
                    parameters={options}
                    fields={FIELDS}
                    detailView="codeholders/codeholder"
                    detailViewOptions={id => ({ id, noFetch: true })}
                    locale={{
                        fields: Object.assign({}, locale.fields, locale.csvFields),
                    }}
                    filenamePrefix={locale.csvFilename}
                    userOptions={{
                        countryLocale: {
                            name: locale.csvOptions.countryLocale,
                            type: 'select',
                            options: Object.entries(locale.csvOptions.countryLocales),
                            default: 'eo',
                        },
                    }} />
                <AddrLabelGen
                    open={addrLabelGen}
                    lvIsCursed={this.state.lvIsCursed}
                    options={this.state.options}
                    onClose={() => addrLabelGen.pop()} />
            </div>
        );
    }
}
