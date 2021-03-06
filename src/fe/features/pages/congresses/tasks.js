import { h } from 'preact';
import { lazy, Suspense, useEffect, useRef } from 'preact/compat';
import { CircularProgress, TextField } from '@cpsdqs/yamdl';
import TaskDialog from '../../../components/task-dialog';
import { Field, Validator } from '../../../components/form';
import DetailShell from '../../../components/detail-shell';
import ChangedFields from '../../../components/changed-fields';
import Segmented from '../../../components/segmented';
import { TejoIcon, UeaIcon } from '../../../components/org-icon';
import MdField from '../../../components/md-field';
import { Required, timestamp } from '../../../components/data';
import {
    congresses as locale,
    congressInstances as instanceLocale,
    congressLocations as locationLocale,
    congressPrograms as programLocale,
    congressRegistrationForm as regFormLocale,
    congressParticipants as participantLocale,
    data as dataLocale,
} from '../../../locale';
import { connectPerms } from '../../../perms';
import { routerContext } from '../../../router';
import { FIELDS as INSTANCE_FIELDS } from './instances/fields';
import { DetailInner as LocationEditor } from './instances/locations/detail';
import LocationPicker from './instances/location-picker';
import './tasks.less';

const ParticipantEditor = lazy(async () => ({
    default: (await import('./instances/participants/detail')).Detail,
}));

const CREATE_INSTANCE_FIELDS = ['name', 'humanId', 'dateFrom', 'dateTo'];

