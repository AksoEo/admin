import { h } from 'preact';
import { Validator } from '../../../../components/form';
import { TextField } from '@cpsdqs/yamdl';
import TejoIcon from '../../../../components/tejo-icon';
import UeaIcon from '../../../../components/uea-icon';
import { paymentOrgs as locale } from '../../../../locale';

export const FIELDS = {
    org: {
        slot: 'title',
        component ({ value }) {
            return value === 'tejo' ? <TejoIcon /> : value === 'uea' ? <UeaIcon /> : null;
        },
        stringify (value) {
            return value;
        },
        shouldHide: () => true,
        weight: 0.25,
    },
    name: {
        slot: 'title',
        component ({ value, editing, onChange }) {
            if (editing) {
                return <Validator
                    component={TextField}
                    validate={value => {
                        if (!value) throw { error: locale.update.nameRequired };
                    }}
                    value={value}
                    onChange={e => onChange(e.target.value)} />;
            }
            return value;
        },
        stringify (value) {
            return value;
        },
        shouldHide: (_, editing) => !editing,
    },
    description: {
        skipLabel: true,
        component ({ value, editing, onChange }) {
            if (editing) return <TextField value={value || ''} onChange={e => onChange(e.target.value || null)} />;
            return value;
        },
        stringify (value) {
            return value;
        },
        shouldHide: (_, editing) => !editing,
        weight: 2,
    },
};