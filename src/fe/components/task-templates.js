import { h } from 'preact';
import TaskDialog from './task-dialog';
import ChangedFields from './changed-fields';
import { Field } from './form';
import { routerContext } from '../router';

export function createDialog ({ locale, fieldNames, fields: fieldDefs, className, onCompletion }) {
    return ({ open, task }) => {
        const fields = fieldNames.map(id => {
            const def = fieldDefs[id];
            const Component = def.component;
            return (
                <Field key={id}>
                    {def.wantsCreationLabel && (
                        <label class="creation-label">
                            {locale.fields[id]}
                        </label>
                    )}
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
                        class={className}
                        open={open}
                        onClose={() => task.drop()}
                        title={locale.create.title}
                        actionLabel={locale.create.button}
                        run={() => task.runOnce().then(id => {
                            onCompletion(task, routerContext, id);
                        })}>
                        {fields}
                    </TaskDialog>
                )}
            </routerContext.Consumer>
        );
    };
}
export function updateDialog ({ locale, fields }) {
    return ({ open, task }) => {
        return (
            <TaskDialog
                open={open}
                onClose={() => task.drop()}
                title={locale.title}
                actionLabel={locale.button}
                run={() => task.runOnce()}>
                <ChangedFields
                    changedFields={task.options._changedFields}
                    locale={fields} />
            </TaskDialog>
        );
    };
}
export function deleteDialog ({ locale }) {
    return ({ open, task }) => {
        return (
            <TaskDialog
                open={open}
                onClose={() => task.drop()}
                title={locale.title}
                actionLabel={locale.button}
                run={() => task.runOnce()}>
                {locale.description}
            </TaskDialog>
        );
    };
}

