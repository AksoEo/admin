import { h } from 'preact';
import { Button, Checkbox, TextField } from '@cpsdqs/yamdl';
import moment from 'moment';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import Segmented from '../../../../../components/segmented';
import CountryPicker from '../../../../../components/country-picker';
import Select from '../../../../../components/select';
import { congressParticipants as locale } from '../../../../../locale';
import { currencyAmount, date, time, timestamp } from '../../../../../components/data';
import './filters.less';

export const FILTERS = {
    approval: {
        default: () => ({ enabled: false, value: null }),
        serialize: ({ value }) => '' + value,
        deserialize: value => ({ enabled: true, value }),
        editor ({ value, onChange, onEnabledChange, hidden }) {
            return (
                <div class="approval-filter">
                    <Segmented
                        class="smaller"
                        disabled={hidden}
                        selected={value || 'none'}
                        onSelect={value => {
                            onChange(value === 'none' ? null : value);
                            onEnabledChange(value !== 'none');
                        }}>
                        {Object.keys(locale.search.filters.approvalTypes).map(type => ({
                            id: type,
                            label: locale.search.filters.approvalTypes[type],
                            class: type === 'none' ? 'bordered' : '',
                        }))}
                    </Segmented>
                </div>
            );
        },
    },
    createdTime: {
        needsSwitch: true,
        default: () => ({ enabled: false, value: [new Date(), new Date()] }),
        serialize: ({ value }) => `${value[0].toISOString()}$${value[1].toISOString()}`,
        deserialize: value => ({ enabled: true, value: value.split('$').map(date => new Date(date)) }),
        editor ({ value, onChange, onEnabledChange, hidden }) {
            return (
                <div class="created-time-filter">
                    <div>
                        <timestamp.editor outline label={locale.search.filters.timeRangeStart} disabled={hidden} value={+value[0] / 1000} onChange={v => {
                            onChange([new Date(v * 1000), value[1]]);
                            onEnabledChange(true);
                        }} />
                    </div>
                    <div>
                        <timestamp.editor outline label={locale.search.filters.timeRangeEnd} disabled={hidden} value={+value[1] / 1000} onChange={v => {
                            onChange([value[0], new Date(v * 1000)]);
                            onEnabledChange(true);
                        }} />
                    </div>
                </div>
            );
        },
    },
    amountPaid: {
        needsSwitch: true,
        default: () => ({ enabled: false, value: [0, 100] }),
        serialize: ({ value }) => value.join('-'),
        deserialize: value => ({ enabled: true, value: value.split('-').map(x => +x) }),
        editor ({ value, onChange, hidden, userData }) {
            const { currency } = userData;

            return (
                <div class="amount-paid-filter">
                    <div>
                        <currencyAmount.editor
                            outline
                            currency={currency}
                            disabled={hidden}
                            value={value[0]}
                            onChange={v => {
                                onChange([v | 0, value[1]]);
                            }} />
                    </div>
                    <div>
                        <currencyAmount.editor
                            outline
                            currency={currency}
                            disabled={hidden}
                            value={value[1]}
                            onChange={v => {
                                onChange([value[0], v | 0]);
                            }} />
                    </div>
                </div>
            );
        },
    },
    hasPaidMinimum: {
        default: () => ({ enabled: false, value: null }),
        serialize: ({ value }) => value,
        deserialize: value => ({ enabled: true, value }),
        editor ({ value, onChange, onEnabledChange, hidden }) {
            return (
                <div class="paid-minimum-filter">
                    <Segmented
                        class="smaller"
                        disabled={hidden}
                        selected={value || 'none'}
                        onSelect={value => {
                            onChange(value === 'none' ? null : value);
                            onEnabledChange(value !== 'none');
                        }}>
                        {Object.keys(locale.search.filters.paidMinimumTypes).map(type => ({
                            id: type,
                            label: locale.search.filters.paidMinimumTypes[type],
                            class: type === 'none' ? 'bordered' : '',
                        }))}
                    </Segmented>
                </div>
            );
        },
    },
    validity: {
        default: () => ({ enabled: false, value: null }),
        serialize: ({ value }) => '' + value,
        deserialize: value => ({ enabled: true, value }),
        editor ({ value, onChange, onEnabledChange, hidden }) {
            return (
                <div class="validity-filter">
                    <Segmented
                        class="smaller"
                        disabled={hidden}
                        selected={value || 'none'}
                        onSelect={value => {
                            onChange(value === 'none' ? null : value);
                            onEnabledChange(value !== 'none');
                        }}>
                        {Object.keys(locale.search.filters.validityTypes).map(type => ({
                            id: type,
                            label: locale.search.filters.validityTypes[type],
                            class: type === 'none' ? 'bordered' : '',
                        }))}
                    </Segmented>
                </div>
            );
        },
    },
    canceled: {
        default: () => ({ enabled: false, value: null }),
        serialize: ({ value }) => '' + value,
        deserialize: value => ({ enabled: true, value }),
        editor ({ value, onChange, onEnabledChange, hidden }) {
            return (
                <div class="canceled-filter">
                    <Segmented
                        class="smaller"
                        disabled={hidden}
                        selected={value || 'none'}
                        onSelect={value => {
                            onChange(value === 'none' ? null : value);
                            onEnabledChange(value !== 'none');
                        }}>
                        {Object.keys(locale.search.filters.canceledTypes).map(type => ({
                            id: type,
                            label: locale.search.filters.canceledTypes[type],
                            class: type === 'none' ? 'bordered' : '',
                        }))}
                    </Segmented>
                </div>
            );
        },
    },
    data: {
        default: () => ({ enabled: false, value: [] }),
        serialize: ({ value }) => {
            let out = '';
            for (const item of value) {
                if (out) out += '$';
                out += encodeURIComponent(item.var);
                out += '$';
                out += item.op;
                out += '$';
                if (item.value === null) out += 'u';
                else if (typeof item.value === 'boolean') out += 'b';
                else if (typeof item.value === 'number') out += 'n';
                else if (typeof item.value === 'string') out += 's';

                if (item.value) out += item.value;
            }
            return out;
        },
        deserialize: value => {
            const items = [];
            const parts = value.split('$');
            for (let i = 0; i < parts.length / 3; i++) {
                const varName = decodeURIComponent(parts[i * 3]);
                const op = parts[i * 3 + 1];
                const valueDesc = parts[i * 3 + 2];

                const valueType = valueDesc[0];
                const valueStr = valueDesc.substr(1);
                let value = null;
                if (valueType === 'b') value = valueStr === 'true';
                else if (valueType === 'n') value = parseFloat(valueStr) || 0;
                else if (valueType === 's') value = valueStr;

                items.push({ var: varName, op, value });
            }
            return { enabled: true, value: items };
        },
        editor ({ value, onChange, onEnabledChange, userData }) {
            if (!userData.registrationForm) return null;
            const contents = [];

            for (let i = 0; i < value.length; i++) {
                const index = i;
                contents.push(
                    <DataPredicate
                        key={i}
                        form={userData.registrationForm}
                        currency={userData.currency}
                        predicate={value[index]}
                        onChange={item => {
                            const v = value.slice();
                            v[index] = item;
                            onChange(v);
                        }}
                        onRemove={() => {
                            const v = value.slice();
                            v.splice(index, 1);
                            if (!v.length) onEnabledChange(false);
                            onChange(v);
                        }} />
                );
            }

            const addPredicate = () => {
                if (!value.length) onEnabledChange(true);
                onChange(value.concat({ var: '', op: '', value: null }));
            };

            contents.push(
                <div class="add-predicate">
                    <Button icon small onClick={addPredicate}>
                        <AddIcon style={{ verticalAlign: 'middle' }} />
                    </Button>
                </div>
            );

            return (
                <div class={'participants-data-filter' + (!value.length ? ' is-empty' : '')}>
                    {contents}
                </div>
            );
        },
    },
};

