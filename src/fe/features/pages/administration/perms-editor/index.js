import { h, Component } from 'preact';
import { useState } from 'preact/compat';
import { Checkbox } from '@cpsdqs/yamdl';
import {
    spec,
    memberFields as fieldsSpec,
    reverseMap,
    memberFieldsAll,
    memberFieldsRead,
    memberFieldsWrite,
} from '../../../../permissions';
import { data as locale } from '../../../../locale';
import JSONEditor from '../../../../components/json-editor';
import DisclosureArrow from '../../../../components/disclosure-arrow';
import {
    addPermission,
    hasPermission,
    removePermission,
    isPermissionUnknown,
    addMemberField,
    hasMemberField,
    removeMemberField,
} from './solver';
import './style';


/// Permissions editor.
/// Also edits member filter and member fields.
///
/// ```
/// struct PermsData {
///     permissions: string[],
///     mrEnabled: bool,
///     mrFilter: string,
///     mrFields: { [string]: string? } | null,
/// }
/// ```
///
/// # Props
/// - value/onChange: PermsData
/// - editable: if false, will not show as editable
export default class PermsEditor extends Component {
    state = {
        showImplied: null,
        // if true, will show raw perm ids
        showRaw: false,
    };

    #node = null;

    render ({
        value,
        onChange,
        editable,
    }, { showRaw }) {
        if (!value) return null;
        const { permissions, mrEnabled, mrFilter, mrFields } = value;

        const ctx = {
            showRaw,
            editable,
            permissions,
            memberFields: mrFields,
            showImplied: new Set(), // TODO
            setShowImplied: implied => this.setState({ showImplied: implied }),
            togglePerm: perm => {
                if (hasPermission(permissions, mrFields, perm)) {
                    const [p, m] = removePermission(permissions, mrFields, perm);
                    onChange({ ...value, permissions: p, mrFields: m });
                } else {
                    const [p, m] = addPermission(permissions, mrFields, perm);
                    onChange({ ...value, permissions: p, mrFields: m });
                }
            },
            toggleField: (field, flags) => {
                if (hasMemberField(permissions, mrFields, field, flags)) {
                    const [p, m] = removeMemberField(permissions, mrFields, field, flags);
                    onChange({ ...value, permissions: p, mrFields: m });
                } else {
                    const [p, m] = addMemberField(permissions, mrFields, field, flags);
                    onChange({ ...value, permissions: p, mrFields: m });
                }
            },
            toggleAllFields: () => {
                if (mrFields === null) onChange({ ...value, mrFields: {} });
                else onChange({ ...value, mrFields: null });
            },
            memberFilter: mrFilter,
            setMemberFilter: filter => onChange({ ...value, mrFilter: filter }),
            mrEnabled: mrEnabled,
            setMREnabled: enabled => onChange({ ...value, mrEnabled: enabled }),
        };

        const unknown = permissions.filter(isPermissionUnknown);
        const unknownPerms = unknown.map(perm => (
            <PermsItem key={perm} item={{ type: 'perm', name: perm, id: perm }} ctx={ctx} />
        ));

        return (
            <div class="perms-editor" ref={node => this.#node = node}>
                <p>
                    {locale.permsEditor.note}
                </p>
                {spec.map((x, i) => <PermsItem item={x} key={i} ctx={ctx} />)}
                {unknownPerms}
            </div>
        );
    }
}

/// Renders a human-readable name for a given permission.
function PermName ({ id }) {
    if (!reverseMap[id]) return id;
    const item = reverseMap[id];
    let c = spec;
    const nameParts = [];
    for (const i of item.path) {
        if (c.name) nameParts.push(c.name);
        if (Array.isArray(c)) c = c[i]; // root node
        else c = (c.children || c.options)[i];
    }
    if (c.name) nameParts.push(c.name);
    return nameParts.join(' › ');
}

function PermsItem ({ item, ctx, disabled }) {
    disabled = disabled || !ctx.editable;
    const unfulfilledRequirements = [];
    if (item.requires) {
        for (const req of item.requires) {
            if (!hasPermission(ctx.permissions, ctx.memberFields, req)) {
                disabled = true;
                unfulfilledRequirements.push(req);
            }
        }
    }

    let reqNotice = null;
    if (unfulfilledRequirements.length) {
        reqNotice = (
            <div class="perms-req-notice">
                {locale.permsEditor.requires} {unfulfilledRequirements.map(i => <PermName key={i} id={i} />)}
            </div>
        );
    }

    if (item.type === 'category') {
        const [expanded, setExpanded] = useState(true);

        return (
            <div class={'perms-category' + (expanded ? ' is-expanded' : '')}>
                <button class="category-title" onClick={() => setExpanded(!expanded)}>
                    <DisclosureArrow dir={expanded ? 'up' : 'down'} />
                    <span class="category-title-inner">{item.name}</span>
                </button>
                {reqNotice}
                {expanded ? (
                    <div class="perms-category-contents">
                        {item.children.map((x, i) => <PermsItem key={i} item={x} ctx={ctx} disabled={disabled} />)}
                    </div>
                ) : null}
            </div>
        );
    } else if (item.type === 'group') {
        return (
            <div class="perms-group">
                {item.name ? <div class="group-title">{item.name}</div> : null}
                {reqNotice}
                {item.children.map((x, i) => <PermsItem key={i} item={x} ctx={ctx} disabled={disabled} />)}
            </div>
        );
    } else if (item.type === 'switch') {
        return (
            <div class="perms-item perms-switch">
                {item.name ? <span class="switch-name">{item.name}</span> : <span class="spacer" />}
                {reqNotice}
                <div class="switch-options">
                    {item.options.map((opt, i) => {
                        const isActive = hasPermission(ctx.permissions, ctx.memberFields, opt.id);
                        let className = 'perm-checkbox';
                        // if (state.active && state.impliedBy.size) className += ' is-implied-active';
                        if (ctx.showImplied.has(opt.id)) {
                            className += ' is-implier';
                        }

                        return (
                            <span class="switch-option" key={i}>
                                <Checkbox
                                    class={className}
                                    disabled={disabled}
                                    checked={isActive}
                                    onMouseOver={() => ctx.setShowImplied(opt.id)}
                                    onMouseOut={() => ctx.setShowImplied(null)}
                                    onClick={() => ctx.togglePerm(opt.id)} />
                                <span class="switch-option-label">
                                    {ctx.showRaw ? opt.id : opt.name}
                                </span>
                            </span>
                        );
                    })}
                </div>
            </div>
        );
    } else if (item.type === 'perm') {
        const isActive = hasPermission(ctx.permissions, ctx.memberFields, item.id);
        let className = 'perm-checkbox';
        // if (state.active && state.impliedBy.size) className += ' is-implied-active';
        if (ctx.showImplied.has(item.id)) {
            className += ' is-implier';
        }

        return (
            <div class="perms-item perms-perm">
                {reqNotice}
                <Checkbox
                    class={className}
                    disabled={disabled}
                    checked={isActive}
                    onMouseOver={() => ctx.setShowImplied(item.id)}
                    onMouseOut={() => ctx.setShowImplied(null)}
                    onClick={() => ctx.togglePerm(item.id)} />
                {ctx.showRaw ? item.id : item.name}
            </div>
        );
    } else if (item.type === '!memberRestrictionsSwitch') {
        return (
            <div class="perms-item perms-perm">
                {reqNotice}
                <Checkbox
                    class="perm-checkbox"
                    disabled={disabled}
                    checked={ctx.mrEnabled}
                    onClick={() => ctx.setMREnabled(!ctx.mrEnabled)} />
                {item.name}
            </div>
        );
    } else if (item === '!memberFieldsEditor') {
        if (!ctx.mrEnabled) return null;
        return (
            <MemberFieldsEditor
                disabled={disabled}
                fields={ctx.memberFields}
                toggleField={ctx.toggleField}
                toggleAll={ctx.toggleAllFields} />
        );
    } else if (item === '!memberFilterEditor') {
        if (!ctx.mrEnabled || !ctx.setMemberFilter) return null;
        const defaultValue = { filter: {} };
        return (
            <MemberFilterEditor
                disabled={disabled}
                filter={ctx.memberFilter || defaultValue}
                onFilterChange={ctx.setMemberFilter} />
        );
    }
    return 'unknown perms spec type ' + item.type;
}

function MemberFieldsEditor ({ disabled, fields, toggleField, toggleAll }) {
    const items = [];
    if (fields !== null) {
        for (const field in fieldsSpec) {
            const item = fieldsSpec[field];
            let canRead = true;
            let canWrite = true;
            for (const f of item.fields) {
                if (!fields[f] || !fields[f].includes('r')) canRead = false;
                if (!fields[f] || !fields[f].includes('w')) canWrite = false;
            }

            items.push(
                <tr class="member-field">
                    <td class="field-name">{item.name}</td>
                    <td class="field-perms">
                        <Checkbox
                            class={'perm-checkbox' + (canRead && canWrite ? ' is-implied-active' : '')}
                            disabled={disabled}
                            checked={canRead}
                            onClick={() => toggleField(field, 'r')} />
                        {memberFieldsRead}
                        {' \u00a0 \u00a0'}
                        <Checkbox
                            class="perm-checkbox"
                            disabled={disabled}
                            checked={canWrite}
                            onClick={() => toggleField(field, 'w')} />
                        {memberFieldsWrite}
                    </td>
                </tr>
            );
        }
    }

    return (
        <div class="member-fields-container">
            <table class="member-fields">
                <thead class="member-fields-all">
                    <tr>
                        <th>
                            <Checkbox
                                class="perm-checkbox"
                                disabled={disabled}
                                checked={fields === null}
                                onClick={toggleAll} />
                            {memberFieldsAll}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {items}
                </tbody>
            </table>
        </div>
    );
}

function MemberFilterEditor ({ disabled, filter, onFilterChange }) {
    return (
        <div class="member-filter-editor">
            <JSONEditor
                disabled={disabled}
                value={filter}
                onChange={onFilterChange} />
        </div>
    );
}
