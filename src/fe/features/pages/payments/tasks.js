import { h } from 'preact';
import { TextField } from '@cpsdqs/yamdl';
import TaskDialog from '../../../components/task-dialog';
import Segmented from '../../../components/segmented';
import ChangedFields from '../../../components/changed-fields';
import DynamicHeightDiv from '../../../components/dynamic-height-div';
import { Validator, Field } from '../../../components/form';
import { connectPerms } from '../../../perms';
import { routerContext } from '../../../router';
import {
    paymentOrgs as orgLocale,
    paymentAddons as addonLocale,
    paymentMethods as methodLocale,
} from '../../../locale';
import { CREATION_FIELDS as methodFields } from './orgs/methods/fields';
import './tasks.less';

export default {
    createOrg: connectPerms(({ perms, open, task }) => {
        let orgSelector;

        const hasTejo = perms.hasPerm('pay.payment_orgs.create.tejo');
        const hasUea = perms.hasPerm('pay.payment_orgs.create.uea');

        if (hasTejo && hasUea) {
            orgSelector = (
                <Validator
                    component={Segmented}
                    value={task.parameters.org}
                    validate={value => {
                        if (!value) throw {};
                    }}
                    selected={task.parameters.org}
                    onSelect={org => task.update({ org })}>
                    {Object.entries(orgLocale.create.orgs).map(([k, v]) => ({ id: k, label: v }))}
                </Validator>
            );
        } else if (!task.parameters.org) {
            task.update({ org: hasTejo ? 'tejo' : 'uea' });
        }

        return (
            <routerContext.Consumer>
                {routerContext => (
                    <TaskDialog
                        open={open}
                        onClose={() => task.drop()}
                        title={orgLocale.create.title}
                        actionLabel={orgLocale.create.button}
                        run={() => task.runOnce().then(id => {
                            routerContext.navigate(`/aksopago/organizoj/${id}`);
                        })}>
                        {orgSelector}
                        <Field>
                            <Validator
                                component={TextField}
                                validate={value => {
                                    if (!value) throw { error: orgLocale.update.nameRequired };
                                }}
                                label={orgLocale.fields.name}
                                value={task.parameters.name || ''}
                                onChange={e => task.update({ name: e.target.value })} />
                        </Field>
                        <Field>
                            <TextField
                                label={orgLocale.fields.description}
                                value={task.parameters.description || ''}
                                onChange={e => task.update({ description: e.target.value || null })} />
                        </Field>
                    </TaskDialog>
                )}
            </routerContext.Consumer>
        );
    }),

    createAddon ({ open, task }) {
        const org = task.options.org;

        return (
            <routerContext.Consumer>
                {routerContext => (
                    <TaskDialog
                        open={open}
                        onClose={() => task.drop()}
                        title={addonLocale.create.title}
                        actionLabel={addonLocale.create.button}
                        run={() => task.runOnce().then(id => {
                            routerContext.navigate(`/aksopago/organizoj/${org}/donacebloj/${id}`);
                        })}>
                        <Field>
                            <Validator
                                component={TextField}
                                validate={value => {
                                    if (!value) throw { error: addonLocale.update.nameRequired };
                                }}
                                label={addonLocale.fields.name}
                                value={task.parameters.name || ''}
                                onChange={e => task.update({ name: e.target.value })} />
                        </Field>
                        <Field>
                            <TextField
                                label={addonLocale.fields.description}
                                value={task.parameters.description || ''}
                                onChange={e => task.update({ description: e.target.value || null })} />
                        </Field>
                    </TaskDialog>
                )}
            </routerContext.Consumer>
        );
    },

    createMethod ({ open, task }) {
        const org = task.options.org;

        const item = task.parameters;
        const fields = [];
        for (const f in methodFields) {
            const field = methodFields[f];
            if (field.shouldHide && field.shouldHide(item, true)) continue;
            const Component = field.component;

            fields.push(
                <Field key={f}>
                    {field.wantsCreationLabel ? (
                        <label class="creation-label">
                            {methodLocale.fields[f]}
                        </label>
                    ) : null}
                    <Component
                        value={item[f]}
                        editing={true}
                        onChange={value => task.update({ [f]: value })}
                        item={item}
                        isCreation={true}
                        onItemChange={value => task.update(value)} />
                </Field>
            );
        }

        return (
            <routerContext.Consumer>
                {routerContext => (
                    <TaskDialog
                        class="payment-method-task-create"
                        open={open}
                        onClose={() => task.drop()}
                        title={methodLocale.create.title}
                        actionLabel={methodLocale.create.button}
                        run={() => task.runOnce().then(id => {
                            routerContext.navigate(`/aksopago/organizoj/${org}/metodoj/${id}`);
                        })}>
                        <DynamicHeightDiv>
                            {fields}
                        </DynamicHeightDiv>
                    </TaskDialog>
                )}
            </routerContext.Consumer>
        );
    },

    updateOrg ({ open, task }) {
        return (
            <TaskDialog
                open={open}
                onClose={() => task.drop()}
                title={orgLocale.update.title}
                actionLabel={orgLocale.update.button}
                run={() => task.runOnce()}>
                <ChangedFields
                    changedFields={task.options._changedFields}
                    locale={orgLocale.fields} />
            </TaskDialog>
        );
    },

    updateAddon ({ open, task }) {
        return (
            <TaskDialog
                open={open}
                onClose={() => task.drop()}
                title={addonLocale.update.title}
                actionLabel={addonLocale.update.button}
                run={() => task.runOnce()}>
                <ChangedFields
                    changedFields={task.options._changedFields}
                    locale={addonLocale.fields} />
            </TaskDialog>
        );
    },

    updateMethod ({ open, task }) {
        return (
            <TaskDialog
                open={open}
                onClose={() => task.drop()}
                title={methodLocale.update.title}
                actionLabel={methodLocale.update.button}
                run={() => task.runOnce()}>
                <ChangedFields
                    changedFields={task.options._changedFields}
                    locale={methodLocale.fields} />
            </TaskDialog>
        );
    },


    deleteOrg ({ open, task }) {
        return (
            <TaskDialog
                open={open}
                onClose={() => task.drop()}
                title={orgLocale.delete.title}
                actionLabel={orgLocale.delete.button}
                run={() => task.runOnce()}>
                {orgLocale.delete.description}
            </TaskDialog>
        );
    },
    deleteAddon ({ open, task }) {
        return (
            <TaskDialog
                open={open}
                onClose={() => task.drop()}
                title={addonLocale.delete.title}
                actionLabel={addonLocale.delete.button}
                run={() => task.runOnce()}>
                {addonLocale.delete.description}
            </TaskDialog>
        );
    },
    deleteMethod ({ open, task }) {
        return (
            <TaskDialog
                open={open}
                onClose={() => task.drop()}
                title={methodLocale.delete.title}
                actionLabel={methodLocale.delete.button}
                run={() => task.runOnce()}>
                {methodLocale.delete.description}
            </TaskDialog>
        );
    },
};