function DataPredicate ({ form, predicate, onChange, onRemove, currency }) {
    const remove = (
        <Button icon small onClick={onRemove} class="remove-predicate-button">
            <RemoveIcon style={{ verticalAlign: 'middle' }} />
        </Button>
    );

    let selectedItem = null;
    const variableOptions = [];
    for (const item of form) {
        if (item.el === 'input') {
            if (item.type === 'text' || item.type === 'boolean_table') continue;
            if (item.name === predicate.var) selectedItem = item;
            variableOptions.push({ value: item.name, label: item.name });
        }
    }

    const subject = (
        <Select
            value={predicate.var}
            onChange={v => {
                let value = null;
                for (const item of form) {
                    if (item.name === v) {
                        value = getZeroValueForType(item.type);
                        break;
                    }
                }
                onChange({ var: v, op: '', value });
            }}
            items={variableOptions} />
    );

    let verb = null;
    let object = null;
    if (selectedItem) {
        const [verbType, objectType] = getVerbAndObjectForType(selectedItem.type);
        if (verbType) {
            const verbOptions = Object.keys(locale.search.filters.dataVerbs[verbType])
                .map(k => ({ value: k, label: locale.search.filters.dataVerbs[verbType][k] }));

            verb = (
                <Select
                    value={predicate.op}
                    onChange={op => onChange({ ...predicate, op })}
                    items={verbOptions} />
            );

            if (predicate.op) {
                const ObjEditor = predicateObjectEditors[objectType];
                object = <ObjEditor
                    item={selectedItem}
                    value={predicate.value}
                    onChange={value => onChange({ ...predicate, value })}
                    currency={currency} />;
            }
        }
    }

    return (
        <div class="data-filter-predicate">
            {remove}
            {subject}
            {verb}
            {object}
        </div>
    );
}