export default {
    create: connectPerms(({ perms, open, task }) => {
        const hasTejo = perms.hasPerm('congresses.create.tejo');
        const hasUea = perms.hasPerm('congresses.create.uea');

        useEffect(() => {
            if (hasTejo !== hasUea) {
                if (hasTejo) task.update({ org: 'tejo' });
                else if (hasUea) task.update({ org: 'uea' });
            }
        });

        return (
            <routerContext.Consumer>
                {routerContext => (
                    <TaskDialog
                        open={open}
                        onClose={() => task.drop()}
                        title={locale.create.title}
                        actionLabel={locale.create.button}
                        run={() => task.runOnce().then(id => {
                            routerContext.navigate(`/kongresoj/${id}`);
                        })}>
                        <Field>
                            <Validator
                                component={TextField}
                                validate={value => {
                                    if (!value) throw { error: dataLocale.requiredField };
                                }}
                                outline
                                label={locale.fields.name}
                                value={task.parameters.name || ''}
                                onChange={e => task.update({ name: e.target.value })} />
                        </Field>
                        {hasTejo && hasUea && (
                            <Field>
                                <Validator
                                    component={Segmented}
                                    validate={() => {
                                        if (!task.parameters.org) throw { error: dataLocale.requiredField };
                                    }}
                                    selected={task.parameters.org}
                                    onSelect={org => task.update({ org })}>
                                    {[
                                        {
                                            id: 'tejo',
                                            label: <TejoIcon />,
                                        },
                                        {
                                            id: 'uea',
                                            label: <UeaIcon />,
                                        },
                                    ]}
                                </Validator>
                            </Field>
                        )}
                    </TaskDialog>
                )}
            </routerContext.Consumer>
        );
    }),
    update ({ open, task }) {
        return (
            <TaskDialog
                open={open}
                onClose={() => task.drop()}
                title={locale.update.title}
                actionLabel={locale.update.button}
                run={() => task.runOnce()}>
                <ChangedFields
                    changedFields={task.options._changedFields}
                    locale={locale.fields} />
            </TaskDialog>
        );
    },
    delete ({ open, task }) {
        return (
            <TaskDialog
                open={open}
                onClose={() => task.drop()}
                title={locale.delete.title}
                actionLabel={locale.delete.button}
                run={() => task.runOnce()}>
                {locale.delete.description}
            </TaskDialog>
        );
    },

    createInstance ({ open, task }) {
        const { congress } = task.options;

        const fields = CREATE_INSTANCE_FIELDS.map(id => {
            const Component = INSTANCE_FIELDS[id].component;
            return (
                <Field key={id}>
                    <Component
                        slot="create"
                        editing value={task.parameters[id]}
                        onChange={value => task.update({ [id]: value })} />
                </Field>
            );
        });


        return (
            <routerContext.Consumer>
                {routerContext => (
                    <TaskDialog
                        class="congresses-task-create-instance"
                        open={open}
                        onClose={() => task.drop()}
                        title={instanceLocale.create.title}
                        actionLabel={instanceLocale.create.button}
                        run={() => task.runOnce().then(id => {
                            routerContext.navigate(`/kongresoj/${congress}/okazigoj/${id}`);
                        })}>
                        {fields}
                    </TaskDialog>
                )}
            </routerContext.Consumer>
        );
    },
    updateInstance ({ open, task }) {
        return (
            <TaskDialog
                open={open}
                onClose={() => task.drop()}
                title={instanceLocale.update.title}
                actionLabel={instanceLocale.update.button}
                run={() => task.runOnce()}>
                <ChangedFields
                    changedFields={task.options._changedFields}
                    locale={instanceLocale.fields} />
            </TaskDialog>
        );
    },
    deleteInstance ({ open, task }) {
        return (
            <TaskDialog
                open={open}
                onClose={() => task.drop()}
                title={instanceLocale.delete.title}
                actionLabel={instanceLocale.delete.button}
                run={() => task.runOnce()}>
                {instanceLocale.delete.description}
            </TaskDialog>
        );
    },

    createLocation ({ open, task }) {
        const { congress, instance } = task.options;
        const mapPickerRef = useRef(null);

        return (
            <routerContext.Consumer>
                {routerContext => (
                    <TaskDialog
                        class="congresses-task-create-location"
                        data-type={task.parameters.type}
                        fullScreen={width => width < 600}
                        open={open}
                        onClose={() => task.drop()}
                        title={locationLocale.create.title}
                        actionLabel={locationLocale.create.button}
                        run={() => task.runOnce().then(id => {
                            routerContext.navigate(`/kongresoj/${congress}/okazigoj/${instance}/lokoj/${id}`);
                        })}>
                        <Field>
                            <Validator
                                component={Segmented}
                                validate={() => {
                                    if (!task.parameters.type) throw { error: dataLocale.requiredField };
                                }}
                                selected={task.parameters.type}
                                onSelect={type => {
                                    task.update({ type });
                                    // we need to update the map size after the animation
                                    setTimeout(() => {
                                        if (mapPickerRef.current) {
                                            mapPickerRef.current.map.invalidateSize();
                                        }
                                    }, 300);
                                }}>
                                {['external', 'internal'].map(k => ({
                                    id: k,
                                    label: locationLocale.fields.types[k],
                                }))}
                            </Validator>
                        </Field>
                        <LocationEditor
                            isCreation
                            congress={task.options.congress}
                            instance={task.options.instance}
                            id={null}
                            item={task.parameters}
                            editing={true}
                            onItemChange={data => task.update(data)} />
                    </TaskDialog>
                )}
            </routerContext.Consumer>
        );
    },
    updateLocation ({ open, task }) {
        return (
            <TaskDialog
                open={open}
                onClose={() => task.drop()}
                title={locationLocale.update.title}
                actionLabel={locationLocale.update.button}
                run={() => task.runOnce()}>
                <ChangedFields
                    changedFields={task.options._changedFields}
                    locale={locationLocale.fields} />
            </TaskDialog>
        );
    },
    deleteLocation ({ open, task }) {
        return (
            <TaskDialog
                open={open}
                onClose={() => task.drop()}
                title={locationLocale.delete.title}
                actionLabel={locationLocale.delete.button}
                run={() => task.runOnce()}>
                {locationLocale.delete.description}
            </TaskDialog>
        );
    },
    updateLocationThumbnail ({ open, task }) {
        return (
            <TaskDialog
                open={open}
                onClose={() => task.drop()}
                title={locationLocale.updateThumbnail.title}
                actionLabel={locationLocale.updateThumbnail.button}
                run={() => task.runOnce()}>
                {/* TODO */}
            </TaskDialog>
        );
    },

    createProgram ({ open, task }) {
        const { congress, instance } = task.options;

        return (
            <routerContext.Consumer>
                {routerContext => (
                    <TaskDialog
                        class="congresses-task-create-program"
                        open={open}
                        onClose={() => task.drop()}
                        title={programLocale.create.title}
                        actionLabel={programLocale.create.button}
                        run={() => task.runOnce().then(id => {
                            routerContext.navigate(`/kongresoj/${congress}/okazigoj/${instance}/programeroj/${id}`);
                        })}>
                        <Field>
                            <Validator
                                class="name-field"
                                component={TextField}
                                outline
                                label={<Required>{programLocale.fields.title}</Required>}
                                validate={value => {
                                    if (!value) throw { error: dataLocale.requiredField };
                                }}
                                value={task.parameters.title || ''}
                                onChange={e => task.update({ title: e.target.value })} />
                        </Field>
                        <Field>
                            <label class="field-label">{programLocale.fields.description}</label>
                            <MdField
                                editing value={task.parameters.description || null}
                                onChange={value => task.update({ description: value || null })}
                                rules={['emphasis', 'strikethrough', 'link', 'list', 'table', 'image']} />
                        </Field>
                        <Field>
                            <TextField
                                class="name-field"
                                outline label={programLocale.fields.owner}
                                value={task.parameters.owner || ''}
                                onChange={e => task.update({ owner: e.target.value || null })} />
                        </Field>
                        <Field>
                            <Validator
                                class="date-field"
                                component={timestamp.editor}
                                zone={task.options.tz}
                                outline
                                label={<Required>{programLocale.fields.timeFrom}</Required>}
                                validate={value => {
                                    if (!value) throw { error: dataLocale.requiredField };
                                }}
                                value={task.parameters.timeFrom || null}
                                onChange={timeFrom => task.update({ timeFrom })} />
                        </Field>
                        <Field>
                            <Validator
                                class="date-field"
                                component={timestamp.editor}
                                zone={task.options.tz}
                                outline
                                label={<Required>{programLocale.fields.timeTo}</Required>}
                                validate={value => {
                                    if (!value) throw { error: dataLocale.requiredField };
                                }}
                                value={task.parameters.timeTo || null}
                                onChange={timeTo => task.update({ timeTo })} />
                        </Field>
                        <Field>
                            <LocationPicker
                                congress={congress}
                                instance={instance}
                                editing value={task.parameters.location || null}
                                onChange={location => task.update({ location })} />
                        </Field>
                    </TaskDialog>
                )}
            </routerContext.Consumer>
        );
    },
    updateProgram ({ open, task }) {
        return (
            <TaskDialog
                open={open}
                onClose={() => task.drop()}
                title={programLocale.update.title}
                actionLabel={programLocale.update.button}
                run={() => task.runOnce()}>
                <ChangedFields
                    changedFields={task.options._changedFields}
                    locale={programLocale.fields} />
            </TaskDialog>
        );
    },
    deleteProgram ({ open, task }) {
        return (
            <TaskDialog
                open={open}
                onClose={() => task.drop()}
                title={programLocale.delete.title}
                actionLabel={programLocale.delete.button}
                run={() => task.runOnce()}>
                {programLocale.delete.description}
            </TaskDialog>
        );
    },
    setRegistrationForm ({ open, task }) {
        return (
            <TaskDialog
                open={open}
                onClose={() => task.drop()}
                title={regFormLocale.update.title}
                actionLabel={regFormLocale.update.button}
                run={() => task.runOnce()}>
                <ChangedFields
                    changedFields={task.options._changedFields}
                    locale={programLocale.fields} />
            </TaskDialog>
        );
    },
    deleteRegistrationForm ({ open, task }) {
        return (
            <TaskDialog
                open={open}
                onClose={() => task.drop()}
                title={regFormLocale.delete.title}
                actionLabel={regFormLocale.delete.button}
                run={() => task.runOnce()}>
                {regFormLocale.delete.description}
            </TaskDialog>
        );
    },

    createParticipant ({ open, task }) {
        const { congress, instance } = task.options;

        return (
            <TaskDialog
                class="congresses-task-create-participant"
                open={open}
                onClose={() => task.drop()}
                title={participantLocale.create.title}
                actionLabel={participantLocale.create.button}
                run={() => task.runOnce()}>
                <DetailShell
                    view="congresses/registrationForm"
                    options={{ congress, instance }}
                    id="irrelevant" // detail shell won't work without one
                    fields={{}}
                    locale={{}}>
                    {registrationForm => registrationForm ? (
                        <Suspense
                            fallback={<CircularProgress indeterminate />}>
                            <ParticipantEditor
                                editing
                                creating
                                item={task.parameters}
                                onItemChange={item => task.update(item)}
                                userData={{
                                    congress,
                                    instance,
                                    currency: registrationForm.price && registrationForm.currency,
                                    registrationForm,
                                }} />
                        </Suspense>
                    ) : <CircularProgress indeterminate />}
                </DetailShell>
            </TaskDialog>
        );
    },
    updateParticipant ({ open, task }) {
        return (
            <TaskDialog
                open={open}
                onClose={() => task.drop()}
                title={participantLocale.update.title}
                actionLabel={participantLocale.update.button}
                run={() => task.runOnce()}>
                <ChangedFields
                    changedFields={task.options._changedFields}
                    locale={participantLocale.fields} />
            </TaskDialog>
        );
    },
    deleteParticipant ({ open, task }) {
        return (
            <TaskDialog
                open={open}
                onClose={() => task.drop()}
                title={participantLocale.delete.title}
                actionLabel={participantLocale.delete.button}
                run={() => task.runOnce()}>
                {participantLocale.delete.description}
            </TaskDialog>
        );
    },
};