function getVerbAndObjectForType (type) {
    if (type === 'boolean') return ['eq', 'bool'];
    if (type === 'number') return ['ord', 'number'];
    if (type === 'money') return ['ord', 'money'];
    if (type === 'enum') return ['eq', 'enum'];
    if (type === 'country') return ['set', 'countries'];
    if (type === 'date') return ['ord', 'date'];
    if (type === 'time') return ['ord', 'time'];
    if (type === 'datetime') return ['ord', 'datetime'];
    return [null, null];
}

function getZeroValueForType (type) {
    if (type === 'boolean') return false;
    if (type === 'number') return 0;
    if (type === 'money') return 0;
    if (type === 'enum') return '';
    if (type === 'country') return '';
    if (type === 'date') return moment().format('YYYY-MM-DD');
    if (type === 'time') return 0;
    if (type === 'datetime') return Math.floor(Date.now() / 1000);
    return null;
}

const predicateObjectEditors = {
    bool: ({ value, onChange }) => <Checkbox checked={value} onChange={onChange} />,
    number: ({ value, onChange }) => <TextField
        outline
        autocomplete="off"
        type="number"
        value={+(+value).toFixed(3)}
        onChange={e => {
            const n = parseFloat(e.target.value);
            if (Number.isFinite(n)) onChange(n);
        }} />,
    money: ({ value, onChange, currency }) => <currencyAmount.editor
        outline
        value={value}
        onChange={onChange}
        currency={currency} />,
    enum: ({ value, onChange, item }) => <Select
        value={value}
        onChange={onChange}
        items={item.options.map(opt => ({ value: opt.value, label: opt.name }))} />,
    countries: ({ value, onChange }) => <CountryPicker
        value={value.split(',')}
        onChange={v => onChange(v.join(','))} />,
    date: date.editor,
    time: time.editor,
    datetime: timestamp.editor,
};
